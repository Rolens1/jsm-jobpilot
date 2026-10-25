# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 4: Job Details Page
**Last completed:** 12 Job Details Page: Full UI (Spec 0007 built, verified, and accepted)
**Next:** 13 Company Research Agent (Ready for /architect or /develop)

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
- **Modular Profile Page Architecture**: Built Feature 05 profile page with 3 isolated components (`ProfileAttentionBanner`, `ResumeSection`, `ProfileForm`) following `context/designs/profile.png` and token constraints in `app/globals.css`. Embedded SVG 70% circular progress meter, drag-and-drop resume upload zone with client-side PDF verification, interactive tag inputs for skills & industries with `Enter` and removal controls, and expandable work experience roles with "Currently working here" toggle. Synchronized authenticated navbar indicators across all app routes.
- **Multi-Provider Free LLM Architecture**: Integrated Groq (`qwen/qwen3.8-27b`, 14,400 RPD free), Google Gemini (`gemini-3.8-flash`, 1,500 RPD free), Cerebras, and Mistral in `lib/ai.ts`. Sourced from the `free-llm-apis` ecosystem to guarantee high-rate zero-cost AI extraction, supported by a deterministic fallback parser in `lib/resume-heuristics.ts`. Designed `ExtractedResumeReview` component providing explicit candidate review with granular section checkmarks and a one-click "Auto-fill and validate" workflow.
- **Non-Destructive Education & Snapshot Revert**: Form supports multiple education entries (`EducationEntry[]`). Validating education appends new unique institutions rather than overwriting manual entries. Every section captures a pre-validation snapshot on validation check; unchecking any section immediately restores the previous manual inputs without database pollution.
- **Server Side PDF Resume Architecture (Spec 0004)**: Selected `@react-pdf/renderer` with `renderToBuffer` in a Server Action. Classic monochrome serif styling calibrated for strict single page ATS compliance. AI executive summary and experience bullets tailored to the candidate target job title, with instant zero latency fallback to raw profile text on any upstream model failure. Uploads to private InsForge Storage and opens in the in-app preview modal.
- **Find Jobs Page Modular UI Architecture (Spec 0005)**: Built full client interface for `/find-jobs` with 24 realistic mock jobs mirroring the InsForge jobs schema. Decomposed into four modular presentation components (`SearchControls`, `JobFilters`, `JobsTable`, `JobsPagination`) orchestrated by `FindJobsContainer`. Interactive text filter across title, company, location, and matched skills. Match score threshold select (`all`, `high` 70%+, `low` <70%) and sort selector (`match_score`, `newest`, `oldest`). Progress bars adhere strictly to token rules (`bg-success` 80%+, `bg-info` 60% to 79%, `bg-warning` <60%). Added route fallback at `/find-jobs/[id]` wrapped in Suspense for seamless row navigation and Next.js 16 Partial Prerendering compliance.
- **Multi Provider Job Discovery Engine (Spec 0006)**: Replaced single Adzuna dependency with a cascading multi provider search engine in `lib/job-search/` (JSearch on RapidAPI primary, Jooble secondary, Adzuna tertiary). Added query deduplication, same search guard (prevents external API calls if search terms are unchanged), on demand pagination ("Load 10 More from Web"), and single batch GPT-4o structured JSON scoring.
- **Real Database Filter, Sort, and Dynamic Pagination (Feature 11)**: Connected `/find-jobs` UI controls to live InsForge PostgreSQL database results. Implemented All Matches, High Match (`match_score >= 70`), and Low Match (`match_score < 70`) filter tabs, case-insensitive substring searching across role title, company, location, and matched skills, and sorting by match score (descending), newest date found (descending), and oldest date found (ascending). Added dynamic page size selector (10 and 20 per page) with reactive pagination bounds and reset to page 1 semantics on filter changes.
- **Job Details Page Modular UI and Database Architecture (Spec 0007)**: Decomposed `/find-jobs/[id]` into six focused presentation subcomponents (`JobDetailsHeader`, `JobMetricsGrid`, `JobMatchAnalysisCard`, `JobDescriptionCard`, `CompanyResearchCard`, `StickyApplyBar`) orchestrated by an authenticated Next.js 16 Server Component page. Implemented InsForge PostgreSQL database query priority with graceful fallback to mock fixtures for preview IDs, color coded match score badges, AI reasoning narrative, and scroll aware floating sticky bottom application bar.



---

## Notes

- InsForge SDK uses PKCE flow for OAuth with code verifier automatically stored in browser storage.
- Backend OAuth providers verified active: Google and GitHub (`https://pprn26i7.us-east.insforge.app`).
- Next.js 16 logs a deprecation notice for `middleware.ts` in favor of `proxy.ts`, but `middleware.ts` remains fully functional and tested.
