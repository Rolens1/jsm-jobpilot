# 0015. Build Hardening, Security Headers, Rate Limiting and Runtime Compatibility

**Date**: 2026-10-26  
**Status**: Completed  

## Summary

This specification defines the production hardening and abuse prevention architecture for Feature 22. We introduce an atomic database backed rate limiter in `lib/rate-limit.ts` powered by an InsForge PostgreSQL table and RPC function that protects expensive AI and job aggregator endpoints from quota exhaustion. We also implement comprehensive HTTP security headers and Content Security Policy directives in `next.config.ts`, and migrate `middleware.ts` to `proxy.ts` conforming to the Next.js 16 canonical edge routing convention.

## Requirements

**User stories**:
- As a candidate using JobPilot, I want generous usage quotas that support active job searching without artificial friction while keeping the service protected from automated scrapers.
- As an engineering team maintainer, I want expensive third party API calls (RapidAPI, Jooble, Adzuna, and AI models) shielded by rate limiting so that random public traffic cannot deplete monthly quotas.
- As an end user browsing the application, I want strong browser security headers that protect against cross site scripting, clickjacking, and content sniffing without breaking PostHog analytics or PDF resume rendering.
- As a DevOps engineer running Next.js 16 builds, I want edge routing configured without deprecation warnings so that production deployment is clean and forward compatible.

**Acceptance criteria**:
- **AC-1**: An InsForge PostgreSQL table `rate_limits` stores window counters uniquely identified by candidate user ID (or client IP address for unauthenticated requests) and target endpoint.
- **AC-2**: An atomic PostgreSQL function `check_rate_limit(p_identifier, p_endpoint, p_limit, p_window_seconds)` increments and validates quotas in a single round trip, preventing concurrency race conditions.
- **AC-3**: A TypeScript helper `lib/rate-limit.ts` wraps the RPC call and enforces demo calibrated quotas across a 10 minute window (600 seconds): 2 job discovery searches, 2 company research requests, and 1 resume AI extraction per candidate (or per unauthenticated IP), allowing recruiters and visitors to experience the rate limiting guard while ensuring resets occur in minutes.
- **AC-4**: When a candidate reaches their quota limit, API routes (`/api/agent/find`, `/api/agent/research`, and `actions/resume.ts`) return HTTP 429 Too Many Requests status codes with standard `Retry-After` headers and localized candidate friendly notification alert payloads rendered as an elegant warning banner and toast with live countdown timer.
- **AC-5**: If the InsForge rate limit check experiences a transient database error, the limiter fails open with an explanatory server log warning, ensuring database hiccups do not block legitimate candidates.
- **AC-6**: `middleware.ts` is migrated to `proxy.ts` adhering to the Next.js 16 standard, preserving all existing authentication session synchronization and cookie forwarding while eliminating deprecation warnings.
- **AC-7**: `next.config.ts` configures comprehensive production security headers including Content-Security-Policy (with explicit allowances for PostHog analytics and blob iframe resume rendering), Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy.

## Decision

**Chosen option**: Atomic PostgreSQL rate limiting via InsForge RPC function with fail open resilience, Next.js 16 proxy convention migration, and strict Content Security Policy headers.

We choose to implement rate limiting directly in our existing InsForge PostgreSQL database rather than adopting an external service like Upstash Redis. This eliminates extra third party accounts, extra credentials, and recurring costs while taking advantage of our existing database connection. Executing the check via an atomic PostgreSQL function guarantees that multiple simultaneous requests cannot bypass the quota. We also migrate `middleware.ts` to `proxy.ts` to cleanly resolve Next.js 16 deprecation notices, and configure production HTTP security headers tailored to PostHog and in browser PDF preview requirements.

**Implementation skills**: InsForge PostgreSQL functions and schema migrations, Next.js 16 Proxy conventions, HTTP Security Headers, TypeScript rate limiting utilities.

## Value Sourcing

| Value / Constraint | Category | Source | Fallback / Behavior |
|---|---|---|---|
| `identifier` | Rate Limit Key | Candidate `user.id` from InsForge session | Client IP address from `x-forwarded-for` or `x-real-ip` headers |
| `endpoint` | Rate Limit Bucket | Route identifier (`job_search`, `company_research`, `resume_extract`) | Explicit parameter in route handler call |
| `p_limit` | Quota Threshold | Hardcoded constant in `lib/rate-limit.ts` (2 for search, 2 for research, 1 for resume) | Configurable default |
| `p_window_seconds` | Window Duration | Hardcoded constant in `lib/rate-limit.ts` (600 seconds = 10 minutes) | 600 seconds |
| `allowed` | Decision Boolean | Returned by `check_rate_limit` RPC | `true` if database call throws (fail open) |
| `retryAfter` | Reset Duration | Calculated by `check_rate_limit` RPC | 60 seconds default |

## Rationale

Reasoning and alternatives: see [rationale.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0015-security-headers-rate-limiting/rationale.md).

## Feature Design

### 1. Database Schema & RPC Migration (`rate_limits`)

```sql
-- Create rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rate_limits_identifier_endpoint_key UNIQUE (identifier, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits (identifier, endpoint);

-- Atomic check and increment function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_limit INT,
  p_window_seconds INT
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INT,
  remaining INT,
  reset_seconds INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rec public.rate_limits%ROWTYPE;
  v_now TIMESTAMPTZ := now();
  v_elapsed INT;
BEGIN
  SELECT * INTO v_rec
  FROM public.rate_limits
  WHERE identifier = p_identifier AND endpoint = p_endpoint
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.rate_limits (identifier, endpoint, count, window_start, updated_at)
    VALUES (p_identifier, p_endpoint, 1, v_now, v_now);

    RETURN QUERY SELECT TRUE, 1, p_limit - 1, p_window_seconds;
    RETURN;
  END IF;

  v_elapsed := EXTRACT(EPOCH FROM (v_now - v_rec.window_start))::INT;

  IF v_elapsed >= p_window_seconds THEN
    UPDATE public.rate_limits
    SET count = 1, window_start = v_now, updated_at = v_now
    WHERE id = v_rec.id;

    RETURN QUERY SELECT TRUE, 1, p_limit - 1, p_window_seconds;
    RETURN;
  END IF;

  IF v_rec.count < p_limit THEN
    UPDATE public.rate_limits
    SET count = v_rec.count + 1, updated_at = v_now
    WHERE id = v_rec.id;

    RETURN QUERY SELECT TRUE, v_rec.count + 1, p_limit - (v_rec.count + 1), p_window_seconds - v_elapsed;
    RETURN;
  ELSE
    RETURN QUERY SELECT FALSE, v_rec.count, 0, p_window_seconds - v_elapsed;
    RETURN;
  END IF;
END;
$$;
```

### 2. Rate Limiting Service (`lib/rate-limit.ts`)

```typescript
import { createServerClient } from "./insforge-server";
import { headers } from "next/headers";

export type RateLimitEndpoint = "job_search" | "company_research" | "resume_extract";

interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

const ENDPOINT_CONFIGS: Record<RateLimitEndpoint, RateLimitConfig> = {
  job_search: { limit: 5, windowSeconds: 600 },
  company_research: { limit: 3, windowSeconds: 600 },
  resume_extract: { limit: 2, windowSeconds: 600 },
};

export async function checkRateLimit(endpoint: RateLimitEndpoint, userId?: string | null) {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const realIp = headerList.get("x-real-ip");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";

    const identifier = userId || `ip:${clientIp}`;
    const config = ENDPOINT_CONFIGS[endpoint];

    const client = await createServerClient();
    const { data, error } = await client.rpc("check_rate_limit", {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_limit: config.limit,
      p_window_seconds: config.windowSeconds,
    });

    if (error || !data || data.length === 0) {
      console.warn("⚠️ Rate limit database check failed, failing open:", error?.message);
      return { allowed: true, remaining: config.limit, retryAfter: 0 };
    }

    const result = data[0];
    return {
      allowed: Boolean(result.allowed),
      current: Number(result.current_count),
      remaining: Math.max(0, Number(result.remaining)),
      retryAfter: Math.max(0, Number(result.reset_seconds)),
    };
  } catch (err) {
    console.warn("⚠️ Rate limiter encountered exception, failing open:", err);
    return { allowed: true, remaining: 10, retryAfter: 0 };
  }
}
```

### 3. Next.js 16 Proxy Migration (`proxy.ts`)

Migrate `middleware.ts` to `proxy.ts`:
- Replace deprecated `middleware` convention with modern Next.js 16 `proxy` export.
- Retain token synchronization cookies (`setAuthCookies`, `clearAuthCookies`).
- Ensure matcher routes exclude static assets and ingest paths.

### 4. HTTP Security Headers in `next.config.ts`

```typescript
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://us.i.posthog.com https://us-assets.i.posthog.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https: https://*.insforge.app",
      "font-src 'self' data:",
      "connect-src 'self' https://*.insforge.app wss://*.insforge.app https://us.i.posthog.com https://us-assets.i.posthog.com https://*.rapidapi.com https://*.jooble.org https://*.adzuna.com",
      "frame-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];
```

### 5. Critical Test Scenarios

- Happy path: An authenticated candidate makes a job search request; `checkRateLimit` increments counter and permits execution, satisfies **AC-1**, **AC-2**, **AC-3**.
- Quota exceeded case: Making more than 5 search requests within 10 minutes returns HTTP 429 with `Retry-After` header and candidate alert, satisfies **AC-4**.
- Fail open case: If database RPC call throws or times out, request is allowed through with a warning log, satisfies **AC-5**.
- Proxy execution: Next.js 16 build evaluates `proxy.ts` without any middleware deprecation notices, satisfies **AC-6**.
- Security headers check: `curl -I` or browser response verification confirms CSP, HSTS, and X-Content-Type-Options headers on all page requests, satisfies **AC-7**.

## Build Plan

1. Create migration file `migrations/0002_rate_limits.sql` defining `rate_limits` table, index, and atomic `check_rate_limit` RPC function, and apply it to InsForge PostgreSQL, satisfies **AC-1**, **AC-2**.
2. Implement `lib/rate-limit.ts` service with endpoint configurations, identifier resolution, and fail open resilience, satisfies **AC-3**, **AC-5**.
3. Integrate rate limiting into route handlers `/api/agent/find`, `/api/agent/research`, and Server Action `actions/resume.ts`, returning HTTP 429 on exhaustion, satisfies **AC-4**.
4. Migrate `middleware.ts` to `proxy.ts` conforming to Next.js 16 conventions, satisfies **AC-6**.
5. Configure HTTP security headers in `next.config.ts` including strict CSP with PostHog and blob iframe allowances, satisfies **AC-7**.
6. Run build verification (`npm run build` and `npx tsc --noEmit`) to confirm clean compilation and zero deprecation warnings, satisfies **AC-6**, **AC-7**.

## Consequences

**Positive**:
- Shields external API accounts from unexpected credit exhaustion.
- Resolves Next.js 16 deprecation warnings cleanly before production release.
- Hardens browser client against cross site scripting, clickjacking, and injection.
- Zero extra third party subscriptions or credentials required.
- Easy for recruiters and evaluators to trigger and see production rate limiting in action within 3 to 5 clicks.

**Negative / tradeoffs**:
- Candidates making more than 5 searches or 3 company researches in 10 minutes must wait for their window to reset.

**Neutral**:
- Rate limit records accumulate over time; a lightweight cleanup query or table truncate can be run periodically if desired.

## Follow-up

- [ ] Apply `migrations/0002_rate_limits.sql` to InsForge database via MCP or SQL console during `/develop feature 22`.
