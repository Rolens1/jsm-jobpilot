# 0010. Stats Bar Real Data: Rationale and Alternatives

**Date**: 2026-10-26  
**Status**: Proposed  

## Context

Feature 14 delivered the visual presentation layer for the dashboard, using realistic mock statistics (`284` total jobs, `82%` average match, `35` researched companies, `28` jobs this week). Feature 15 requires connecting these four metric cards to live candidate data from the InsForge PostgreSQL database.

## Options Considered

### Option 1: Client side database fetching in StatsBar (Rejected)

In this approach, the client component `StatsBar` calls `createInsforgeClient()` inside a `useEffect` hook on mount, runs queries against the jobs table, and manages local loading and error state.

*Why rejected*:
- Introduces an unnecessary loading spinner or layout shift on the top cards after page load.
- Causes client side waterfall: page loads, client bundle parses, then client queries database.
- Bypasses Next.js 16 Server Component streaming and Partial Prerendering benefits.

### Option 2: Database SQL aggregate functions via RPC or raw query (Rejected)

In this approach, we execute raw aggregate queries like `SELECT count(*), avg(match_score) FROM jobs WHERE user_id = $1`.

*Why rejected*:
- PostgREST REST endpoints on InsForge BaaS work best with standard table resource queries.
- Computing trend windows (jobs in past 7 days versus prior 7 days) requires multi window SQL queries or custom database functions that increase schema complexity.
- Candidates typically have dozens or hundreds of discovered jobs, meaning fetching lightweight column projections (`id, match_score, company_research, found_at, created_at`) is very fast and straightforward.

### Option 3: Server Component query with dedicated TypeScript analytics helper (Recommended)

In this approach, `app/dashboard/page.tsx` queries the candidate jobs with lightweight column selection during server rendering, and passes the records into a pure, testable function `calculateDashboardStats(jobs)`.

*Why chosen*:
- Delivers instant initial render with zero client side waterfalls and zero layout shifts.
- The computation logic remains pure TypeScript in `lib/dashboard-stats.ts`, making it easy to unit test and verify.
- Handles edge cases cleanly: zero jobs, single week jobs, and multi week trends.
- Keeps client components lightweight while allowing future features (such as Feature 16 and 17) to reuse the same data structure.
