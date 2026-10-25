# Handoff / Session Memory

> Generated: 2026-10-24T19:44:00-04:00  
> Project: JobPilot (`d:/Ai Projects/job-pilot`)  
> Session summary: Successfully debugged and verified PostHog integration in Next.js 16 (App Router + Turbopack). Resolved the `[PostHog.js] [SessionRecording] "could not load recorder"` console issue by disabling session recording, configured reverse proxy `/ingest` rewrites in `next.config.ts`, fixed Next.js 16 dynamic prerender `Date.now()` boundaries with `await connection()`, fixed `<Image>` aspect ratio styles, and confirmed 100% clean production build (`npm run build` exit code 0). Completed `/code-review-and-quality` audit and updated project memory. Ready for Feature 04 (Database Schema).

## Goal

Build JobPilot, an AI-powered job hunting assistant using Next.js 16 (App Router), InsForge backend (Auth, DB, Storage), Browserbase + Stagehand for company research, Adzuna API for job discovery, OpenAI GPT-4o for matching/synthesis, and PostHog for analytics. Follow the 17-feature build plan in `context/build-plan.md`.

## Current State

**Completed & Confirmed Working:**
- **Feature 01: Homepage** is fully implemented and compiled cleanly with `npm run build` (Next.js 16.4.3 Turbopack, 0 errors).
- **Feature 02: Auth** is fully implemented and compiled cleanly with `npm run build`:
  - `@insforge/sdk@1.5.2` installed with credentials in `.env.local`.
  - Browser client in [lib/insforge-client.ts](file:///d:/Ai%20Projects/job-pilot/lib/insforge-client.ts) and server client in [lib/insforge-server.ts](file:///d:/Ai%20Projects/job-pilot/lib/insforge-server.ts).
  - Login page at [app/(auth)/login/page.tsx](file:///d:/Ai%20Projects/job-pilot/app/(auth)/login/page.tsx) with `LoginCard` supporting Google and GitHub OAuth, loading states, error handling, and clean navigation.
  - Server-side OAuth callback Route Handler at [app/(auth)/callback/route.ts](file:///d:/Ai%20Projects/job-pilot/app/(auth)/callback/route.ts) with PKCE authorization code exchange and instant redirect to `/dashboard` or `/profile`.
  - Route protection middleware in [middleware.ts](file:///d:/Ai%20Projects/job-pilot/middleware.ts) safeguarding `/dashboard`, `/profile`, and `/find-jobs`.
- **Feature 03: PostHog Initialization & Event Tracking** is fully implemented, debugged, and verified:
  - `posthog-js` and `posthog-node` integrated.
  - Browser client in [lib/posthog-client.ts](file:///d:/Ai%20Projects/job-pilot/lib/posthog-client.ts) initialized with project token, host, `disable_session_recording: true`, and manual pageview capture.
  - Reverse proxy rewrite in [next.config.ts](file:///d:/Ai%20Projects/job-pilot/next.config.ts) proxying `/ingest/:path*` to `https://us.i.posthog.com/:path*` to prevent ad-blocker drops.
  - Server client in [lib/posthog-server.ts](file:///d:/Ai%20Projects/job-pilot/lib/posthog-server.ts) configured with `flushAt: 1` and `flushInterval: 0` for immediate serverless delivery.
  - Root layout in [app/layout.tsx](file:///d:/Ai%20Projects/job-pilot/app/layout.tsx) wrapped in [components/providers/PostHogProvider.tsx](file:///d:/Ai%20Projects/job-pilot/components/providers/PostHogProvider.tsx).
  - User identification via `identifyUser()` on dashboard and profile visits; reset via `resetUser()` on logout in [components/auth/SignOutButton.tsx](file:///d:/Ai%20Projects/job-pilot/components/auth/SignOutButton.tsx).
  - Server action in [actions/analytics.ts](file:///d:/Ai%20Projects/job-pilot/actions/analytics.ts) (`trackServerAnalyticsEvent`) for server-side capturing.
  - Interactive event tracking panel in [components/dashboard/EventTrackingCard.tsx](file:///d:/Ai%20Projects/job-pilot/components/dashboard/EventTrackingCard.tsx) and [components/profile/ProfileCompleteTracker.tsx](file:///d:/Ai%20Projects/job-pilot/components/profile/ProfileCompleteTracker.tsx) supporting all 4 canonical project events: `job_search_started`, `job_found`, `profile_completed`, `company_researched`.
- **Feature 04: Database Schema & Storage Bucket** is fully implemented, migrated, and verified:
  - Spec [docs/specs/0001-database-schema.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0001-database-schema.md) created and `Accepted`.
  - All four PostgreSQL tables (`profiles`, `agent_runs`, `jobs`, `agent_logs`) created live in InsForge with exact column types and constraints.
  - Composite unique constraint `jobs_user_source_url_unique` enforced on `(user_id, source_url)` for idempotent upserts.
  - Automatic `updated_at` trigger on `profiles` and `jobs`, plus `handle_new_user` auto-provisioning trigger from `auth.users`.
  - 16 Row Level Security policies active across all four tables.
  - Storage bucket `resumes` created with authenticated access (`public: false`).
  - Migration script committed to [lib/migrations/0001_initial_schema.sql](file:///d:/Ai%20Projects/job-pilot/lib/migrations/0001_initial_schema.sql).
  - TypeScript types defined in [types/database.ts](file:///d:/Ai%20Projects/job-pilot/types/database.ts).
  - Detailed verification checklist saved to [docs/specs/0001-database-schema-verify.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0001-database-schema-verify.md).
  - Production build (`npm run build`) and typecheck (`npx tsc --noEmit`) pass with 0 errors.

## Files in Play

| File | Why It Matters |
|------|---------------|
| [docs/specs/0001-database-schema.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0001-database-schema.md) | Governing build spec for database schema and storage architecture |
| [docs/specs/0001-database-schema-verify.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0001-database-schema-verify.md) | Verification checklist covering all acceptance criteria and value sourcing |
| [lib/migrations/0001_initial_schema.sql](file:///d:/Ai%20Projects/job-pilot/lib/migrations/0001_initial_schema.sql) | Raw PostgreSQL migration script executed on InsForge |
| [types/database.ts](file:///d:/Ai%20Projects/job-pilot/types/database.ts) | TypeScript interfaces for `Profile`, `AgentRun`, `Job`, and `AgentLog` |
| [context/progress-tracker.md](file:///d:/Ai%20Projects/job-pilot/context/progress-tracker.md) | Progress tracker marking Feature 04 complete, Phase 1 100% done |
| [context/architecture.md](file:///d:/Ai%20Projects/job-pilot/context/architecture.md) | System architecture with database schemas and storage specs |

## Current Best Theory & Next Steps

Phase 1 (Foundation) is 100% complete! All 4 foundation features (01 Homepage, 02 Auth, 03 PostHog, 04 Database Schema) are live, tested, and compiling cleanly.

The immediate next milestone is **Phase 2, Feature 05: Profile Page — Full UI**.

1. **Feature 05: Profile Page — Full UI**
   - Profile completion banner with percentage progress ring and missing field chips (e.g. PHONE, LOCATION, EDUCATION).
   - Resume upload area (drag & drop zone, PDF only, Select Resume button, Generate Resume button).
   - Structured profile information sections:
     - Personal Info (Full Name, read-only Email, Phone, Location, LinkedIn, Portfolio, Work Authorization).
     - Professional Info (Current Title, Experience Level, Years of Experience, Skills tag input, Industries tag input).
     - Work Experience (up to 3 roles with Company, Title, Dates, Current checkbox, Responsibilities).
     - Education (Degree, Field of Study, Institution, Graduation Year).
     - Job Preferences (Target Titles, Remote Preference, Salary Expectation, Preferred Locations, Tone).
   - Save Profile button at bottom.
   - Use mock data first; wiring to InsForge DB is Feature 06.

## Key Constraints

- **Tailwind v4 `@theme` only**: Never use hardcoded hex values or raw Tailwind colors. Use token utilities (`bg-accent`, `text-text-primary`, `bg-surface`, etc.).
- **Server Components by default**: Only use `"use client"` when state, effects, or browser APIs are required.
- **Always update trackers**: Keep `context/progress-tracker.md` and `context/ui-registry.md` current after every feature.
- **Client vs Server separation**: Keep `insforge-client.ts` and `insforge-server.ts` completely isolated.
- **4 Canonical PostHog Events**: `job_search_started`, `job_found`, `profile_completed`, `company_researched`. Keep payloads strictly typed.
