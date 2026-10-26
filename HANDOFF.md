# Handoff / Session Memory

> Generated: 2026-10-26T03:35:00-04:00  
> Project: JobPilot (`d:/Ai Projects/job-pilot`)  
> Session summary: Phase 5 (Dashboard) is 100% complete and fully verified. Features 14 (Full UI), 15 (Stats Bar Real Data), 16 (Recent Activity Real Data), and 17 (Analytics Charts Real Data) are implemented, tested, audited via code review, and committed. All three native SVG charts (Company Research, Jobs Found Timeline, Match Score Distribution) are connected to live InsForge PostgreSQL metrics with dynamic tiered Y axis scaling, clock skew tolerance, and sliding window event deduplication. Next.js 16 production build compiles with Partial Prerendering (`◐`) on `/dashboard` with zero TypeScript errors. Ready for Phase 6 (Internationalization in French and English), starting with Feature 18.

## Goal

Build JobPilot, an AI powered job hunting assistant using Next.js 16 (App Router), InsForge backend (Auth, PostgreSQL DB, Storage), Browserbase and Stagehand for company research, multi provider job discovery (JSearch, Jooble, Adzuna), OpenAI/Groq/Gemini for LLM operations, and PostHog for analytics. Follow the roadmap in [context/build-plan.md](file:///d:/Ai%20Projects/job-pilot/context/build-plan.md) and keep [context/progress-tracker.md](file:///d:/Ai%20Projects/job-pilot/context/progress-tracker.md) and [context/ui-registry.md](file:///d:/Ai%20Projects/job-pilot/context/ui-registry.md) updated.

## Current State

**Completed & Confirmed Working (Phases 1 through 5 Complete):**
- **Phase 1: Foundation (Features 01-04)**
  - Feature 01: Homepage with modern responsive landing design and design tokens.
  - Feature 02: InsForge Auth with PKCE, session sync via cookies, and middleware protection.
  - Feature 03: PostHog client/server dual initialization and canonical event tracking.
  - Feature 04: PostgreSQL schema (`profiles`, `agent_runs`, `jobs`, `agent_logs`) and private storage bucket.
- **Phase 2: Profile Page (Features 05-08)**
  - Feature 05: Profile full UI with circular progress ring and skills/work tags.
  - Feature 06: Profile save logic and secure in-app PDF resume viewing.
  - Feature 07: AI profile extraction with multi-provider free LLM fallback and non-destructive revert.
  - Feature 08: ATS-compliant server-rendered PDF resume generation from profile data (Spec 0004).
- **Phase 3: Find Jobs Page (Features 09-11)**
  - Feature 09: Find jobs modular UI with search controls, filter badges, and table pagination (Spec 0005).
  - Feature 10: Multi-provider job discovery agent cascading JSearch, Jooble, and Adzuna with structured GPT-4o scoring (Spec 0006).
  - Feature 11: Real PostgreSQL filter tabs, substring search across title/company/skills, sorting, and dynamic page sizes.
- **Phase 4: Job Details Page (Features 12-13)**
  - Feature 12: Job details modular page with metrics grid, AI fit analysis, and floating sticky apply bar (Spec 0007).
  - Feature 13: Company research agent deriving employer domains, web footprint extraction, 9-field strategic dossier synthesis, and PostHog telemetry (Spec 0008).
- **Phase 5: Dashboard (Features 14-17 Complete)**
  - Feature 14: Full dashboard layout matching `context/designs/dashboard.png` with 4 stat metric cards, recent activity feed, three responsive SVG charts, and interactive diagnostics tool (Spec 0009).
  - Feature 15: Stats bar connected to live PostgreSQL jobs data computing total jobs, arithmetic mean match score, researched count, and 7-day velocity with comparative trends (Spec 0010).
  - Feature 16: Recent activity timeline connected to live database runs and researched jobs with 10-minute sliding window deduplication and relative timestamps (Spec 0011).
  - Feature 17: Three native SVG analytics charts connected to live candidate metrics with pure aggregation engine in `lib/dashboard-charts.ts`, dynamic tiered Y axis scaling (10, 15, 25, 50, 100+), 10-minute event deduplication, and zero state handling (Spec 0012).
- **Code Reviews and Hardening**:
  - Full five-axis code reviews executed after Feature 14, 16, and 17.
  - Research event deduplication resolved double-counting between `jobs.company_research` and `agent_runs`.
  - Clock skew tolerance added for instant real-time query accuracy (`diffMs >= -60000`).
  - Zero-division defensive guard in `JobsFoundChart.tsx` points calculation.
  - Token compliance: 100% of charts use CSS variable fills and semantic tokens.
  - TypeScript check (`npx tsc --noEmit`) and Next.js 16 production build (`npm run build`) pass cleanly with code 0.

## Files in Play

| File | Why It Matters |
|------|---------------|
| [docs/specs/0009-dashboard-page-ui/index.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0009-dashboard-page-ui/index.md) | Governing specification for Feature 14 (Dashboard Layout & Native SVG Charts) |
| [docs/specs/0010-stats-bar-real-data/index.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0010-stats-bar-real-data/index.md) | Governing specification for Feature 15 (Stats Bar Real Data) |
| [docs/specs/0011-recent-activity-real-data/index.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0011-recent-activity-real-data/index.md) | Governing specification for Feature 16 (Recent Activity Real Data) |
| [docs/specs/0012-analytics-charts-data/index.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0012-analytics-charts-data/index.md) | Governing specification for Feature 17 (Analytics Charts Real Data) |
| [lib/dashboard-charts.ts](file:///d:/Ai%20Projects/job-pilot/lib/dashboard-charts.ts) | Pure statistical calculation engine aggregating weekly research, jobs timeline, and score buckets |
| [lib/dashboard-stats.ts](file:///d:/Ai%20Projects/job-pilot/lib/dashboard-stats.ts) | Pure statistical calculation engine computing 4 headline metrics and 7-day trends |
| [lib/dashboard-activity.ts](file:///d:/Ai%20Projects/job-pilot/lib/dashboard-activity.ts) | Chronological event merger and deduplicator for candidate search runs and company research |
| [app/dashboard/page.tsx](file:///d:/Ai%20Projects/job-pilot/app/dashboard/page.tsx) | Authenticated Next.js 16 Server Component streaming parallel query data to DashboardContainer |
| [components/dashboard/DashboardContainer.tsx](file:///d:/Ai%20Projects/job-pilot/components/dashboard/DashboardContainer.tsx) | Client orchestration container organizing StatsBar, RecentActivity, and the three SVG charts |
| [components/dashboard/CompanyResearchChart.tsx](file:///d:/Ai%20Projects/job-pilot/components/dashboard/CompanyResearchChart.tsx) | Responsive SVG bar chart with dynamic Y axis ticks and hover tooltips |
| [components/dashboard/JobsFoundChart.tsx](file:///d:/Ai%20Projects/job-pilot/components/dashboard/JobsFoundChart.tsx) | Responsive SVG area curve chart with smooth cubic bezier paths and gradient fills |
| [components/dashboard/MatchScoreDistributionChart.tsx](file:///d:/Ai%20Projects/job-pilot/components/dashboard/MatchScoreDistributionChart.tsx) | Responsive SVG distribution bar chart across 5 standard match score tiers |
| [components/dashboard/StatsBar.tsx](file:///d:/Ai%20Projects/job-pilot/components/dashboard/StatsBar.tsx) | 4-card metric grid with color-coded trend indicators |
| [components/dashboard/RecentActivity.tsx](file:///d:/Ai%20Projects/job-pilot/components/dashboard/RecentActivity.tsx) | Interactive activity feed with chronological timeline dots and empty state |
| [context/build-plan.md](file:///d:/Ai%20Projects/job-pilot/context/build-plan.md) | Master build plan reflecting Phases 1-5 complete and Phase 6 planned |
| [context/progress-tracker.md](file:///d:/Ai%20Projects/job-pilot/context/progress-tracker.md) | Current status tracker marking Feature 17 complete and Phase 6 as next milestone |
| [context/ui-registry.md](file:///d:/Ai%20Projects/job-pilot/context/ui-registry.md) | UI registry updated with all Phase 5 dashboard component signatures and tokens |

## What Has Been Tried (and Why It Failed)

1. **PostHog HogQL API Querying**:
   - *Attempted*: Querying PostHog `/api/projects/@current/query/` to retrieve aggregation counts for charts and stats.
   - *Failure Reason*: The project `.env.local` contains only the public ingest key `NEXT_PUBLIC_POSTHOG_KEY=phc_...`. HogQL queries require a Personal API Key (`phx_...`), returning `authentication_failed`.
   - *Working Alternative*: Direct authoritative server-side PostgreSQL queries against `jobs` and `agent_runs` in `app/dashboard/page.tsx` via `Promise.all`. This yields sub-millisecond execution, zero external API downtime, and instant Next.js 16 Partial Prerendering.
2. **Fixed Static Chart Bounds**:
   - *Attempted*: SVG bar and curve charts hardcoded with `maxY = 100` and `maxY = 12`.
   - *Failure Reason*: A candidate with 5-10 jobs had tiny 4px bars that were barely perceptible.
   - *Working Alternative*: Tiered dynamic scaling in `JobsFoundChart.tsx` (15, 50, 100+) and `MatchScoreDistributionChart.tsx` (10, 25, 50, 100+). Small candidate pipelines now fill the visual height gracefully.
3. **Research Event Double Counting**:
   - *Attempted*: Summing counts from `jobs.company_research` and `agent_runs` independently.
   - *Failure Reason*: Researching a company generates both an agent run and a job record update within milliseconds, producing double counts (e.g. 2 instead of 1).
   - *Working Alternative*: 10-minute sliding window deduplication across both sources in `lib/dashboard-charts.ts` matching `lib/dashboard-activity.ts`.

## Current Best Theory (Phase 6 Internationalization)

Phase 6 introduces bilingual localization across the entire application in French and English:
- **Feature 18: Language Architecture, Dictionaries, and Onboarding Preference (Spec 0013)**:
  - Establish lightweight type-safe translation dictionaries (`dictionaries/en.ts`, `dictionaries/fr.ts`).
  - Add language state management via cookie / profile preference (`language: 'en' | 'fr'`) with effortless switching in navbar and profile settings.
  - Create translation hooks and server translation helpers that maintain Partial Prerendering performance.
- **Feature 19: Full UI Copy Conversion Across All App Surfaces**:
  - Localize all static and dynamic text across Homepage, Auth, Profile, Find Jobs, Job Details, and Dashboard.
- **Feature 20: Bilingual AI and Document Intelligence**:
  - Instruct AI prompts (resume extraction, resume generation, company research) to respect candidate language preference and produce tailored French or English outputs.

## Next Steps

When resuming in the next session:
1. Run `/architect feature 18` to generate Spec 0013 for Language Architecture, Dictionaries, and Onboarding Preference.
2. Review Phase 6 requirements in [context/build-plan.md](file:///d:/Ai%20Projects/job-pilot/context/build-plan.md).
3. Implement `dictionaries/en.ts` and `dictionaries/fr.ts` with typed keys.
4. Add language toggle to the navigation bar and persist language in cookies / candidate profile.
5. Verify build and test with Next.js 16 Partial Prerendering.

## Key Constraints and Context

- **Plain Words Rule**: Never use a dash or hyphen as punctuation (no em dashes, en dashes, or punctuation hyphens). Code, commands, and file paths retain hyphens.
- **Design Tokens Rule**: Never use hardcoded hex values or raw Tailwind color classes. All UI components must use tokens defined in `app/globals.css`.
- **Framework Conventions**: Next.js 16 App Router with Partial Prerendering (`◐`). Server Components should fetch data directly and pass serialized props to `"use client"` presentation containers.
- **Clickable Links**: All file and code symbol references in agent reports must use clickable markdown links with `file:///` scheme.
