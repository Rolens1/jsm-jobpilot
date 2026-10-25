# 0001. Database Schema and Storage Architecture

**Date**: 2026-10-24
**Status**: Accepted

## Summary

This specification establishes the core database schema and file storage for JobPilot on the InsForge PostgreSQL platform. It defines four primary tables named profiles, agent runs, jobs, and agent logs, alongside a secure bucket for candidate resumes. Creating this foundational data layer enables profile management, autonomous job search, and company research while enforcing data integrity and security from day one.

## Context

JobPilot operates as an autonomous job hunting agent requiring persistent storage for candidate profiles, scraped job listings, agent execution runs, and detailed execution logs. Candidate resumes in PDF format also need dependable object storage that restricts access strictly to the owner. Without a defined relational schema and storage structure, subsequent application features such as resume extraction, Adzuna job ingestion, and company research dossiers cannot persist data reliably.

Several key architectural forces influence this design. First, the application runs on Next.js 16 with Partial Prerendering and Server Actions, which demands consistent data models between client components and server mutations. Second, the autonomous agents execute multiple background operations that log progress in real time, requiring clean relational links between agent runs, discovered jobs, and log entries. Third, candidate resumes and personal contact details represent sensitive personal data, mandating strict user scoping and predictable authorization rules across both database rows and storage files.

## Requirements

**User stories**:
- As a candidate, I want my personal profile, job preferences, and uploaded resume stored securely so that autonomous agents can discover relevant jobs matching my background.
- As a candidate, I want discovered jobs, match scores, and company research dossiers organized under my account so that I can review opportunities without losing historical findings.
- As an autonomous agent, I want structured tables to record execution states, discovered listings, and audit logs so that the user interface can display progress in real time.

**Acceptance criteria**:
- **AC-1**: Database schema establishes profiles, agent runs, jobs, and agent logs tables in InsForge PostgreSQL with exact column types, default values, and foreign key relations.
- **AC-2**: The resumes storage bucket is created with authenticated access restricted so that users can only upload, read, and delete files within their own user identifier directory path.
- **AC-3**: Row level security is enabled across all tables, allowing users to query discovered jobs while restricting row insertions, updates, and deletions strictly to the owning authenticated user.
- **AC-4**: The jobs table enforces a unique composite constraint on user id and source url, supporting upsert mutations to refresh match scores without creating duplicate records.
- **AC-5**: Deleting an agent run retains discovered job records by setting run references to null, while removing a user profile cascades and cleans up all dependent records.
- **AC-6**: Every table includes automated timestamp auditing using created at and updated at columns.

## Options considered

### Option 1: Monolithic tables with public storage

Store job listings and profile records without strict relational constraints, using a single open storage bucket for uploaded documents.

**Pros**:
- Fastest setup with minimal database migrations.
- Simple querying with no complex foreign key hierarchies.

**Cons**:
- Fails data security standards by exposing candidate resumes publicly.
- Lacks relational integrity, risking orphaned records and duplicate listings.

### Option 2: Normalized relational schema with user scoped storage and Row Level Security

Create distinct relational tables for profiles, agent runs, jobs, and agent logs with foreign keys, composite uniqueness constraints, Row Level Security policies, and user partitioned file storage.

**Pros**:
- Guarantees data integrity with proper cascade rules and foreign keys.
- Enforces data isolation where candidates only modify their own data.
- Prevents duplicate job records via composite indexing on source urls.

**Cons**:
- Requires deliberate schema migration execution before feature development.
- Row level security policies require accurate user context in server queries.

## Decision

**Chosen option**: Option 2: Normalized relational schema with user scoped storage and Row Level Security

We establish a normalized schema in InsForge PostgreSQL with four relational tables and an authenticated storage bucket.

**Implementation skills**: `insforge` (`context/library-docs.md`)

## Rationale

Option 2 directly satisfies the architectural requirements of JobPilot. A candidate profile must serve as the single source of truth for background details, skills, and resume metadata. Agent runs must track discovery cycles, while jobs must hold both structured metadata and flexible JSON data for match evaluations and company research dossiers. Enforcing unique composite constraints on user id and source url eliminates duplicate listings when users run multiple searches for similar roles. Setting foreign keys on jobs to set null on run deletion ensures saved listings remain accessible even if temporary run logs are cleared.

## Feature design

**Data model sketch**:

Table `profiles`:
- `id` (uuid, primary key, references `auth.users(id)` on delete cascade)
- `full_name` (text, nullable)
- `email` (text, not null)
- `phone` (text, nullable)
- `location` (text, nullable)
- `current_title` (text, nullable)
- `experience_level` (text, check in junior, mid, senior, lead)
- `years_experience` (integer, default 0)
- `skills` (text array, default empty)
- `industries` (text array, default empty)
- `work_experience` (jsonb, default empty array)
- `education` (jsonb, default empty array)
- `job_titles_seeking` (text array, default empty)
- `remote_preference` (text, default any, check in remote, onsite, hybrid, any)
- `preferred_locations` (text array, default empty)
- `salary_expectation` (text, nullable)
- `cover_letter_tone` (text, default enthusiastic, check in formal, casual, enthusiastic)
- `linkedin_url` (text, nullable)
- `portfolio_url` (text, nullable)
- `work_authorization` (text, default citizen, check in citizen, permanent resident, visa required)
- `resume_pdf_url` (text, nullable)
- `is_complete` (boolean, default false)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

Table `agent_runs`:
- `id` (uuid, primary key, default gen random uuid)
- `user_id` (uuid, not null, references profiles on delete cascade)
- `status` (text, not null, default running, check in running, completed, failed)
- `job_title_searched` (text, not null)
- `location_searched` (text, nullable)
- `jobs_found` (integer, default 0)
- `started_at` (timestamptz, default now())
- `completed_at` (timestamptz, nullable)

Table `jobs`:
- `id` (uuid, primary key, default gen random uuid)
- `run_id` (uuid, nullable, references agent runs on delete set null)
- `user_id` (uuid, not null, references profiles on delete cascade)
- `source` (text, not null, check in search, url)
- `source_url` (text, not null)
- `external_apply_url` (text, nullable)
- `title` (text, not null)
- `company` (text, not null)
- `location` (text, nullable)
- `salary` (text, nullable)
- `job_type` (text, default fulltime, check in fulltime, parttime, contract)
- `about_role` (text, nullable)
- `responsibilities` (text array, default empty)
- `requirements` (text array, default empty)
- `nice_to_have` (text array, default empty)
- `benefits` (text array, default empty)
- `about_company` (text, nullable)
- `match_score` (integer, default 0, check between 0 and 100)
- `match_reason` (text, nullable)
- `matched_skills` (text array, default empty)
- `missing_skills` (text array, default empty)
- `company_research` (jsonb, nullable)
- `found_at` (timestamptz, default now())
- Constraint: unique composite on (user id, source url)

Table `agent_logs`:
- `id` (uuid, primary key, default gen random uuid)
- `run_id` (uuid, not null, references agent runs on delete cascade)
- `user_id` (uuid, not null, references profiles on delete cascade)
- `message` (text, not null)
- `level` (text, default info, check in info, success, warning, error)
- `job_id` (uuid, nullable, references jobs on delete set null)
- `created_at` (timestamptz, default now())

Storage Bucket `resumes`:
- Bucket name: `resumes`
- Access: Authenticated users only, read and write allowed only under path matching user id.

**State transitions**:
- `agent_runs.status`: `running` -> `completed` (normal finish) or `failed` (uncaught error).
- `jobs.status` (for application tracking): `saved` -> `applied` -> `interviewing` -> `rejected`.

**API surface**:

| Interface | Operation | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| profiles | Upsert | user id, full name, profile fields | profile record | Authenticated | 400 invalid data, 403 unauthorized |
| agent_runs | Create / Update | user id, job title, location, status | run id, timestamp | Authenticated | 400 missing fields |
| jobs | Upsert | user id, source url, title, company, match score | job id, timestamps | Authenticated | 409 conflict, 400 invalid schema |
| agent_logs | Insert | run id, user id, message, level | log id | Authenticated | 400 missing run reference |
| resumes bucket | Upload / Read | user id file path, binary buffer | storage url | Authenticated | 403 access denied, 413 payload too large |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Create Profile | user id | Authenticated session token from InsForge Auth |
| Calculate Completion | is complete boolean | Derived from presence of required profile fields |
| Store Resume | resume pdf url | Storage bucket upload path returned by InsForge Storage |
| Run Job Search | jobs found count | Aggregated count of listings returned by Adzuna agent |
| Job Scoring | match score integer | Computed by GPT model comparing job requirements with user skills |
| Company Research | company research jsonb | Extracted dossier synthesized by Stagehand and Browserbase agent |

**Key invariants**:
- Every profile row must correspond to a valid authenticated user in the authentication system.
- Discovered job listings must never duplicate for the same user with the same source url.
- An agent log must always link to a valid agent run.
- Uploaded resume files must always reside within a folder path named after the uploading user id.

**Security model**:
- Row Level Security enabled on all four tables.
- Table `profiles`: SELECT, INSERT, UPDATE, DELETE allowed only when `auth.uid() = id`.
- Table `agent_runs`: SELECT, INSERT, UPDATE, DELETE allowed only when `auth.uid() = user_id`.
- Table `jobs`: SELECT permitted for all authenticated users to allow market comparison; INSERT, UPDATE, and DELETE restricted to `auth.uid() = user_id`.
- Table `agent_logs`: SELECT, INSERT, UPDATE, DELETE allowed only when `auth.uid() = user_id`.
- Storage bucket `resumes`: Read and write permissions granted only to authenticated users whose identifier matches the folder prefix.

**Configuration required**:
- None. Relies on existing `NEXT_PUBLIC_INSFORGE_URL` and `NEXT_PUBLIC_INSFORGE_ANON_KEY` configurations.

**Critical test scenarios**:
- Happy path: User creates profile, uploads resume to storage bucket, runs job search which writes run and job records, verifies **AC-1**, **AC-2**, **AC-4**.
- Duplicate job detection: Inserting a job record with matching user id and source url updates the existing record rather than creating a duplicate, verifies **AC-4**.
- Foreign key cascade: Deleting an agent run clears associated agent logs while preserving discovered jobs with run id set to null, verifies **AC-5**.
- Security boundary: Attempting to update another user profile or read another user resume file produces an access denied error, verifies **AC-2**, **AC-3**.

## Build plan

- [x] 1. Execute raw SQL migration via InsForge MCP to create the profiles table with constraints and triggers, satisfies **AC-1**, **AC-6**.
- [x] 2. Execute raw SQL migration to create the agent runs table with status constraints and user foreign key, satisfies **AC-1**, **AC-6**.
- [x] 3. Execute raw SQL migration to create the jobs table with composite unique index on user id and source url, satisfies **AC-1**, **AC-4**, **AC-6**.
- [x] 4. Execute raw SQL migration to create the agent logs table with foreign keys referencing agent runs and jobs, satisfies **AC-1**, **AC-5**, **AC-6**.
- [x] 5. Execute SQL policies to enable Row Level Security and configure access rules across all four tables, satisfies **AC-3**.
- [x] 6. Create the resumes storage bucket via InsForge MCP and configure storage access policies, satisfies **AC-2**.
- [x] 7. Run verification query to confirm table definitions, column types, unique constraints, and bucket availability, satisfies **AC-1**, **AC-2**, **AC-4**.

## Consequences

**Positive**:
- Complete relational backbone ready for profile forms, resume parsers, and agent discovery loops.
- Automatic duplicate prevention eliminates redundant job rows across repeated searches.
- Clear audit trails preserved via agent run histories and structured log entries.

**Negative / tradeoffs**:
- Storing rich JSON structures inside work experience, education, and company research requires client side type casting.
- Composite uniqueness on source url means canonical listings sharing the exact url across different companies must be normalized cleanly.

**Neutral**:
- TypeScript interfaces in the application will need manual synchronization with PostgreSQL column names until an automated type generator is introduced.

## Follow-up

- [x] Create TypeScript type definitions in `types/database.ts` representing database records for clean typing in Server Actions.
- [ ] Implement database client helper methods in `lib/insforge-server.ts` for standardized table queries.

## References

(basis: project documentation and architecture standards)

**Project sources**:
- `context/architecture.md`, database schema and storage specifications
- `context/build-plan.md`, feature 04 definition and roadmap
- `context/code-standards.md`, TypeScript and InsForge SDK conventions

**Practices & standards**:
- Row Level Security for multi tenant user isolation
- Idempotent upsert mutations for web scraping pipelines
- User scoped folder isolation for cloud object storage
