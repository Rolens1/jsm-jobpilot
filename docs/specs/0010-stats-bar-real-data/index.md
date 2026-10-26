# 0010. Stats Bar Real Data

**Date**: 2026-10-26  
**Status**: Accepted  

## Summary

This specification defines the architecture and implementation for Feature 15 (Stats Bar Real Data). We connect the four key performance metric cards on the JobPilot dashboard to live PostgreSQL data queried through the InsForge database client. The stats bar accurately reflects the authenticated candidate job search velocity, match quality, and company intelligence depth.

## Requirements

**User stories**:
- As an active job seeker, I want to see the exact count of jobs found for my profile so that I know my search pipeline volume.
- As an active job seeker, I want to know my average match score across all discovered jobs so that I can assess whether my target criteria align with available roles.
- As an active job seeker, I want to track how many employer dossiers I have researched so that I know how prepared I am for applications and interviews.
- As an active job seeker, I want to see how many new jobs were discovered during the past seven days so that I understand my search momentum this week.

**Acceptance criteria**:
- **AC-1**: Card 1 displays `Total Jobs Found` with the exact integer count of jobs where `user_id` matches the authenticated user.
- **AC-2**: Card 1 displays a trend badge when historical jobs exist, showing percentage difference between jobs found in the last seven days versus the preceding seven days, or a clear count indicator if prior data is absent.
- **AC-3**: Card 2 displays `Avg. Match Rate` calculated as the arithmetic mean of `match_score` across all candidate jobs, formatted as a clean percentage. When no jobs exist, it displays `0%` with a helpful empty subtitle.
- **AC-4**: Card 3 displays `Companies Researched` counting all candidate jobs where `company_research` is not null, with subtitle `Total researched`.
- **AC-5**: Card 4 displays `Jobs This Week` counting candidate jobs found within the last seven days, with subtitle `New this week`.
- **AC-6**: Empty state is gracefully handled for newly registered users with zero jobs, rendering zeros without division by zero, NaN values, or layout crashes.
- **AC-7**: All metric computations happen server side in the Next.js 16 App Router Server Component, passing typed metric objects to client components with zero extra network waterfalls.

## Decision

**Chosen option**: Server side aggregation with pure TypeScript statistical calculation helper.

We fetch the candidate jobs in `app/dashboard/page.tsx` using `insforge.database.from("jobs")` with selected columns (`id, match_score, company_research, found_at, created_at`). A dedicated utility function `calculateDashboardStats` in `lib/dashboard-stats.ts` processes the records, calculates weekly velocity and score averages, and returns typed `StatMetric[]` array passed into `DashboardContainer`.

**Implementation skills**: Next.js 16 App Router Server Components, InsForge PostgreSQL queries.

## Rationale

Reasoning and options: see [rationale.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0010-stats-bar-real-data/rationale.md).

## Feature design

**Data model sketch**:

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

export interface JobStatRecord {
  id: string;
  match_score: number | null;
  company_research: unknown | null;
  found_at: string | null;
  created_at: string;
}
```

**Architecture & Component Hierarchy**:

```
app/dashboard/page.tsx (Server Component)
  │
  ├─► insforge.database.from("jobs").select(...)
  │
  ├─► calculateDashboardStats(jobs)  [lib/dashboard-stats.ts]
  │
  └─► <DashboardContainer initialStats={stats} />
        │
        └─► <StatsBar metrics={initialStats ?? initialData.stats} />
```

## Security considerations

- Row level security enforces that candidates query only their own records via `user.id`.
- Server side computation guarantees no client manipulation of match rates or job counts.
- Database query selects only required scalar columns rather than large text or jsonb payloads, preserving memory and network bandwidth.

## Performance considerations

- Query runs concurrently with profile completeness query using Promise.all or sequential awaiting in the existing Server Component.
- Lightweight column selection (`id, match_score, company_research, found_at, created_at`) keeps memory footprint under a few kilobytes even for hundreds of jobs.
- Pure function computation takes sub-millisecond execution time.
