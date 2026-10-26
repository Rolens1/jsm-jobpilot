# 0009. Dashboard Page Full UI

**Date**: 2026-10-26  
**Status**: Proposed  

## Summary

This specification defines the architecture and user interface for the complete JobPilot Dashboard page. We build the complete visual interface using modular presentation components and realistic mock data before connecting real database queries or PostHog analytics. This approach ensures every stat card, activity row, and analytics chart is visually verified against the provided design mockup and design tokens before backend wiring begins.

## Requirements

**User stories**:
- As an active job seeker, I want to see an overview of my job search progress immediately upon logging in so that I know my search velocity and match rates.
- As an active job seeker, I want to inspect recent agent activities in a chronological feed so that I understand what jobs were found and which companies were researched.
- As an active job seeker, I want to view visual analytics charts for research cadence, discovery timeline, and score distribution so that I can evaluate where my profile performs best.
- As an active job seeker with an incomplete profile, I want a clear reminder banner at the top of the dashboard so that I can finish adding my resume and target roles.

**Acceptance criteria**:
- **AC-1**: Navigation bar on `/dashboard` highlights the Dashboard link with active purple styling and icon, displaying the authenticated candidate email.
- **AC-2**: When candidate profile has missing required fields (`is_complete: false`), the existing `ProfileAttentionBanner` component renders prominently above the stats grid.
- **AC-3**: Top stats grid displays four responsive stat cards matching `context/designs/dashboard.png`:
  - Card 1: `Total Jobs Found` with count `284` and `+12% vs last week` green trend badge.
  - Card 2: `Avg. Match Rate` with percentage `82%` and `+3% vs last week` green trend badge.
  - Card 3: `Companies Researched` with count `35` and `Total researched` subtitle.
  - Card 4: `Jobs This Week` with count `28` and `New this week` subtitle.
- **AC-4**: Recent Activity card renders a vertical timeline with five chronological activity rows, custom colored indicator dots (purple, blue, green), role or company names, and relative timestamps (`10 mins ago`, `1 hour ago`, `2 hours ago`, `Yesterday`).
- **AC-5**: Company Research Activity card renders a custom responsive SVG bar chart with horizontal dashed grid lines (0, 3, 6, 9, 12), daily bars for Monday through Sunday, and rounded bar tops in soft blue (`#61A8FF`).
- **AC-6**: Jobs Found Over Time card renders a wide responsive SVG area chart with dashed grid lines (0, 25, 50, 75, 100), a smooth cubic bezier purple curve (`#7C5CFC`), and a subtle translucent gradient fill beneath the curve.
- **AC-7**: Match Score Distribution card renders a responsive SVG bar chart with dashed grid lines (0, 25, 50, 75, 100), five percentage range buckets (`50-60%`, `60-70%`, `70-80%`, `80-90%`, `90-100%`), and emerald green bars (`#10B981`) with rounded tops.
- **AC-8**: All cards, charts, and text strictly adhere to project tokens in `app/globals.css` with zero raw Tailwind colors, zero hardcoded hex strings in component classes, and responsive stacking for mobile, tablet, and desktop viewports.

## Decision

**Chosen option**: Option 1: Modular component architecture with native SVG responsive charts and realistic mock simulation.

We build focused presentation components under `components/dashboard/` coordinated by a client container component and rendered within an authenticated Next.js 16 Server Component page. The charts are constructed using clean native SVG elements, avoiding external library bundle weight and React 19 peer dependency conflicts while achieving an exact visual match to `context/designs/dashboard.png`.

**Implementation skills**: Next.js 16 App Router conventions, Tailwind CSS v4 design tokens in `app/globals.css`.

## Rationale

Reasoning and options: see [rationale.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0009-dashboard-page-ui/rationale.md).

## Feature design

**Data model sketch**:

The mock data structures mirror the exact schema and event telemetry that will power Features 15, 16, and 17:

```typescript
export interface StatMetric {
  id: string;
  label: string;
  value: string | number;
  trend?: {
    value: string;
    label: string;
    direction: "up" | "down";
  };
  subtitle?: string;
}

export interface ActivityEvent {
  id: string;
  title: string;
  timestamp: string;
  type: "job_search" | "company_research";
  dotColor: "accent" | "info" | "success";
}

export interface DailyCountPoint {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  count: number;
}

export interface ScoreDistributionBucket {
  range: "50-60%" | "60-70%" | "70-80%" | "80-90%" | "90-100%";
  count: number;
}
```

**Component hierarchy**:

```text
app/dashboard/page.tsx (Server Component)
├── Navbar (activePath="/dashboard", userEmail)
└── main.max-w-[1440px]
    ├── ProfileAttentionBanner (rendered if profile.is_complete is false)
    └── DashboardContainer (Client Component)
        ├── StatsBar (grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6)
        │   └── StatCard (4 cards with trend pill or subtitle)
        ├── div (grid grid-cols-1 lg:grid-cols-12 gap-6)
        │   ├── RecentActivity (col-span-12 lg:col-span-5 or 6)
        │   └── CompanyResearchChart (col-span-12 lg:col-span-7 or 6, native SVG bars)
        └── div (grid grid-cols-1 lg:grid-cols-12 gap-6)
            ├── JobsFoundChart (col-span-12 lg:col-span-8, native SVG smooth area spline)
            └── MatchScoreDistributionChart (col-span-12 lg:col-span-4, native SVG bars)
```

**API surface**:

For Feature 14, the dashboard runs on mock data fixtures located in `lib/dashboard-mock-data.ts`. The Server Component loads the current user session from InsForge and passes user profile completion status into the layout.

| Endpoint or Action | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/dashboard` | GET | Session cookie | HTML page stream | Required (redirects to `/login`) | 307 redirect if unauthenticated |
| `getDashboardMockData()` | Function | None | Complete typed dashboard dataset | None | None |

**Value sourcing**:

| Action or Component | Value produced or displayed | Source |
|---|---|---|
| Card 1: Total Jobs Found | Count `284` and `+12% vs last week` | Mock fixture in `lib/dashboard-mock-data.ts` (future: `jobs` table count in Feature 15) |
| Card 2: Avg. Match Rate | Rate `82%` and `+3% vs last week` | Mock fixture in `lib/dashboard-mock-data.ts` (future: `jobs.match_score` average in Feature 15) |
| Card 3: Companies Researched | Count `35` and `Total researched` | Mock fixture in `lib/dashboard-mock-data.ts` (future: `jobs` count where `company_research` not null) |
| Card 4: Jobs This Week | Count `28` and `New this week` | Mock fixture in `lib/dashboard-mock-data.ts` (future: `jobs` count in last 7 days) |
| Activity Feed | 5 events with custom dots and timestamps | Mock fixture in `lib/dashboard-mock-data.ts` (future: merged `agent_runs` and `jobs` in Feature 16) |
| Research Chart | Daily research counts Mon through Sun | Mock fixture in `lib/dashboard-mock-data.ts` (future: PostHog `company_researched` events in Feature 17) |
| Discovery Chart | Daily jobs found curve Mon through Sun | Mock fixture in `lib/dashboard-mock-data.ts` (future: PostHog `job_found` events in Feature 17) |
| Score Chart | Distribution across 5 score buckets | Mock fixture in `lib/dashboard-mock-data.ts` (future: PostHog `job_found` matchScore in Feature 17) |
| Attention Banner | Completion percentage and missing tags | Loaded directly from InsForge `profiles` table in Server Component |

**Key invariants**:
- Design must match `context/designs/dashboard.png` pixel for pixel, including card paddings (`p-6`), borders (`border-border`), and typography.
- Never use raw Tailwind colors such as `bg-purple-500` or `text-gray-600`. All colors reference project tokens (`bg-surface`, `bg-accent`, `text-text-primary`, `border-border`).
- Native SVG charts must be self contained and responsive, rendering cleanly with viewBox scaling on all viewport widths without client hydration errors.
- Stat card trend badges must use `rounded-sm`, `bg-success-lightest` (`#ECFDF5`), and `text-success-darker` (`#009966`) matching `context/ui-tokens.md`.
- Activity dots must use double ring circles with 8px inner core and 16px outer soft halo matching token definitions.

**Security model**:
- The dashboard route `/dashboard` is protected by `middleware.ts`. Unauthenticated visitors are redirected to `/login?next=/dashboard`.
- Server Component verifies session via `createInsforgeServer()`.

**Configuration required**:
- Zero new environment variables or external credentials required.

**Critical test scenarios**:
- Happy path: Authenticated user visits `/dashboard` and sees all 4 stat cards, Recent Activity feed, and 3 analytics charts rendered cleanly, verifying **AC-1**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, and **AC-8**.
- Incomplete profile path: Candidate with missing required profile fields visits `/dashboard` and sees the `ProfileAttentionBanner` above the stats grid, verifying **AC-2**.
- Responsive layout path: User resizes viewport from 375px mobile to 1440px desktop; cards wrap into 1 column, 2 columns, and 4 columns without horizontal overflow, verifying **AC-8**.

## Build plan

1. Create typed mock dataset in `lib/dashboard-mock-data.ts` matching exact values from `context/designs/dashboard.png`, satisfies **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**.
2. Build `components/dashboard/StatsBar.tsx` rendering the 4 stat cards with trend badges, subtitles, and token styling, satisfies **AC-3**, **AC-8**.
3. Build `components/dashboard/RecentActivity.tsx` rendering the timeline feed with double ring colored dots, timestamps, and dividers, satisfies **AC-4**, **AC-8**.
4. Build `components/dashboard/CompanyResearchChart.tsx` rendering the responsive SVG daily bar chart with dashed grid lines and soft blue bars, satisfies **AC-5**, **AC-8**.
5. Build `components/dashboard/JobsFoundChart.tsx` rendering the responsive SVG smooth spline area chart with purple curve and gradient area fill, satisfies **AC-6**, **AC-8**.
6. Build `components/dashboard/MatchScoreDistributionChart.tsx` rendering the responsive SVG distribution bar chart with emerald green bars, satisfies **AC-7**, **AC-8**.
7. Build `components/dashboard/DashboardContainer.tsx` assembling all cards and charts into the responsive grid layout, satisfies **AC-8**.
8. Integrate into `app/dashboard/page.tsx` with user authentication check, Navbar, and conditional `ProfileAttentionBanner`, satisfies **AC-1**, **AC-2**, **AC-8**.
9. Verify visual alignment against `context/designs/dashboard.png` and confirm clean TypeScript compilation with zero errors, satisfies **AC-8**.

## Consequences

**Positive**:
- Full visual fidelity with `context/designs/dashboard.png` delivered and testable before complex backend aggregation.
- Zero npm dependencies added; native SVG charts avoid React 19 compatibility friction and keep bundle lightweight.
- Modular component structure allows Features 15, 16, and 17 to wire real data into individual components with zero layout disruption.
- Preserves candidate onboarding momentum by reusing the verified `ProfileAttentionBanner`.

**Negative / tradeoffs**:
- Mock data in Feature 14 requires separate integration phases (Features 15, 16, 17) to replace static numbers with live InsForge and PostHog metrics.
- Native SVG charts require explicit coordinate math for responsive axes and grid ticks instead of declarative chart component props.

**Neutral**:
- Replaces the temporary `DashboardPlaceholder` while retaining the `EventTrackingCard` underneath or migrating its events into real workflows.

## Follow-up

- [ ] Execute Feature 15 to wire the 4 stat cards to live InsForge PostgreSQL database count queries.
- [ ] Execute Feature 16 to wire Recent Activity feed to real `agent_runs` and `jobs.company_research` records.
- [ ] Execute Feature 17 to wire the 3 charts to PostHog event analytics.
