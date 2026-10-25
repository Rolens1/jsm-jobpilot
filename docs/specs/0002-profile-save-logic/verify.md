# Verify: Profile save logic · spec 0002 · updated 2026-10-24
_Steps derived from spec 0002 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] Visit `/profile` with an active session, select a valid PDF resume file, and click Save Profile → resume file uploads to `resumes/{user_id}/resume.pdf` with public URL saved to `profiles.resume_pdf_url` → AC-1
- [ ] Fill out all text fields, skills tags, and work experience, then click Save Profile → all columns persist to `profiles` table scoped strictly to authenticated user ID → AC-2
- [ ] Fill out all required fields with empty work history → `is_complete` evaluates to true and progress circle displays 100 percent → AC-3
- [ ] Complete profile for the first time → PostHog captures `profile_completed` analytics event with authenticated user ID → AC-4
- [ ] Simulate network storage failure during upload → text profile details are still saved and banner warning is shown → AC-5
- [ ] Reload `/profile` on a return visit → saved profile details prefill directly without loading waterfall → AC-6
- [ ] After saving profile, revalidation occurs → navigation back to `/profile` shows immediate fresh state → AC-7

## Commands
- [ ] `npx tsc --noEmit` → exit code 0, zero type errors → AC-2
- [ ] `npm run build` → exit code 0, all routes compile cleanly with Turbopack → AC-6, AC-7

## Acceptance-criteria coverage
- AC-1 covered by step 1 · AC-2 covered by step 2, command 1 · AC-3 covered by step 3 · AC-4 covered by step 4 · AC-5 covered by step 5 · AC-6 covered by step 6, command 2 · AC-7 covered by step 7, command 2
