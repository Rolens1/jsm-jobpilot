# Verification Guide: Multi Provider Job Discovery Agent

## Overview

This document specifies the verification criteria and manual test scenarios to validate Feature 10 (Multi Provider Job Discovery Agent).

## Verification Scenarios

### Scenario 1: Initial Discovery with Primary Provider (JSearch)
1. Navigate to `/find-jobs` while signed in.
2. Enter Job Title: `Frontend Developer` and Location: `Montreal, QC`.
3. Click `Find Jobs`.
4. Verify network tab sends `POST /api/agent/find` with payload `{ jobTitle: "Frontend Developer", location: "Montreal, QC" }`.
5. Verify response returns `200 OK` with `runId`, `jobsFound`, `jobsSaved`, and an array of 10 scored jobs.
6. Verify database records:
   * `agent_runs` table has a new record with status `completed`.
   * `jobs` table has 10 new records with `match_score` between 0 and 100, `matched_skills`, and `missing_skills`.
7. Verify green success banner renders: "Found 10 jobs and saved X strong matches."

### Scenario 2: Same Search Guard (Zero Quota Consumption)
1. With the inputs still set to `Frontend Developer` and `Montreal, QC`, click `Find Jobs` again immediately.
2. Verify the server returns the existing saved jobs from the database without invoking the external JSearch API.
3. Verify that zero additional API credits are consumed on RapidAPI.

### Scenario 3: On Demand Pagination (Load More from Web)
1. Scroll to the bottom of the jobs list on `/find-jobs`.
2. Click `Load 10 More from Web`.
3. Verify network tab sends `POST /api/agent/find` with `page: 2` and `forceRefresh: true`.
4. Verify 10 new additional jobs are retrieved, deduplicated against existing database entries, scored by GPT-4o, and appended to the UI table.

### Scenario 4: Automated Provider Fallback
1. Temporarily invalidate or empty `RAPIDAPI_KEY` in environment.
2. Trigger a new search for `Fullstack Developer` in `Montreal, QC`.
3. Verify the orchestrator catches the JSearch failure and cascades smoothly to Jooble or Adzuna without returning an error to the frontend.
4. Verify jobs from the fallback provider are scored and saved to the database.

## Automated Verification Commands

```bash
# Typecheck validation
npm run build --no-lint

# Unit tests if configured
npm test
```
