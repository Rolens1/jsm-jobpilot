# Handoff / Session Memory

> Generated: 2026-10-25T16:15:00-04:00  
> Project: JobPilot (`d:/Ai Projects/job-pilot`)  
> Session summary: Completed Feature 13 (Company Research Agent) with Spec 0008. Multi tier web extraction engine in `lib/agent/research.ts` derives genuine company domains, parses public web content with automatic fallback to role requirements, and synthesizes 9 field candidate specific dossiers. Wired `POST /api/agent/research` route handler and interactive `CompanyResearchCard.tsx` with loading states, candidate edge highlights, gap framing, verified tech stack tags, and refresh controls. Phase 4 is now completely delivered with zero TypeScript errors. Next is Phase 5 (Feature 14 Dashboard Page Full UI).

## Goal

Build JobPilot, an AI powered job hunting assistant using Next.js 16 (App Router), InsForge backend (Auth, DB, Storage), Browserbase and Stagehand for company research, multi provider job discovery (JSearch, Jooble, Adzuna), OpenAI/Groq/Gemini for LLM operations, and PostHog for analytics. Follow the roadmap in `context/build-plan.md`.

## Current State

**Completed & Confirmed Working:**
- **Feature 01: Homepage** is fully implemented and compiled cleanly with `npm run build`.
- **Feature 02: Auth** is fully implemented and compiled cleanly with `npm run build`.
- **Feature 03: PostHog Initialization & Event Tracking** is fully implemented, debugged, and verified.
- **Feature 04: Database Schema & Storage Bucket** is fully implemented, migrated, and verified.
- **Feature 05: Profile Page Full UI** is fully implemented, responsive, and verified.
- **Feature 06: Profile Save Logic & Secure Resume PDF Viewing** is fully implemented, hardened, and verified.
- **Feature 07: AI Profile Extraction from Resume** is fully implemented, debugged, and verified.
- **Feature 08: Resume PDF Generation from Profile** is fully implemented, verified, and accepted (Spec [0004-resume-pdf-generation](file:///d:/Ai%20Projects/job-pilot/docs/specs/0004-resume-pdf-generation/index.md)).
- **Feature 09: Find Jobs Page Full UI** is fully implemented, verified, and accepted (Spec [0005-find-jobs-ui](file:///d:/Ai%20Projects/job-pilot/docs/specs/0005-find-jobs-ui/index.md)).
- **Feature 10: Multi Provider Job Discovery Agent** is fully implemented, verified, and accepted (Spec [0006-job-discovery-agent](file:///d:/Ai%20Projects/job-pilot/docs/specs/0006-job-discovery-agent/index.md)).
- **Feature 11: Filter + Sort + Pagination** is fully implemented, verified with TypeScript compilation passing with zero errors.
- **Feature 12: Job Details Page Full UI** is fully implemented, verified, and accepted (Spec [0007-job-details-page](file:///d:/Ai%20Projects/job-pilot/docs/specs/0007-job-details-page/index.md)).
- **Feature 13: Company Research Agent** is fully implemented, verified, and accepted (Spec [0008-company-research-agent](file:///d:/Ai%20Projects/job-pilot/docs/specs/0008-company-research-agent/index.md)):
  - Multi tier domain derivation and web footprint extractor in `lib/agent/research.ts`.
  - Resilient AI synthesis pipeline producing 9 field structured dossiers (`companyOverview`, `techStack`, `culture`, `whyThisRole`, `yourEdge`, `gapsToAddress`, `smartQuestions`, `interviewPrep`, `sources`).
  - Route handler `POST /api/agent/research` updating `jobs.company_research`, logging runs and logs, and emitting PostHog `company_researched` events.
  - Interactive `CompanyResearchCard.tsx` rendering empty preview, animated loading progress, and full verified dossier views with refresh confirmation safety and unmount lifecycle cleanup.
- **Search Bug Resolution & Purge of Mock Data**:
  - Identified root cause of searched jobs not showing up in the table: foreign key ordering constraint (`jobs_run_id_fkey`) in `lib/job-search/orchestrator.ts` where jobs were inserted before `agent_runs` existed for `run_id`.
  - Fixed `orchestrator.ts` to insert `agent_runs` prior to inserting jobs, with safe upserts and fallback unique URL handling.
  - Added coverage augmentation to provider cascade: when primary returns low count (< 5), automatically falls back and aggregates unique listings across Jooble and Adzuna.
  - Removed all `MOCK_JOBS` fixtures from `FindJobsContainer.tsx`, `app/find-jobs/page.tsx`, `app/find-jobs/[id]/page.tsx`, and `app/api/agent/research/route.ts`. Real database jobs are now used exclusively.
- **Phase 6 Addition (Internationalization & Bilingual Localization):**
  - Added Features 18, 19, and 20 to `context/build-plan.md` and `context/progress-tracker.md` to be implemented after Phase 5.
- **Next up:**
  - **Feature 14: Dashboard Page Full UI** (Phase 5 Dashboard launch with 4 stat cards, recent activity, resume tailoring bar chart, jobs found timeline, and match score distribution).

## Files in Play

| File | Why It Matters |
|------|---------------|
| [docs/specs/0008-company-research-agent/index.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0008-company-research-agent/index.md) | Governing build specification for Feature 13 |
| [docs/specs/0008-company-research-agent/rationale.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0008-company-research-agent/rationale.md) | Architectural rationale and tradeoffs for Feature 13 |
| [docs/specs/0008-company-research-agent/verify.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0008-company-research-agent/verify.md) | Verification checklist and manual scenarios for Feature 13 |
| [lib/agent/research.ts](file:///d:/Ai%20Projects/job-pilot/lib/agent/research.ts) | Domain derivation, web extraction, and LLM synthesis engine |
| [app/api/agent/research/route.ts](file:///d:/Ai%20Projects/job-pilot/app/api/agent/research/route.ts) | Route handler executing research pipeline and PostHog events |
| [components/find-jobs/details/CompanyResearchCard.tsx](file:///d:/Ai%20Projects/job-pilot/components/find-jobs/details/CompanyResearchCard.tsx) | Interactive intelligence dossier card with loading and refresh states |
| [types/database.ts](file:///d:/Ai%20Projects/job-pilot/types/database.ts) | Database types updated with full 9 field dossier properties |
| [context/build-plan.md](file:///d:/Ai%20Projects/job-pilot/context/build-plan.md) | Build plan with Feature 13 linked to Spec 0008 |
| [context/progress-tracker.md](file:///d:/Ai%20Projects/job-pilot/context/progress-tracker.md) | Progress tracker marking Feature 13 complete |
| [context/ui-registry.md](file:///d:/Ai%20Projects/job-pilot/context/ui-registry.md) | UI registry imprinted with CompanyResearchCard design tokens |

## Next Steps

Implement Feature 14 (Dashboard Page Full UI):
1. Review Dashboard UI requirements in `context/build-plan.md` and design tokens in `context/ui-tokens.md`.
2. Architect Feature 14 (Spec 0009): Layout, 4 stat cards (Total Jobs Found, Avg Match Rate, Companies Researched, Cover Letters Generated), Recent Activity feed, and chart components.
3. Build dashboard presentation components under `components/dashboard/`.
4. Integrate with `app/dashboard/page.tsx` with user authentication and incomplete profile banner.
5. Verify with TypeScript compilation and responsive UI checks.
