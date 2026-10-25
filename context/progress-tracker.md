# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 2 — Profile Page
**Last completed:** 04 Database Schema
**Next:** 05 Profile Page — Full UI

---

## Progress

### Phase 1 — Foundation

- [x] 01 Homepage
- [x] 02 Auth
- [x] 03 PostHog Initialization
- [x] 04 Database Schema

### Phase 2 — Profile Page

- [ ] 05 Profile Page — Full UI
- [ ] 06 Profile Save Logic
- [ ] 07 AI Profile Extraction from Resume
- [ ] 08 Resume PDF Generation from Profile

### Phase 3 — Find Jobs Page

- [ ] 09 Find Jobs Page — Full UI
- [ ] 10 Adzuna Job Discovery
- [ ] 11 Filter + Sort + Pagination

### Phase 4 — Job Details Page

- [ ] 12 Job Details Page — Full UI
- [ ] 13 Company Research Agent

### Phase 5 — Dashboard

- [ ] 14 Dashboard Page — Full UI
- [ ] 15 Stats Bar — Real Data
- [ ] 16 Recent Activity — Real Data
- [ ] 17 Analytics Charts — PostHog Data

---

## Decisions Made During Build

- **Client vs Server Architecture**: Used `@insforge/sdk` for browser client (`lib/insforge-client.ts`) and `@insforge/sdk/ssr` for server client (`lib/insforge-server.ts`).
- **Session Persistence**: Created `actions/auth.ts` server actions leveraging `@insforge/sdk/ssr/middleware` (`setAuthCookies`, `clearAuthCookies`) to synchronize tokens into HTTP-only cookies (`insforge_access_token`, `insforge_refresh_token`) on the Next.js host, allowing `middleware.ts` and Server Components to authenticate instantly.
- **Next.js 16 Partial Prerendering**: Wrapped dynamic parameters and session checks in `<Suspense>` boundaries in `/login` and `/callback` to ensure build-time prerendering succeeds with 0 errors.
- **PostHog Dual-Client Integration**: Built `lib/posthog-client.ts` (`posthog-js`) with `PostHogProvider` client component wrapping root layout (`app/layout.tsx`), and `lib/posthog-server.ts` (`posthog-node` with `flushAt: 1, flushInterval: 0`).
- **Canonical Event Contracts**: Typed and exposed the 4 project events (`job_search_started`, `job_found`, `profile_completed`, `company_researched`) client-side and server-side via `actions/analytics.ts`. Added interactive event dispatcher on the Dashboard.
- **Normalized InsForge Database Schema**: Established `profiles`, `agent_runs`, `jobs`, and `agent_logs` tables in InsForge PostgreSQL. Enforced user-isolated Row Level Security (RLS) on all tables, foreign key cascade constraints, unique composite constraint on `(user_id, source_url)` with upsert support, and auto-provisioning trigger from `auth.users`. Created private `resumes` storage bucket with authenticated user path isolation. Added TypeScript definitions in `types/database.ts`.

---

## Notes

- InsForge SDK uses PKCE flow for OAuth with code verifier automatically stored in browser storage.
- Backend OAuth providers verified active: Google and GitHub (`https://pprn26i7.us-east.insforge.app`).
- Next.js 16 logs a deprecation notice for `middleware.ts` in favor of `proxy.ts`, but `middleware.ts` remains fully functional and tested.
