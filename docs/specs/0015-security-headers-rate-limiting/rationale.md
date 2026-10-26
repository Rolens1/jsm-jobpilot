# 0015. Build Hardening, Security Headers, Rate Limiting and Runtime Compatibility: Rationale and Alternatives

**Date**: 2026-10-26  
**Status**: Proposed  

## Context

JobPilot integrates multiple third party services that charge for usage or enforce strict upstream request quotas, including RapidAPI JSearch, Jooble, Adzuna, and LLM inference providers. In a public production deployment, unmetered endpoints expose the project to automated scraping, denial of wallet attacks, and rapid credential exhaustion.

Simultaneously, Next.js 16 issues deprecation notices during build time because `middleware.ts` is superseded by the `proxy.ts` convention for edge request handling. Additionally, standard production deployments on Vercel require comprehensive HTTP security headers to protect candidates from cross site scripting, clickjacking, and sniffing vulnerabilities without breaking third party analytics or client side PDF rendering.

## Options Considered

### Option 1: External Redis Cache (@upstash/ratelimit) (Rejected)

In this approach, the application connects to a managed Upstash Redis instance to manage sliding window rate limits.

*Why rejected*:
- Requires creating and maintaining an external third party account with additional API tokens (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`).
- Adds network hops to an external cloud provider for every protected API request.
- Unnecessary operational sprawl when InsForge PostgreSQL is already active and capable of atomic quota management.

### Option 2: In Memory Cache (lru-cache) (Rejected)

In this approach, rate limiting counters are stored in server memory using an LRU cache.

*Why rejected*:
- Fails on serverless infrastructure: Vercel functions spin up and down independently, so memory is not shared across lambda instances.
- A malicious actor sending concurrent requests hits multiple distinct instances, completely bypassing the intended quota.

### Option 3: Atomic PostgreSQL Rate Limiting via InsForge RPC Function with Next.js 16 Proxy Migration and Strict Security Headers (Recommended)

In this approach, a lightweight table `rate_limits` stores window counts in InsForge PostgreSQL, updated via an atomic `check_rate_limit` RPC function. Quotas are generous (25 searches and research requests per hour) with fail open resilience. `middleware.ts` is migrated to `proxy.ts`, and strict HTTP security headers are configured in `next.config.ts`.

*Why chosen*:
- Reuses existing proven infrastructure: utilizes InsForge PostgreSQL with zero new external accounts or costs.
- Concurrency safe: atomic row locking in the PostgreSQL function prevents race conditions.
- Resilient: fails open if the database connection encounters transient errors, preventing false rejections for legitimate candidates.
- Forward compatible: eliminates Next.js 16 middleware deprecation warnings.
- Production hardened: establishes robust CSP and HSTS protections tailored to PostHog and in app resume viewing.

## Rationale

This decision prioritizes operational simplicity, cost efficiency, and security rigor. 

Adopting Upstash Redis would add another external vendor and credential set to maintain, whereas InsForge PostgreSQL is already our trusted data store. Implementing the check as a single PostgreSQL function ensures that quota validation executes in a single round trip with atomic guarantees. 

Generous limits (25 requests an hour) give candidates complete freedom to test and explore JobPilot while preventing abusive bots from exhausting API keys. Migrating to `proxy.ts` keeps our Next.js 16 setup aligned with the latest canonical standard, and custom Content Security Policy headers protect candidates while permitting essential PostHog tracking and PDF blob rendering.
