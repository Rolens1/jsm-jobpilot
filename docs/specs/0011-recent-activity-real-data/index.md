# 0011. Recent Activity Real Data

**Date**: 2026-10-26  
**Status**: Accepted  

## Summary

This specification defines the architecture and implementation for Feature 16 (Recent Activity Real Data). We connect the Recent Activity card on the JobPilot dashboard to live database events collected from job discovery agent runs and company intelligence dossiers. The timeline displays chronological activity rows with colored indicator dots, clear action summaries, and human readable relative timestamps.

## Requirements

**User stories**:
- As an active job seeker, I want to see a unified activity log on my dashboard so that I can easily recall what searches I have conducted and what companies I have researched.
- As an active job seeker, I want activity events to show clear relative timestamps like ten minutes ago or yesterday so that I understand recency at a glance.
- As an active job seeker with no activity yet, I want to see an inviting empty state with advice on how to start discovering jobs.

**Acceptance criteria**:
- **AC-1**: Recent Activity card queries `agent_runs` and `jobs` where `company_research` is populated for the authenticated candidate.
- **AC-2**: Completed job searches are formatted into readable summaries like `Found X jobs for [Title]` or `Searched for [Title]`.
- **AC-3**: Completed company research actions are formatted into readable summaries like `Researched [Company]`.
- **AC-4**: All activity events are merged, deduplicated, and ordered by timestamp descending, showing up to five most recent entries.
- **AC-5**: Each timeline row renders a double ring colored dot reflecting the event type, with purple or green for job discovery and blue for company research.
- **AC-6**: Relative timestamps use clean human language such as `Just now`, `X minutes ago`, `X hours ago`, or `Yesterday`.
- **AC-7**: When a candidate has zero activity events, an empty state is rendered with an encouraging prompt to search for jobs.
- **AC-8**: All data aggregation executes server side during Next.js 16 Server Component rendering, streaming data into the client container with zero client network waterfalls.

## Decision

**Chosen option**: Server side event merging and deduplication with pure TypeScript formatter.

We query `agent_runs` and candidate jobs in parallel within `app/dashboard/page.tsx` using `createInsforgeServer()`. A dedicated transformation module `lib/dashboard-activity.ts` merges the events, removes duplicates between research agent runs and job dossiers, calculates relative timestamps via `lib/date-utils.ts`, and produces typed `ActivityEvent[]` passed into `DashboardContainer`.

**Implementation skills**: Next.js 16 App Router Server Components, InsForge PostgreSQL database client.

## Rationale

Reasoning and options: see [rationale.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0011-recent-activity-real-data/rationale.md).

## Feature design

**Data model sketch**:

```typescript
export interface ActivityEvent {
  id: string;
  title: string;
  timestamp: string;
  type: "job_search" | "company_research";
  dotColor: "accent" | "info" | "success";
}

export interface AgentRunRecord {
  id: string;
  job_title_searched: string;
  location_searched?: string | null;
  jobs_found: number;
  status: string;
  started_at: string;
  completed_at?: string | null;
}
```

**Architecture & Component Hierarchy**:

```
app/dashboard/page.tsx (Server Component)
  │
  ├─► insforge.database.from("agent_runs").select(...)
  ├─► insforge.database.from("jobs").select(...)
  │
  ├─► formatRecentActivities(agentRuns, jobs)  [lib/dashboard-activity.ts]
  │
  └─► <DashboardContainer initialActivity={activities} />
        │
        └─► <RecentActivity activities={initialActivity ?? initialData.recentActivity} />
```

## Security considerations

- All database queries filter strictly on `user_id = user.id`.
- Company and job title strings are sanitized and rendered through React JSX escaping, preventing XSS.
- Activity data is read only on the dashboard and contains no sensitive credentials or keys.

## Performance considerations

- Queries run in parallel using `Promise.all` alongside profile and stats queries.
- `agent_runs` query uses `LIMIT 10` to keep payload size tiny.
- Deduplication and sorting run in sub-millisecond execution time in memory.
