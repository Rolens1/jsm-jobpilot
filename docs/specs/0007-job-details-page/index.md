# 0007. Job Details Page Full UI

**Date**: 2026-10-25
**Status**: Proposed

## Summary

This specification establishes the architecture and interface for the Job Details page at `/find-jobs/[id]` in JobPilot. It connects real job listings and match evaluations stored in the InsForge PostgreSQL database with a rich user interface, while offering graceful fallback to mock data when reviewing prototype records. Candidates can inspect role details, review matched skills alongside growth areas, examine salary and metadata metrics, preview upcoming company research dossiers, and apply directly through a persistent action bar.

## Requirements

**User stories**:
- As a candidate, I want to view the full details of any discovered job opportunity so that I can evaluate role requirements, salary, and company expectations.
- As a candidate, I want to review an honest breakdown of matched skills and growth areas so that I understand why the AI assigned a specific match score.
- As a candidate, I want an easily accessible apply action so that I can open the original job application without searching for the link again.
- As a candidate, I want to see what company intelligence will be gathered so that I am prepared for upcoming research tools in Feature 13.

**Acceptance criteria**:
- **AC-1**: Navigation link at top allows returning to `/find-jobs` with smooth hover cues and icon feedback.
- **AC-2**: Server route preloads authenticated user session and queries the `jobs` table by job `id` and `user_id`, falling back gracefully to mock positions if the record matches preview fixtures.
- **AC-3**: Job header card displays the company monogram or logo, role title, company name, location, found date, color coded match score badge, and external apply action.
- **AC-4**: Quick metrics grid highlights salary estimate, employment type, source provider, and formatted discovery date using token borders and typography.
- **AC-5**: AI match analysis section presents the full narrative explanation, positive matched skill pills with success tokens, and missing skill growth pills with warning tokens.
- **AC-6**: Job description card renders full role details, key responsibilities, and qualifications cleanly without raw HTML artifacts.
- **AC-7**: Company research card displays a polished empty state with research preview metrics (tech stack, culture, interview prep) and an action button styled for Feature 13 integration.
- **AC-8**: Sticky floating bottom bar remains visible during deep scrolling through long descriptions, displaying job title, match score, and an immediate Apply Now link opening in a new tab.
- **AC-9**: If a job record cannot be found in either the database or mock fixtures, the page invokes `notFound()` to render the standard 404 boundary.

## Decision

**Chosen option**: Option 1: Modular Server Component architecture with database priority prefetching, fallback support, and persistent bottom application bar.

We decompose `/find-jobs/[id]` into focused presentation subcomponents (`JobDetailsHeader`, `JobMetricsGrid`, `JobMatchAnalysisCard`, `JobDescriptionCard`, `CompanyResearchCard`, `StickyApplyBar`) orchestrated by a Server Component page that authenticates and queries InsForge PostgreSQL.

**Implementation skills**: Next.js 16 App Router conventions, `@insforge/sdk/ssr` database access, Tailwind CSS design tokens defined in `app/globals.css`.

## Rationale

Reasoning and options: see [rationale.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0007-job-details-page/rationale.md).

## Feature design

**Data model sketch**:
The page consumes the `jobs` table from InsForge PostgreSQL (`types/database.ts`):

| Column | Type | Nullable | Purpose |
|---|---|---|---|
| id | string (uuid or text) | No | Primary key identifier |
| user_id | string (uuid) | No | Owner candidate reference |
| title | string | No | Role title e.g. Staff Frontend Engineer |
| company | string | No | Employer company name |
| location | string | Yes | Work location or Remote |
| salary | string | Yes | Estimated compensation range |
| job_type | string | No | Employment type: fulltime, parttime, contract |
| source | string | No | Provider tag e.g. search, adzuna, manual |
| source_url | string | No | Original job posting URL |
| external_apply_url | string | Yes | Direct application destination link |
| match_score | integer | No | Evaluated candidate match score 0 to 100 |
| match_reason | string | Yes | Detailed narrative reasoning paragraph |
| matched_skills | array of string | Yes | Skills candidate possesses |
| missing_skills | array of string | Yes | Growth areas candidate lacks |
| about_role | string | No | Role overview and responsibilities text |
| about_company | string | Yes | Company summary |
| company_research | jsonb | Yes | Dossier payload reserved for Feature 13 |
| found_at | timestamp with time zone | No | Search discovery timestamp |

**State transitions**:
Not applicable. The job details view is read only in Feature 12. Mutation states for company research dossiers activate in Feature 13.

**API surface**:
The page renders server side as a dynamic Next.js App Router route:

| Route or Action | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/find-jobs/[id]` | GET (Page) | `params.id: string` | Rendered HTML with preloaded job data | Authenticated user cookie | 401 redirect to login, 404 not found |

**Value sourcing**:
| Action | Value produced or displayed | Source |
|---|---|---|
| Page load | Current candidate user identity | `insforge.auth.getCurrentUser()` session cookie |
| Page load | Primary job record | `insforge.database.from("jobs").select("*").eq("id", id).eq("user_id", user.id)` |
| Fallback | Mock job preview record | `MOCK_JOBS.find((j) => j.id === id)` when database row is absent |
| Render | Match score indicator and badge color | Computed from `job.match_score`: success token for 80+, info token for 60 to 79, warning token under 60 |
| Render | Monogram character | `job.company.charAt(0).toUpperCase()` |
| Render | Application destination link | `job.external_apply_url` falling back to `job.source_url` |
| Render | Dossier preview placeholder | Static copy detailing tech stack, culture, and interview prep |

**Key invariants**:
- Row level security enforces that candidates can only view jobs saved under their own authenticated `user_id`.
- External application links must specify `target="_blank"` and `rel="noopener noreferrer"` to protect security and candidate navigation context.
- Colors representing match score must strictly use semantic tokens (`bg-success`, `bg-info`, `bg-warning`) from `app/globals.css`.
- Server page must remain wrapped in a Suspense boundary to guarantee compatibility with Next.js 16 Partial Prerendering.

**Security model**:
- Authenticated candidates only. Unauthenticated requests redirect to `/login?next=/find-jobs/[id]`.
- Database query enforces user isolation by filtering on `user_id`.

**Configuration required**:
None. Uses existing InsForge database credentials and session cookies.

**Critical test scenarios**:
- Happy path: Authenticated candidate navigates to `/find-jobs/[id]` for a saved job, sees complete job details, match analysis, and interactive apply links, verifies **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-8**.
- Fallback path: Candidate opens a valid mock ID from development seeds, receives full mock details seamlessly, verifies **AC-2**.
- Empty or missing path: Request specifies an ID not found in database or mock data, page triggers `notFound()`, verifies **AC-9**.
- Navigation path: Clicking Back to Find Jobs returns the candidate to `/find-jobs`, verifies **AC-1**.

## Build plan

1. Create modular presentation subcomponents in `components/find-jobs/details/` (`JobDetailsHeader.tsx`, `JobMetricsGrid.tsx`, `JobMatchAnalysisCard.tsx`, `JobDescriptionCard.tsx`, `CompanyResearchCard.tsx`, `StickyApplyBar.tsx`), satisfies **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**.
2. Wire `app/find-jobs/[id]/page.tsx` with server side authentication and database query fetching against InsForge PostgreSQL, with graceful fallback to mock data, satisfies **AC-2**, **AC-9**.
3. Integrate top back navigation and responsive container layout matching design system tokens, satisfies **AC-1**.
4. Implement sticky floating bottom bar with scroll threshold detection, satisfies **AC-8**.
5. Verify TypeScript compilation and runtime rendering across real database rows and preview items, satisfies **AC-2**, **AC-3**, **AC-5**, **AC-7**.

## Consequences

**Positive**:
- Candidates gain complete transparency into role requirements, salary estimates, and AI score justifications.
- Modular component hierarchy keeps files under 150 lines, maximizing maintainability and testability.
- Prepares UI architecture cleanly for Feature 13 company research injection without breaking layout contracts.

**Negative / tradeoffs**:
- Maintaining fallback logic for mock IDs introduces dual source reads during development, though it prevents broken routes when test databases are reset.

**Neutral**:
- Sticky apply bar requires client side scroll detection, so it operates as a focused client component wrapped inside the Server Component page.

## Follow-up

- [ ] Connect "Research Company" CTA button to the upcoming POST `/api/agent/research` route in Feature 13.
