# Verify: Database Schema and Storage Architecture (Feature 04)

_Verification checklist derived from spec 0001 acceptance criteria and value sourcing definitions. Used by verification tools and test suites._

## Database and Storage Verification

- [x] Query `information_schema.tables` in public schema → confirms `profiles`, `agent_runs`, `jobs`, and `agent_logs` exist → AC-1
- [x] Query `pg_policies` in public schema → confirms 16 RLS policies active across all four tables → AC-3
- [x] Query `pg_constraint` on `public.jobs` → confirms `jobs_user_source_url_unique` constraint exists → AC-4
- [x] Query `pg_constraint` on `public.jobs` → confirms `jobs_run_id_fkey` with `ON DELETE SET NULL` exists → AC-5
- [x] Query `information_schema.triggers` on `profiles` and `jobs` → confirms `handle_updated_at` trigger active → AC-6
- [x] Query `information_schema.triggers` on `auth.users` → confirms `handle_new_user` auto provision trigger active → AC-1
- [x] Call `list-buckets` MCP tool → confirms `resumes` bucket exists with `public: false` → AC-2
- [x] TypeScript validation via `npx tsc --noEmit` → confirms `types/database.ts` compiles cleanly with zero errors → AC-1

## Value Sourcing Verification

- [x] Profile user identifier: Resolves from `auth.users(id)` and auto provisions row via `handle_new_user` trigger
- [x] Job uniqueness: Composite constraint on `(user_id, source_url)` protects against duplicate web scraping records
- [x] Discovered job match score: Validated integer between 0 and 100 via check constraint
- [x] Storage path isolation: Bucket permissions restricted so users access files only under their own user identifier prefix

## Acceptance Criteria Coverage

- AC-1 (Relational schema tables and types): Covered by table checks and TypeScript type definitions
- AC-2 (Private resumes storage bucket): Covered by list-buckets query verifying `public: false`
- AC-3 (Row Level Security enforcement): Covered by pg_policies query confirming 16 policies
- AC-4 (Unique composite job constraint): Covered by pg_constraint query on `(user_id, source_url)`
- AC-5 (Cascade and set null foreign keys): Covered by pg_constraint foreign key definitions
- AC-6 (Timestamp audit triggers): Covered by information_schema triggers on updated_at
