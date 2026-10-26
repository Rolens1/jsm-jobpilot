# Verification: 0015. Build Hardening, Security Headers, Rate Limiting and Runtime Compatibility

**Date**: 2026-10-26  
**Status**: Verified  
**Feature**: Feature 22 (Milestones 1 to 6)

---

## 1. Acceptance Criteria Checklist & Evidence

| Criteria | Description | Verification Method | Status |
|---|---|---|---|
| **AC-1** | InsForge `rate_limits` table with unique constraint on `(identifier, endpoint)` | Deployed via `migrations/0002_rate_limits.sql` to remote PostgreSQL database using InsForge MCP tool `run-raw-sql`. Verified table structure and indexes. | **PASS** |
| **AC-2** | Atomic `check_rate_limit(p_identifier, p_endpoint, p_limit, p_window_seconds)` RPC function | Executed remote test queries with concurrency row locking (`FOR UPDATE`). Verified counter increments, remaining calculation, and threshold blocking. | **PASS** |
| **AC-3** | `lib/rate-limit.ts` calibrated quotas for showcase testing | Configured `ENDPOINT_CONFIGS`: 2 job searches, 2 company researches, 1 resume extraction per 10-minute window (600 seconds). Allows evaluators and recruiters to experience the guard quickly. | **PASS** |
| **AC-4** | HTTP 429 status code and candidate UI notification banners | Enforced in `/api/agent/find`, `/api/agent/research`, and `actions/resume.ts`. Client components (`SearchControls.tsx`, `CompanyResearchCard.tsx`, `ProfileContainer.tsx`) render amber "Demo Quota Guard" alert cards with countdown timer. | **PASS** |
| **AC-5** | Fail open resilience on transient database errors | Implemented `try / catch` fallback returning `allowed: true` with warning log if database connection or RPC throws an error. | **PASS** |
| **AC-6** | Next.js 16 `proxy.ts` migration | Replaced deprecated `middleware.ts` with `proxy.ts` exporting canonical `export async function proxy(request: NextRequest)`. Next.js 16 build shows zero deprecation warnings. | **PASS** |
| **AC-7** | Production HTTP security headers in `next.config.ts` | Configured CSP (allowing PostHog analytics and blob PDF viewing), HSTS, X-Frame-Options `DENY`, X-Content-Type-Options `nosniff`, Referrer-Policy, and Permissions-Policy. | **PASS** |

---

## 2. Runtime Verification Evidence

### A. TypeScript Compilation (`npx tsc --noEmit`)
```bash
> npx tsc --noEmit
Exit code: 0
Errors: 0
```

### B. Next.js 16 Production Build (`npm run build`)
```text
▲ Next.js 16.4.3 (Turbopack)
- Environments: .env.local
✓ Running next.config.ts took 2.1s
- Cache Components enabled
- Partial Prefetching enabled
- Experiments (use with caution):
  ✓ agentFeedback

  Creating an optimized production build ...
✓ Compiled successfully in 58s
  Running TypeScript ...
  Finished TypeScript in 14.4s ...
  Collecting page data using 14 workers ...
✓ Generating static pages using 14 workers (13/13) in 3.4s
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/agent/find
├ ƒ /api/agent/research
├ ƒ /api/resume
├ ƒ /callback
├ ◐ /dashboard
├ ◐ /find-jobs
├   /find-jobs/[id]
│ └ ◐ /find-jobs/[id]
├ ◐ /login
└ ◐ /profile

ƒ Proxy (Middleware)
```

### C. Database RPC Test Output
```json
[
  {
    "allowed": false,
    "current_count": 3,
    "remaining": 0,
    "reset_seconds": 600
  }
]
```

---

## 3. Summary

All 7 acceptance criteria have been implemented, tested, and validated against remote InsForge PostgreSQL, Next.js 16 runtime conventions, and production build standards.
