# 0012. Analytics Charts Real Data

**Date**: 2026-10-26  
**Status**: Accepted  

## Summary

This specification defines the architecture and implementation for Feature 17 (Analytics Charts Real Data). We connect the three native SVG analytics charts on the JobPilot dashboard to live candidate metrics. The charts visualize company research activity, job discovery volume over time, and match score distribution across five percentage tiers, with resilient empty state handling.

## Requirements

**User stories**:
- As an active job seeker, I want to see my daily company research activity over the current week so that I can maintain a steady interview preparation habit.
- As an active job seeker, I want to track jobs discovered across the days of the week so that I can observe search velocity.
- As an active job seeker, I want to see how my match scores distribute across ranges so that I know whether my target searches return strong or weak alignment.
- As a candidate with no activity yet, I want the charts to display clean zero state views and helpful prompts rather than blank cards or rendering errors.

**Acceptance criteria**:
- **AC-1**: `CompanyResearchChart` visualizes daily counts of researched companies across Monday through Sunday using candidate data from `jobs.company_research` and research agent runs.
- **AC-2**: `JobsFoundChart` visualizes daily job discovery counts across Monday through Sunday using candidate records from `jobs.found_at` and `jobs.created_at`.
- **AC-3**: `MatchScoreDistributionChart` buckets candidate jobs into five score ranges (`50-60%`, `60-70%`, `70-80%`, `80-90%`, `90-100%`) based on `jobs.match_score`.
- **AC-4**: Each chart dynamically scales its Y axis reference bounds to fit the highest data value while maintaining visual balance.
- **AC-5**: When candidate data has zero entries for a chart, an informative empty state indicator renders cleanly without division by zero, negative heights, or NaN path strings.
- **AC-6**: Aggregation logic executes server side during Next.js 16 Server Component rendering, streaming computed datasets to the client container.

## Decision

**Chosen option**: Server side analytics aggregation engine with dual PostHog / Database architecture.

We build `lib/dashboard-charts.ts` containing pure statistical transformation functions. When PostHog Personal API Key is configured, it can query PostHog analytics; by default, it computes authoritative aggregates directly from PostgreSQL `jobs` and `agent_runs`. The resulting `DailyCountPoint[]` and `ScoreDistributionBucket[]` arrays are passed to `DashboardContainer`.

**Implementation skills**: Next.js 16 App Router Server Components, SVG coordinate geometry, statistical data bucketing.

## Rationale

Reasoning and options: see [rationale.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0012-analytics-charts-data/rationale.md).

## Feature design

**Data model sketch**:

```typescript
export interface DailyCountPoint {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  count: number;
}

export interface ScoreDistributionBucket {
  range: "50-60%" | "60-70%" | "70-80%" | "80-90%" | "90-100%";
  count: number;
}

export interface DashboardChartsData {
  companyResearchActivity: DailyCountPoint[];
  jobsFoundTimeline: DailyCountPoint[];
  matchScoreDistribution: ScoreDistributionBucket[];
}
```

**Architecture & Component Hierarchy**:

```
app/dashboard/page.tsx (Server Component)
  │
  ├─► insforge.database queries (jobs, agent_runs)
  │
  ├─► calculateDashboardChartsData(jobs, agentRuns)  [lib/dashboard-charts.ts]
  │
  └─► <DashboardContainer initialChartsData={chartsData} />
        │
        ├─► <CompanyResearchChart data={chartsData.companyResearchActivity} />
        ├─► <JobsFoundChart data={chartsData.jobsFoundTimeline} />
        └─► <MatchScoreDistributionChart data={chartsData.matchScoreDistribution} />
```

## Security considerations

- All candidate data queries filter strictly on `user_id = user.id`.
- Aggregates are computed server side; no unauthenticated client can read another candidate search history or match rates.
- No dynamic code evaluation or unsafe HTML injection.

## Performance considerations

- Reuses the existing `jobs` and `agent_runs` result sets already retrieved in `app/dashboard/page.tsx` with zero extra database round trips.
- Daily grouping and bucket counting take less than one millisecond for typical candidate datasets.
- Native SVG rendering keeps the browser DOM lightweight with zero charting library overhead.
