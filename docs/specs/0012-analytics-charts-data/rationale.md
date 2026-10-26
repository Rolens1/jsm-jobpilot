# 0012. Analytics Charts Real Data: Rationale and Alternatives

**Date**: 2026-10-26  
**Status**: Proposed  

## Context

Feature 14 delivered the visual presentation layer for the three dashboard analytics charts using mock datasets in `lib/dashboard-mock-data.ts`. Feature 17 connects these charts to live candidate data.

## Options Considered

### Option 1: Exclusive reliance on PostHog HogQL API (Rejected)

In this approach, the server queries the PostHog REST API for `job_found` and `company_researched` events.

*Why rejected*:
- PostHog HogQL query endpoints require a Personal API Key with query permissions (`phx_...`), which is distinct from the public project ingest token (`phc_...`) in `.env.local`.
- Relying exclusively on an external SaaS API for core dashboard charts creates an external point of failure and adds network latency to every dashboard load.
- Ingestion delay in cloud analytics can cause newly discovered jobs to lag behind database state.

### Option 2: Full replacement with heavy charting library (Recharts or Chart.js) (Rejected)

In this approach, native SVG charts are replaced with an external charting library.

*Why rejected*:
- Adds hundreds of kilobytes to client bundles.
- Causes peer dependency conflicts with React 19 and hydration mismatches during Next.js 16 Partial Prerendering.
- Our native SVG charts were refactored in Feature 14 and 15 to use semantic theme tokens and already match the exact layout in `dashboard.png`.

### Option 3: Server side database aggregation with native SVG rendering (Recommended)

In this approach, we compute chart datasets from the candidate authoritative database records in `jobs` and `agent_runs`. The computation reuses the records already queried in `app/dashboard/page.tsx` during server rendering, and passes the computed arrays into `DashboardContainer`.

*Why chosen*:
- Guarantees instant sub millisecond aggregation with zero extra database queries and zero external API dependencies.
- Synchronizes perfectly with the stats bar (Feature 15) and recent activity feed (Feature 16) since all three rely on the same authoritative records.
- Preserves our fast, responsive native SVG charts with zero client bundle bloat.
- Gracefully supports empty states for candidates with zero jobs.
