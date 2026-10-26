# 0011. Recent Activity Real Data: Verification Checklist

**Date**: 2026-10-26  
**Status**: Proposed  

## Overview

This checklist defines the verification scenarios for Feature 16 (Recent Activity Real Data) to prove correct database retrieval, event deduplication, string formatting, and timeline rendering.

## Verification Scenarios

### Scenario 1: Candidate with Existing Agent Runs and Researched Companies
- [ ] Log in with an account having real agent runs and researched companies (for example the active test candidate with runs for Analyste Financier and slihrms).
- [ ] Visit `/dashboard`.
- [ ] Confirm Recent Activity card renders chronological rows:
  - Event showing researched company (for example `Researched slihrms`) with an info blue indicator dot.
  - Event showing discovered jobs (for example `Found 10 jobs for Analyste Financier`) with an accent purple or success green indicator dot.
- [ ] Confirm timestamps display relative formats (such as `Just now`, `X hours ago`, or `Yesterday`).
- [ ] Confirm no duplicate research events appear for the same company within the same run window.

### Scenario 2: Candidate with Zero Activity (New User)
- [ ] Simulate or test with a user account with zero agent runs and zero researched companies.
- [ ] Visit `/dashboard`.
- [ ] Confirm Recent Activity card renders a clean empty state prompt rather than a blank or broken list.
- [ ] Confirm connector line is hidden or styled cleanly during empty state.

### Scenario 3: Build & Static Type Verification
- [ ] Run `npx tsc --noEmit` and confirm zero TypeScript errors.
- [ ] Run `npm run build` and confirm Next.js 16 build succeeds with clean Partial Prerendering on `/dashboard`.
