# 0010. Stats Bar Real Data: Verification Checklist

**Date**: 2026-10-26  
**Status**: Proposed  

## Overview

This checklist defines the verification scenarios for Feature 15 (Stats Bar Real Data) to prove correct database retrieval, statistical calculation, and visual rendering across different user data states.

## Verification Scenarios

### Scenario 1: Candidate with Existing Discovered Jobs
- [ ] Log in with an account having existing jobs in the database (for example the active test candidate with 10 discovered jobs).
- [ ] Visit `/dashboard`.
- [ ] Card 1 (Total Jobs Found): displays `10`.
- [ ] Card 2 (Avg. Match Rate): displays `56%` (calculated from average of scores).
- [ ] Card 3 (Companies Researched): displays `1` (or matching count of jobs with non null research).
- [ ] Card 4 (Jobs This Week): displays `10` (since all 10 jobs were discovered within the past 7 days).
- [ ] Confirm no NaN or undefined values render anywhere on the cards.

### Scenario 2: Candidate with Zero Jobs (New User)
- [ ] Simulate or test with a user account with zero jobs in the database.
- [ ] Visit `/dashboard`.
- [ ] Card 1 (Total Jobs Found): displays `0` with subtitle `No jobs yet`.
- [ ] Card 2 (Avg. Match Rate): displays `0%` with subtitle `No matches yet`.
- [ ] Card 3 (Companies Researched): displays `0` with subtitle `Total researched`.
- [ ] Card 4 (Jobs This Week): displays `0` with subtitle `New this week`.
- [ ] Confirm page renders with zero errors, zero division crashes, and clean typography.

### Scenario 3: Build & Static Type Verification
- [ ] Run `npx tsc --noEmit` and confirm zero TypeScript errors.
- [ ] Run `npm run build` and confirm Next.js 16 build succeeds with clean Partial Prerendering on `/dashboard`.
