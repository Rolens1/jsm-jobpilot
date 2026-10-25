# 0005. Find Jobs Page Full UI

**Date**: 2026-10-25  
**Status**: Accepted  

## Summary

This decision defines the architecture and user interface for the Find Jobs page in JobPilot. We build the full client interface using rich mock data before connecting live job search services or database queries. This approach guarantees that every table row, score bar, filter dropdown, and search control is visually verified against design mockups and token rules.

## Requirements

**User stories**:
- As a job seeker, I want to explore and filter discovered jobs on a clean dashboard so that I can evaluate role opportunities quickly.
- As a job seeker, I want to search by job title and location with instant feedback so that I know how many matching positions were found.
- As a job seeker, I want to sort roles by match score or posting date so that I can prioritize the best career options.

**Acceptance criteria**:
- **AC-1**: Top navigation bar highlights the Find Jobs link with active purple styling and icon on `/find-jobs`.
- **AC-2**: Search controls card displays Job Title input, Location input, and Find Jobs button matching the layout in `context/designs/find-jobs.png`.
- **AC-3**: Clicking Find Jobs triggers a brief simulated loading state and displays the green search feedback banner showing found job counts.
- **AC-4**: Filter bar provides real time text search, score threshold filter dropdown (All Matches, High Match 70% and above, Low Match under 70%), and sorting dropdown (Match Score, Newest, Oldest).
- **AC-5**: Jobs table displays company name, role title, color coded match score bar with percentage, salary estimate, source badge, and formatted date found.
- **AC-6**: Match score bar renders green for scores 80 to 100, blue for 60 to 79, and orange for scores below 60, using project design tokens only.
- **AC-7**: Pagination controls display the current result slice count, page numbers, and interactive Previous and Next buttons.
- **AC-8**: Clicking any job row or title navigates to the dedicated job details route at `/find-jobs/[id]`.

## Decision

**Chosen option**: Option 1: Modular component architecture with interactive mock data simulation.

We build four focused client components under `components/find-jobs/` coordinated by a central container component, seeded with twenty four realistic mock positions mirroring the InsForge jobs schema.

**Implementation skills**: Next.js 16 App Router conventions, Tailwind CSS v4 design tokens in `app/globals.css`.

## Rationale

Reasoning and options: see [rationale.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0005-find-jobs-ui/rationale.md).

## Feature design

**Data model sketch**:
The mock data structure matches the `jobs` database table schema exactly:

| Field | Type | Description |
|---|---|---|
| id | string | Unique identifier |
| title | string | Job role title e.g. Frontend Engineer |
| company | string | Employer name e.g. Stripe, Vercel |
| location | string | Job location e.g. San Francisco CA, Remote |
| salary | string or null | Formatted salary range e.g. $140k to $175k |
| job_type | text | fulltime, parttime, or contract |
| source | text | search or url |
| source_url | string | Source listing link |
| external_apply_url | string | Application URL |
| match_score | integer | 0 to 100 calculated match score |
| match_reason | string | Short explanation paragraph |
| matched_skills | array of text | Skills matching user profile |
| missing_skills | array of text | Skills required but absent |
| found_at | timestamp | ISO date string for sorting |

**State transitions**:
The search and filtering workflow moves through clear user interface states:
- `idle`: Displays the initial twenty four mock jobs with page one active (six jobs per page).
- `searching`: Triggered on clicking Find Jobs, shows spinner on the action button for 600 milliseconds.
- `banner_active`: Displays the green notification banner ("Found 8 jobs and saved 4 strong matches") below search controls.
- `filtered`: Updates visible table rows immediately when typing in text filter or switching match score dropdowns.
- `empty`: Shows clean empty state illustration and reset filter button when no jobs match active query criteria.

**API surface**:
| Surface | Method | Inputs | Key outputs | Auth | Errors |
|---|---|---|---|---|---|
| `/find-jobs` | GET | URL search parameters (page, search, filter, sort) | Rendered HTML page with search controls and table | Authenticated | Redirect to `/login?next=/find-jobs` |
| Mock search dispatch | Local client handler | `jobTitle: string`, `location: string` | Banner visibility and simulated count notification | Client side | Validation warning on blank inputs |

**Value sourcing**:
| Action or Surface | Value produced or displayed | Source |
|---|---|---|
| Search controls | Pre filled title ("Frontend Engineer") | Initial container state or URL query parameter |
| Search controls | Pre filled location ("Remote, San Francisco") | Initial container state or URL query parameter |
| Notification banner | Job discovery summary text | Simulated search result count derived from mock list |
| Filter bar | Search query input | Controlled input state in filter bar |
| Filter bar | Selected match threshold tab | Filter state enum (all, high, low) |
| Filter bar | Selected sort option | Sort state enum (match_score, newest, oldest) |
| Jobs table | Company name and title | `job.company` and `job.title` from active mock slice |
| Jobs table | Color coded match score progress bar | `job.match_score` styled with token color classes |
| Jobs table | Salary estimate text | `job.salary` or fallback text "Salary not disclosed" |
| Jobs table | Source badge | `job.source` rendered with `bg-linkedin-light` or `bg-surface-secondary` |
| Jobs table | Formatted date found | `job.found_at` formatted to relative human text e.g. "2 days ago" |
| Pagination row | Current page range ("Showing 1 to 6 of 24 results") | Computed slice bounds from total filtered length |

**Key invariants**:
- Zero hardcoded colors: All styling references semantic tokens from `app/globals.css` (`bg-surface`, `border-border`, `text-accent`, `bg-success`).
- Strict authentication boundary: Unauthenticated visits redirect to `/login?next=/find-jobs` via `middleware.ts` and server layout verification.
- Non destructive interaction: Filter and search actions operate in client memory without mutating baseline data.
- Responsive design: Search inputs stack cleanly on mobile viewports; table scrolls horizontally with sticky column headers on narrow screens.

**Security model**:
- Route protection: Server component in `app/find-jobs/page.tsx` calls `createInsforgeServer()` and checks `auth.getCurrentUser()`.
- Client data isolation: In mock phase, no sensitive candidate tokens or backend secrets are exposed to the browser.

**Configuration required**:
None. Feature 09 utilizes existing project dependencies and design tokens without new environment variables.

**Critical test scenarios**:
- Happy path: User loads `/find-jobs`, observes 6 jobs on page 1, enters new search term, triggers Find Jobs to see loading state and green banner, verifies **AC-1**, **AC-2**, **AC-3**.
- Filter and sort: User enters "Stripe" in filter bar, verifies only Stripe roles remain, toggles High Match filter, switches sort to Newest, verifies **AC-4**, **AC-5**, **AC-6**.
- Pagination navigation: User clicks page 2, verifies slice updates to jobs 7 through 12, verifies **AC-7**.
- Detail navigation: User clicks a job row, verifies link points to `/find-jobs/[id]`, verifies **AC-8**.

## Build plan

1. Create mock dataset in `lib/mock-jobs.ts` containing 24 realistic positions with diverse companies, salaries, scores, and dates, satisfies **AC-5**.
2. Build SearchControls component in `components/find-jobs/SearchControls.tsx` with inputs, search button, and animated success banner, satisfies **AC-2**, **AC-3**.
3. Build JobFilters component in `components/find-jobs/JobFilters.tsx` with text search input, match threshold dropdown, and sort selector, satisfies **AC-4**.
4. Build JobsTable component in `components/find-jobs/JobsTable.tsx` featuring score progress bar, salary badges, source tags, and empty states, satisfies **AC-5**, **AC-6**, **AC-8**.
5. Build JobsPagination component in `components/find-jobs/JobsPagination.tsx` with page numbers, slice count, and active page styles, satisfies **AC-7**.
6. Assemble FindJobsContainer client component in `components/find-jobs/FindJobsContainer.tsx` connecting state, filtering, sorting, and pagination, satisfies **AC-3**, **AC-4**, **AC-7**.
7. Create authenticated server page route in `app/find-jobs/page.tsx` rendering navbar, breadcrumbs, and container, satisfies **AC-1**, **AC-8**.

## Consequences

**Positive**:
- Allows immediate visual validation of the complete search and job browsing experience before calling paid or rate limited Adzuna APIs.
- Gives stakeholders and developers an instant clickable showcase for filtering, sorting, score bars, and pagination behaviors.
- Establishes modular components that will connect cleanly to live server queries in Features 10 and 11 without redesigning markup.

**Negative / tradeoffs**:
- Requires creating and maintaining realistic mock datasets that will be replaced once live API ingestion arrives.
- Client side pagination over mock data temporarily operates in local state until server side SQL pagination is added in Feature 11.

**Neutral**:
- New component pattern entries must be imprinted into `context/ui-registry.md`.

## Follow-up

- [ ] Implement Feature 10 (Adzuna Job Discovery API route and GPT-4o scoring).
- [ ] Implement Feature 11 (InsForge database persistence, server side filtering, sorting, and pagination).
