# 0012. Analytics Charts Real Data: Verification Checklist

**Date**: 2026-10-26  
**Status**: Proposed  

## Overview

This checklist defines the verification scenarios for Feature 17 (Analytics Charts Real Data) to prove accurate statistical bucketing, daily grouping, dynamic axis scaling, and empty state rendering across all three SVG charts.

## Verification Scenarios

### Scenario 1: Candidate with Existing Discovered Jobs and Research
- [ ] Log in with an account having real discovered jobs and company research.
- [ ] Visit `/dashboard`.
- [ ] `CompanyResearchChart`: confirms daily count displays on Monday for slihrms research, with other days at zero.
- [ ] `JobsFoundChart`: confirms jobs found timeline displays on Monday (count 10) and smooth spline curve spans the week.
- [ ] `MatchScoreDistributionChart`: confirms distribution bars reflect real match score ranges:
  - `50-60%`: 1 job
  - `60-70%`: 2 jobs
  - `70-80%`: 3 jobs
  - `80-90%`: 0 jobs
  - `90-100%`: 0 jobs
- [ ] Confirm SVG paths, labels, and tick lines render cleanly with zero NaN errors in console.

### Scenario 2: Candidate with Zero Jobs (New User)
- [ ] Simulate or test with a user account with zero jobs in the database.
- [ ] Visit `/dashboard`.
- [ ] Confirm `CompanyResearchChart` displays clean zero state or empty hint without crashing.
- [ ] Confirm `JobsFoundChart` displays flat baseline or empty hint without SVG path errors.
- [ ] Confirm `MatchScoreDistributionChart` displays empty state or baseline bars without errors.

### Scenario 3: Build & Static Type Verification
- [ ] Run `npx tsc --noEmit` and confirm zero TypeScript errors.
- [ ] Run `npm run build` and confirm Next.js 16 build succeeds with clean Partial Prerendering on `/dashboard`.
