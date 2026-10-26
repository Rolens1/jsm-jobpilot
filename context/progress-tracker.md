# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 7: Deployment & Production Launch  
**Last completed:** 21 Production Environment & Secrets Architecture (Spec 0014 built, verified, and accepted)  
**Next:** 22 Build Hardening, Security Headers, Rate Limiting & Runtime Compatibility (Spec 0015 ready to build)  

---

## Progress

### Phase 1 — Foundation

- [x] 01 Homepage
- [x] 02 Auth
- [x] 03 PostHog Initialization
- [x] 04 Database Schema

### Phase 2 — Profile Page

- [x] 05 Profile Page — Full UI
- [x] 06 Profile Save Logic & Secure PDF Resume Viewer
- [x] 07 AI Profile Extraction from Resume
- [x] 08 Resume PDF Generation from Profile

### Phase 3 — Find Jobs Page

- [x] 09 Find Jobs Page — Full UI
- [x] 10 Multi Provider Job Discovery Agent
- [x] 11 Filter + Sort + Pagination

### Phase 4 — Job Details Page

- [x] 12 Job Details Page — Full UI
- [x] 13 Company Research Agent

### Phase 5 — Dashboard

- [x] 14 Dashboard Page — Full UI
- [x] 15 Stats Bar — Real Data
- [x] 16 Recent Activity — Real Data
- [x] 17 Analytics Charts — PostHog Data

### Phase 6: Internationalization (French and English)

- [x] 18 Language Architecture, Dictionaries, and Onboarding Preference
- [x] 19 Full UI Copy Conversion Across All App Surfaces
- [x] 20 Bilingual AI and Document Intelligence

### Phase 7: Deployment & Production Launch

- [x] 21 Production Environment & Secrets Architecture
- [x] 22 Build Hardening, Security Headers, Rate Limiting & Runtime Compatibility
- [ ] 23 Vercel Project Architecture, CI/CD Pipeline & Live Deployment

---

## Decisions Made During Build

- **Security Headers, Rate Limiting & Runtime Hardening (Feature 22)**: Designed atomic PostgreSQL rate limiter in `lib/rate-limit.ts` and `migrations/0002_rate_limits.sql` executed on remote InsForge database. Configured calibrated showcase quotas (3 job searches, 3 company researches, 2 resume extractions, and 3 resume PDF generations per 10 minutes) with row locking (`FOR UPDATE`), automatic purge maintenance (`cleanup_expired_rate_limits`), and fail open resilience. Protected `/api/agent/find`, `/api/agent/research`, `extractResumeProfile`, and `generateResumePdf` returning HTTP 429 status with `Retry-After` headers and styled amber Demo Quota Guard banners in `SearchControls.tsx`, `CompanyResearchCard.tsx`, `ResumeSection.tsx`, and `ProfileContainer.tsx`. Added explicit showcase quota indicators across search, company research, and resume sections. Migrated Next.js edge routing from deprecated `middleware.ts` to `proxy.ts`, eliminating deprecation warnings. Configured production security headers in `next.config.ts` (Content-Security-Policy with PostHog and blob PDF allowances, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). Verified zero TypeScript errors and zero build warnings across all 13 routes.
- **Production Environment & Secrets Architecture (Feature 21)**: Created type safe Zod schema in `lib/env.ts` with fail fast validation on missing InsForge credentials and non blocking degradation warnings on missing optional AI or job aggregator keys. Wired `validateEnv()` gatekeeper into `next.config.ts` during build evaluation. Established comprehensive `.env.example` documenting all 16 variables across 7 functional domains. Documented InsForge production dashboard settings (`docs/deployment/insforge-setup.md`) enforcing canonical redirect URL and CORS whitelisting. Created Vercel sync script `scripts/sync-env.mjs` and updated `.gitignore` to quarantine sync tooling and secret files from GitHub.
- **Bilingual AI & Document Intelligence (Feature 20)**: Calibrated LLM system prompts in `lib/job-search/scorer.ts`, `lib/agent/research.ts`, and `lib/ai.ts` to inspect candidate active locale preference (via `getLocale()` or `profile.preferred_language`) and generate qualitative match reasons, company dossiers, and tailored executive resume bullet points in French or English. Updated ATS PDF generator (`lib/pdf/ClassicMonochromeTemplate.tsx`) to render localized section headings (Profil Professionnel, Expérience Professionnelle, Formation, Compétences & Expertises) and date formats based on candidate locale.
- **Client vs Server Architecture**: Used `@insforge/sdk` for browser client (`lib/insforge-client.ts`) and `@insforge/sdk/ssr` for server client (`lib/insforge-server.ts`).
- **Session Persistence**: Created `actions/auth.ts` server actions leveraging `@insforge/sdk/ssr/middleware` (`setAuthCookies`, `clearAuthCookies`) to synchronize tokens into HTTP-only cookies (`insforge_access_token`, `insforge_refresh_token`) on the Next.js host, allowing `middleware.ts` and Server Components to authenticate instantly.
- **Next.js 16 Partial Prerendering**: Wrapped dynamic parameters and session checks in `<Suspense>` boundaries in `/login` and `/callback` to ensure build-time prerendering succeeds with 0 errors.
- **PostHog Dual-Client Integration**: Built `lib/posthog-client.ts` (`posthog-js`) with `PostHogProvider` client component wrapping root layout (`app/layout.tsx`), and `lib/posthog-server.ts` (`posthog-node` with `flushAt: 1, flushInterval: 0`).
- **Canonical Event Contracts**: Typed and exposed the 4 project events (`job_search_started`, `job_found`, `profile_completed`, `company_researched`) client-side and server-side via `actions/analytics.ts`. Added interactive event dispatcher on the Dashboard.
- **Normalized InsForge Database Schema**: Established `profiles`, `agent_runs`, `jobs`, and `agent_logs` tables in InsForge PostgreSQL. Enforced user-isolated Row Level Security (RLS) on all tables, foreign key cascade constraints, unique composite constraint on `(user_id, source_url)` with upsert support, and auto-provisioning trigger from `auth.users`. Created private `resumes` storage bucket with authenticated user path isolation. Added TypeScript definitions in `types/database.ts`.
- **Modular Profile Page Architecture**: Built Feature 05 profile page with 3 isolated components (`ProfileAttentionBanner`, `ResumeSection`, `ProfileForm`) following `context/designs/profile.png` and token constraints in `app/globals.css`. Embedded SVG 70% circular progress meter, drag-and-drop resume upload zone with client-side PDF verification, interactive tag inputs for skills & industries with `Enter` and removal controls, and expandable work experience roles with "Currently working here" toggle. Synchronized authenticated navbar indicators across all app routes.
- **Multi-Provider Free LLM Architecture**: Integrated Groq (`qwen/qwen3.8-27b`, 14,400 RPD free), Google Gemini (`gemini-3.8-flash`, 1,500 RPD free), Cerebras, and Mistral in `lib/ai.ts`. Sourced from the `free-llm-apis` ecosystem to guarantee high-rate zero-cost AI extraction, supported by a deterministic fallback parser in `lib/resume-heuristics.ts`. Designed `ExtractedResumeReview` component providing explicit candidate review with granular section checkmarks and a one-click "Auto-fill and validate" workflow.
- **Non-Destructive Education & Snapshot Revert**: Form supports multiple education entries (`EducationEntry[]`). Validating education appends new unique institutions rather than overwriting manual entries. Every section captures a pre-validation snapshot on validation check; unchecking any section immediately restores the previous manual inputs without database pollution.
- **Server Side PDF Resume Architecture (Spec 0004)**: Selected `@react-pdf/renderer` with `renderToBuffer` in a Server Action. Classic monochrome serif styling calibrated for strict single page ATS compliance. AI executive summary and experience bullets tailored to the candidate target job title, with instant zero latency fallback to raw profile text on any upstream model failure. Uploads to private InsForge Storage and opens in the in-app preview modal.
- **Find Jobs Page Modular UI Architecture (Spec 0005)**: Built full client interface for `/find-jobs` with 24 realistic mock jobs mirroring the InsForge jobs schema. Decomposed into four modular presentation components (`SearchControls`, `JobFilters`, `JobsTable`, `JobsPagination`) orchestrated by `FindJobsContainer`. Interactive text filter across title, company, location, and matched skills. Match score threshold select (`all`, `high` 70%+, `low` <70%) and sort selector (`match_score`, `newest`, `oldest`). Progress bars adhere strictly to token rules (`bg-success` 80%+, `bg-info` 60% to 79%, `bg-warning` <60%). Added route fallback at `/find-jobs/[id]` wrapped in Suspense for seamless row navigation and Next.js 16 Partial Prerendering compliance.
- **Multi Provider Job Discovery Engine (Spec 0006)**: Replaced single Adzuna dependency with a cascading multi provider search engine in `lib/job-search/` (JSearch on RapidAPI primary, Jooble secondary, Adzuna tertiary). Added query deduplication, same search guard (prevents external API calls if search terms are unchanged), on demand pagination ("Load 10 More from Web"), and single batch GPT-4o structured JSON scoring.
- **Real Database Filter, Sort, and Dynamic Pagination (Feature 11)**: Connected `/find-jobs` UI controls to live InsForge PostgreSQL database results. Implemented All Matches, High Match (`match_score >= 70`), and Low Match (`match_score < 70`) filter tabs, case-insensitive substring searching across role title, company, location, and matched skills, and sorting by match score (descending), newest date found (descending), and oldest date found (ascending). Added dynamic page size selector (10 and 20 per page) with reactive pagination bounds and reset to page 1 semantics on filter changes.
- **Job Details Page Modular UI and Database Architecture (Spec 0007)**: Decomposed `/find-jobs/[id]` into six focused presentation subcomponents (`JobDetailsHeader`, `JobMetricsGrid`, `JobMatchAnalysisCard`, `JobDescriptionCard`, `CompanyResearchCard`, `StickyApplyBar`) orchestrated by an authenticated Next.js 16 Server Component page. Implemented InsForge PostgreSQL database query priority, color coded match score badges, AI reasoning narrative, and scroll aware floating sticky bottom application bar.
- **Company Research Agent Architecture (Spec 0008)**: Engineered multi tier company intelligence engine in `lib/agent/research.ts` and route handler `POST /api/agent/research`. Follows HTTP redirects natively to derive genuine employer domains while filtering aggregator links, extracts public web footprints via lightweight parsing with automatic fallback to job requirements, and synthesizes candidate specific 9 field dossiers with strict career strategist rules. Persists directly into `jobs.company_research` JSONB, logs execution to `agent_runs` and `agent_logs`, and emits `company_researched` PostHog telemetry. Transformed `CompanyResearchCard.tsx` into an interactive dossier surface with loading state, candidate edge highlights, gap framing strategies, tech badges, refresh confirmation protection, and mounted cleanup handlers.
- **Search Persistence & Elimination of Mock Data**: Resolved the foreign key ordering bug in `lib/job-search/orchestrator.ts` by ensuring `agent_runs` records are created before saving discovered jobs to satisfy `jobs_run_id_fkey`. Augmented provider cascade so queries with low initial results (< 5) automatically search and combine unique listings across Jooble and Adzuna. Completely purged `MOCK_JOBS` from all components and routes, and deleted the unused `lib/mock-jobs.ts` artifact. Real database jobs are now used exclusively.
- **JSearch RapidAPI Upgrade & Multi-Provider Robustness**: Upgraded JSearch from deprecated `/search` to `/search-v2` with `data?.data?.jobs` schema parsing, restoring Google for Jobs results. Added dynamic target country selection and unique fallback source URLs to avoid PostgreSQL unique constraint collisions on `(user_id, source_url)`.
- **Domain-Aware Heuristic Scoring & Resilient Domain Extraction**: Updated `cleanRootDomain` in `lib/agent/research.ts` to support multi-segment country-code top level domains such as `.co.uk`, `.qc.ca`, and `.com.au`. Upgraded `heuristicScoreJob` in `lib/job-search/scorer.ts` and `generateFallbackDossier` in `lib/agent/research.ts` to dynamically inspect job title and candidate target profile, adapting skills for finance and operations roles rather than assuming software engineering defaults.
- **Dashboard Page Modular UI and Native SVG Architecture (Spec 0009)**: Built full visual dashboard matching `context/designs/dashboard.png` with six modular components (`StatsBar`, `RecentActivity`, `CompanyResearchChart`, `JobsFoundChart`, `MatchScoreDistributionChart`, `DashboardContainer`). Implemented three custom responsive SVG charts with zero external charting library dependencies to eliminate bundle bloat and React 19 App Router hydration errors. Integrated conditional `ProfileAttentionBanner` query via server-side `insforge.database.from("profiles")` while retaining the PostHog diagnostics dispatch tool. Verified with Next.js 16 Partial Prerendering and zero TypeScript errors.
- **Stats Bar Real Data Integration (Spec 0010)**: Connected the four performance metric cards to live InsForge PostgreSQL jobs data in `app/dashboard/page.tsx` using `Promise.all` parallel fetching with profile query. Built pure statistical calculation engine in `lib/dashboard-stats.ts` computing total jobs found, arithmetic mean match score percentage, count of jobs with completed company research, and count of new jobs discovered within the past seven days. Implemented dynamic trend calculations comparing the last seven days against the preceding seven days, with clean empty state handling for new candidates.
- **Recent Activity Real Data Timeline Integration (Spec 0011)**: Connected the Recent Activity feed to live database events collected from `agent_runs` and `jobs.company_research` in `app/dashboard/page.tsx`. Built chronological event merger and deduplicator in `lib/dashboard-activity.ts` that handles job search queries, formats company research dossiers, deduplicates overlapping research agent runs within ten minute windows, formats human readable relative timestamps (`Just now`, `X minutes ago`, `Yesterday`) using `lib/date-utils.ts`, and gracefully handles empty states with an inviting search prompt.
- **Analytics Charts Real Data and Dynamic Scaling Architecture (Spec 0012)**: Connected the three native SVG analytics charts on the dashboard to live candidate metrics. Built pure statistical transformation engine in `lib/dashboard-charts.ts` that aggregates daily company research counts and job discovery volume across the current week (Monday through Sunday) and buckets candidate match scores into five standard tiers (`50-60%`, `60-70%`, `70-80%`, `80-90%`, `90-100%`). Engineered dynamic tiered Y axis scaling (`maxY` 10, 25, 50, 100+) across all three SVG charts so small candidate counts produce prominent visual bars and curves. Added resilient empty state handling rendering zero counts cleanly without NaN or division by zero errors.
- **Bilingual Language Architecture & Zero Route Disruption (Spec 0013)**: Built type safe dictionary foundation in `types/i18n.ts`, `dictionaries/en.ts`, and `dictionaries/fr.ts`. Implemented cookie based locale resolution using `NEXT_LOCALE` and `JOBPILOT_LANG_PROMPTED` with automatic `Accept-Language` detection on initial landing in `middleware.ts`. Connected Client Components via `LanguageProvider` (`useTranslation`, `useLocale`), added segmented pill switcher in `components/layout/Navbar.tsx`, and mounted welcoming first visit `LanguageOnboardingModal` on candidate dashboard. Preserved Next.js 16 Partial Prerendering (`◐`) across all 13 routes with zero TypeScript errors.
- **Full Application UI Copy Conversion Across All App Surfaces (Feature 19)**: Converted all app screens and presentation components across 5 UI groups into complete, native French and English copy without hardcoded strings. Unified dictionary consumption across Client Components (`useTranslation`) and Server Components (`getLocale`, `getDictionary`). Guaranteed complete schema parity between `types/i18n.ts`, `dictionaries/en.ts`, and `dictionaries/fr.ts` (380 lines each). Preserved Next.js 16 Partial Prerendering across all 13 routes with 0 TypeScript errors.



---

## Notes

- InsForge SDK uses PKCE flow for OAuth with code verifier automatically stored in browser storage.
- Backend OAuth providers verified active: Google and GitHub (`https://pprn26i7.us-east.insforge.app`).
- Next.js 16 canonical edge routing migrated to `proxy.ts`, resolving middleware deprecation warnings cleanly with verified production builds.
