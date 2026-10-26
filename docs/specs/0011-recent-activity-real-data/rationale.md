# 0011. Recent Activity Real Data: Rationale and Alternatives

**Date**: 2026-10-26  
**Status**: Proposed  

## Context

Feature 14 delivered the visual Recent Activity card using mock events (`Found 8 jobs for Frontend Engineer`, `Researched Stripe`, `Found 12 jobs for React Developer`, `Researched Vercel`). Feature 16 connects this component to live candidate actions recorded in the InsForge PostgreSQL database across `agent_runs` and `jobs.company_research`.

## Options Considered

### Option 1: Query only agent_runs table (Rejected)

In this approach, the recent activity timeline only inspects `agent_runs`.

*Why rejected*:
- In early versions of the app or when research was performed without creating an agent run, those company dossiers would be completely absent from the feed.
- It provides no deep connection to candidate job details or company research cards.

### Option 2: Database unified activity view or SQL UNION query (Rejected)

In this approach, a database view or custom RPC function unions `agent_runs` and `jobs` into a shared event table.

*Why rejected*:
- Requires modifying the database schema and adding server side migrations.
- The InsForge JavaScript SDK already provides fast parallel querying with PostgREST.
- Formatting relative dates and string summaries in TypeScript is simpler, safer, and much easier to localize than writing procedural SQL strings.

### Option 3: Parallel server query with in memory deduplication and transformation (Recommended)

In this approach, `app/dashboard/page.tsx` queries `agent_runs` and candidate jobs in parallel using `Promise.all`. The transformation function `formatRecentActivities` merges both sources, strips `"Research: "` prefixes, deduplicates co-occurring events within short time windows, and sorts by event recency.

*Why chosen*:
- Reuses the existing `jobs` query from Feature 15 with zero additional database calls for jobs.
- Delivers clean event deduplication so candidates never see duplicate research rows.
- Formats dates into human friendly relative strings using our established `lib/date-utils.ts`.
- Streams pre-rendered HTML to the browser with zero client side waterfalls.
