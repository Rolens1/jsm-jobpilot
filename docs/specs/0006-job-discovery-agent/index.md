# 0006. Multi Provider Job Discovery Agent

**Date**: 2026-10-25  
**Status**: Accepted  

## Summary

This build spec defines the multi provider job discovery and evaluation engine for Feature 10 in JobPilot. The system queries external job networks using JSearch on RapidAPI as the primary provider with full job descriptions and company logos, falling back to Jooble and Adzuna if quotas are exceeded or fresh listings are exhausted. The agent deduplicates listings against a shared PostgreSQL database, protects user quotas by skipping external calls when search terms are unchanged, and lets users load additional result pages on demand.

## Requirements

**User stories**:
- As a job seeker, I want to search for developer roles by title and location so that I discover relevant opportunities in Montreal and across Canada.
- As a job seeker, I want the system to evaluate found jobs against my resume profile using AI so that I see personalized match scores and skill gaps immediately.
- As a job seeker, I want to load more listings on demand when initial results do not yield enough matches so that I can explore deeper opportunities without wasting API quota up front.
- As a platform user, I want search queries to be fast and economical so that my monthly search allowances are protected and jobs discovered by others can be surfaced quickly.

**Acceptance criteria**:
- **AC-1**: Submitting a search from `/find-jobs` calls the server endpoint `POST /api/agent/find` with `jobTitle` and `location`.
- **AC-2**: The server checks the database for existing jobs matching the normalized title and location. If the user submits the exact same search without changing their input, the server returns the existing database matches without consuming external API credits.
- **AC-3**: When external discovery runs, the agent queries JSearch as the primary provider with `num_pages: 1` (10 jobs) to retrieve full descriptions, employer logos, and direct apply links.
- **AC-4**: If JSearch encounters an error, rate limit, or 429 status code, the agent cascades automatically to Jooble as the secondary provider, and then to Adzuna as the tertiary provider.
- **AC-5**: The agent computes a unique content fingerprint for each returned listing (normalized company name, job title, and location) and discards any job already stored in the database for the user.
- **AC-6**: For all new, unique job listings, the agent runs a single batch GPT-4o evaluation prompt to calculate integer match scores from 0 to 100, a match reason summary, matched skills, and missing skills.
- **AC-7**: The agent records an `agent_runs` tracking row in InsForge, persists the scored jobs to the `jobs` table, and logs audit events to `agent_logs`.
- **AC-8**: The Find Jobs interface displays the discovered jobs in the table, shows a success banner with total found and saved counts, and provides a Load More from Web button that queries the next page index on demand.

## Decision

**Chosen option**: Option 3: Cascading Multi Provider Engine with Shared Job Pool, Same Search Guard, and On Demand Pagination.

We build an extensible provider client in `lib/job-search/` featuring unified response normalization, multi provider fallback (JSearch primary, Jooble secondary, Adzuna tertiary), database deduplication, and a single batch GPT-4o evaluation pipeline.

**Implementation skills**: Next.js 16 App Router route handlers, InsForge PostgreSQL SDK, OpenAI GPT-4o batch structured outputs, Context7 JSearch API specifications.

## Rationale

Reasoning and options: see [rationale.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0006-job-discovery-agent/rationale.md).

## Feature design

**Data model sketch**:
Uses existing tables defined in [0001-database-schema.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0001-database-schema.md) and [types/database.ts](file:///d:/Ai%20Projects/job-pilot/types/database.ts):

1. `jobs`:
   * `id`: string (UUID)
   * `user_id`: string (UUID, references auth.users)
   * `run_id`: string or null (UUID, references agent_runs)
   * `source`: "search"
   * `source_url`: string
   * `external_apply_url`: string or null
   * `title`: string
   * `company`: string
   * `location`: string or null
   * `salary`: string or null
   * `job_type`: "fulltime" | "parttime" | "contract"
   * `about_role`: string (full description from JSearch or snippet from Jooble)
   * `about_company`: string or null
   * `match_score`: number (0 to 100)
   * `match_reason`: string or null
   * `matched_skills`: string array
   * `missing_skills`: string array
   * `company_research`: null (populated later in Feature 13)
   * `found_at`: ISO timestamp

2. `agent_runs`:
   * `id`: string (UUID)
   * `user_id`: string (UUID)
   * `status`: "running" | "completed" | "failed"
   * `job_title_searched`: string
   * `location_searched`: string or null
   * `jobs_found`: number
   * `started_at`: ISO timestamp
   * `completed_at`: ISO timestamp or null

3. `agent_logs`:
   * `id`: string (UUID)
   * `run_id`: string (UUID)
   * `user_id`: string (UUID)
   * `message`: string
   * `level`: "info" | "success" | "warning" | "error"
   * `job_id`: string or null
   * `created_at`: ISO timestamp

**State transitions**:
`AgentRun` state transitions:
`running` (created when search commences) -> `completed` (all jobs saved and scored) or `failed` (unrecoverable provider error).

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/agent/find` | POST | `jobTitle: string` (req), `location: string` (req), `page: number` (opt, default 1), `forceRefresh: boolean` (opt, default false) | `runId: string`, `jobsFound: number`, `jobsSaved: number`, `jobs: Job[]` | Session Cookie | 400 invalid inputs, 401 unauthenticated, 429 quota exhausted across all providers, 500 server error |

**Value sourcing**:

| Output Value | Produced By | Source |
|---|---|---|
| `job.title` | Provider Client | Normalized from provider payload |
| `job.company` | Provider Client | Employer name from provider payload |
| `job.location` | Provider Client | City, state, country string |
| `job.salary` | Provider Client | Structured salary string or null |
| `job.about_role` | Provider Client | Full job description (JSearch) or snippet |
| `job.external_apply_url` | Provider Client | Direct apply link or board link |
| `job.match_score` | AI Evaluation | Integer 0 to 100 from GPT-4o batch response |
| `job.match_reason` | AI Evaluation | One paragraph synthesis from GPT-4o |
| `job.matched_skills` | AI Evaluation | String array extracted by GPT-4o against profile |
| `job.missing_skills` | AI Evaluation | String array extracted by GPT-4o against profile |
| `agent_run.jobs_found` | Route Handler | Total count of raw jobs returned by external provider |
| `agent_run.status` | Route Handler | Lifecycle state update upon completion or failure |

**Invariants and Business Rules**:
- **Same Search Guard**: If the current user submitted the identical `jobTitle` and `location` previously and `forceRefresh` is false, return the existing database records without consuming external API credits.
- **One Page per Search**: Default external calls to `page: 1` (`num_pages: 1` in JSearch). Only fetch page 2 or higher if the user explicitly triggers "Load More from Web".
- **Batch Evaluation**: All new unique jobs are evaluated together in a single structured OpenAI call using `response_format: { type: "json_object" }`.
- **Deduplication Priority**: Existing listings matching normalized `company + title + location` are preserved; duplicates are filtered out before AI scoring.

**Configuration Requirements**:
- `RAPIDAPI_KEY`: RapidAPI secret token for JSearch
- `RAPIDAPI_HOST`: Host header (`jsearch.p.rapidapi.com`)
- `JOOBLE_API_KEY`: Jooble developer partner key (secondary fallback)
- `ADZUNA_APP_ID`: Adzuna application identifier (tertiary fallback)
- `ADZUNA_APP_KEY`: Adzuna secret key (tertiary fallback)
- `OPENROUTER_API_KEY`: API key for GPT-4o scoring

## Build plan

- [x] **Task 1: Provider Clients and Unified Schema** (Satisfies AC-3, AC-4):
  Create `lib/job-search/types.ts` defining `UnifiedJob` and provider interfaces. Implement `lib/job-search/jsearch.ts`, `lib/job-search/jooble.ts`, and `lib/job-search/adzuna.ts`.
- [x] **Task 2: Cascading Search Orchestrator** (Satisfies AC-2, AC-3, AC-4, AC-5):
  Implement `lib/job-search/orchestrator.ts` handling same search database checks, provider fallback cascade, and deduplication against the InsForge `jobs` table.
- [x] **Task 3: Batch AI Scoring Pipeline** (Satisfies AC-6):
  Implement `lib/job-search/scorer.ts` using OpenAI GPT-4o to score an array of job listings against user profile skills and experience in a single prompt.
- [x] **Task 4: Route Handler Implementation** (Satisfies AC-1, AC-7):
  Build `app/api/agent/find/route.ts` handling session authentication, input validation, run lifecycle tracking in `agent_runs`, database persistence in `jobs`, and logging in `agent_logs`.
- [x] **Task 5: UI Integration and On Demand Pagination** (Satisfies AC-8):
  Wire `components/find-jobs/FindJobsContainer.tsx` to call `/api/agent/find`, display live database records, show feedback banners, and add the on demand "Load More from Web" button.

## Consequences

- **Positive**: 200 monthly JSearch credits last significantly longer through query caching, deduplication, and single page fetching.
- **Positive**: Users receive rich full job descriptions, employer logos, and high quality AI match evaluations.
- **Positive**: If JSearch runs out of tokens, searches fail over seamlessly to Jooble and Adzuna without user disruption.
- **Negative**: Snippets from fallback providers (Jooble or Adzuna) contain less text than JSearch, yielding slightly less comprehensive AI skill evaluations during fallbacks.

## Follow up

- Update `context/library-docs.md` to document the unified `searchJobsAcrossProviders` function and environment variables.
- Update `context/build-plan.md` to reflect Feature 10 multi provider architecture.
