# 0009. Dashboard Page Full UI: Verification Checklist

**Date**: 2026-10-26  
**Status**: Proposed  

## Overview

This checklist defines the visual and functional acceptance scenarios for Feature 14 (Dashboard Page Full UI) to verify alignment against `context/designs/dashboard.png` and `docs/specs/0009-dashboard-page-ui/index.md`.

## Acceptance Criteria Verification

### AC-1: Top Navigation State
- [ ] Visit `/dashboard` while authenticated.
- [ ] Confirm the top Navbar displays the active purple border and purple icon on `Dashboard`.
- [ ] Confirm `Find Jobs` and `Profile` links display inactive muted text styling.
- [ ] Confirm authenticated user email is displayed in the header.

### AC-2: Profile Incomplete Attention Banner
- [ ] Test with a candidate account where `profiles.is_complete` is `false`.
- [ ] Confirm `ProfileAttentionBanner` renders at the top of the dashboard main content area.
- [ ] Confirm circular progress ring, completion percentage, and missing field tags render cleanly.
- [ ] Test with a profile where `is_complete` is `true`; confirm the attention banner is cleanly omitted.

### AC-3: Stats Bar Metrics Grid
- [ ] Verify Card 1: Label `Total Jobs Found`, value `284`, green pill badge `+12%`, muted label `vs last week`.
- [ ] Verify Card 2: Label `Avg. Match Rate`, value `82%`, green pill badge `+3%`, muted label `vs last week`.
- [ ] Verify Card 3: Label `Companies Researched`, value `35`, subtitle `Total researched`.
- [ ] Verify Card 4: Label `Jobs This Week`, value `28`, subtitle `New this week`.
- [ ] Confirm cards are styled with `bg-surface`, `border-border`, `rounded-2xl`, and `p-6`.

### AC-4: Recent Activity Feed
- [ ] Verify Recent Activity card renders with title and subtle divider.
- [ ] Verify five chronological event rows:
  - Row 1: Purple double ring dot, `Found 8 jobs for Frontend Engineer`, timestamp `10 mins ago`.
  - Row 2: Blue double ring dot, `Researched Stripe`, timestamp `1 hour ago`.
  - Row 3: Green double ring dot, `Found 12 jobs for React Developer`, timestamp `2 hours ago`.
  - Row 4: Purple double ring dot, `Researched Vercel`, timestamp `Yesterday`.
  - Row 5: Green double ring dot, `Found 10 jobs for Full Stack Engineer`, timestamp `Yesterday`.
- [ ] Confirm connector timeline line aligns vertically through all dots.

### AC-5: Company Research Activity Chart
- [ ] Verify card title `Company Research Activity`.
- [ ] Verify horizontal dashed grid lines at 0, 3, 6, 9, 12.
- [ ] Verify daily labels Mon, Tue, Wed, Thu, Fri, Sat, Sun.
- [ ] Verify vertical bars in soft blue (`#61A8FF`) with rounded top edges.
- [ ] Confirm chart viewBox scales responsively with container width.

### AC-6: Jobs Found Over Time Chart
- [ ] Verify card title `Jobs Found Over Time`.
- [ ] Verify horizontal dashed grid lines at 0, 25, 50, 75, 100.
- [ ] Verify daily labels Mon, Tue, Wed, Thu, Fri, Sat, Sun.
- [ ] Verify smooth purple spline curve (`#7C5CFC`) spanning across data points.
- [ ] Verify subtle translucent purple gradient fill under the curve.

### AC-7: Match Score Distribution Chart
- [ ] Verify card title `Match Score Distribution`.
- [ ] Verify horizontal dashed grid lines at 0, 25, 50, 75, 100.
- [ ] Verify range labels: `50-60%`, `60-70%`, `70-80%`, `80-90%`, `90-100%`.
- [ ] Verify emerald green bars (`#10B981`) with rounded top edges.

### AC-8: Responsive Layout and Token Compliance
- [ ] Mobile Viewport (375px): Stat cards stack in 1 column; charts and timeline stack vertically in 1 column; no horizontal scroll.
- [ ] Tablet Viewport (768px): Stat cards arrange in 2 columns of 2; charts wrap cleanly.
- [ ] Desktop Viewport (1440px): Stat cards display in 4 column row; middle row shows Recent Activity and Company Research side by side; bottom row shows Jobs Found (wide) and Score Distribution side by side.
- [ ] Confirm zero hardcoded hex classes in components; all styles reference tokens from `app/globals.css`.

## Static Analysis and Compilation
- [ ] Run `npx tsc --noEmit` and confirm 0 errors.
- [ ] Run `npm run build` and confirm all pages compile cleanly.
