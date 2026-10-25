# Rationale: Multi Provider Job Discovery Agent

## Context

Feature 10 in JobPilot is responsible for finding job vacancies matching candidate search criteria, scoring them against the user profile using GPT-4o, and saving the results to the database. The initial plan relied solely on Adzuna. However, Adzuna now enforces paid tiers and limits free developer access to 25 lifetime trial calls.

The candidate is located near Montreal, Canada. Real time job discovery in this market requires comprehensive coverage of Montreal tech positions across LinkedIn Canada, Indeed Canada, Glassdoor, and local corporate career portals. In addition, users need an economical solution where personal usage and friend group sharing do not exhaust free API limits.

## Options considered

### Option 1: Adzuna as Sole Provider

Query Adzuna directly for all search actions.

* **Pros**: Simple single provider implementation with an existing API key.
* **Cons**: Restricted to 25 lifetime requests on free tier. Descriptions are short snippets rather than full text. Quota is exhausted in a single day of active testing.

### Option 2: JSearch Only without Fallbacks or Caching

Replace Adzuna with JSearch on RapidAPI exclusively.

* **Pros**: Outstanding data quality with full job descriptions, employer logos, and direct apply links. 200 free recurring requests per month.
* **Cons**: If a user runs out of monthly credits or encounters an unexpected rate limit, the search feature fails completely. Querying the API repeatedly for the same search terms burns credits unnecessarily.

### Option 3: Cascading Multi Provider with Shared Pool, Same Search Guard, and On Demand Pagination (Recommended)

Use JSearch as the primary provider for rich data, with automated fallback to Jooble (500 trial requests) and Adzuna (25 trial requests) when errors or quota limits occur. Check existing database records before executing external searches, skip external queries when search terms remain unchanged, and fetch subsequent pages only when the user explicitly requests more results.

* **Pros**: Maximum resilience and data quality. The 200 recurring monthly JSearch requests stretch far because identical searches do not trigger duplicate external requests. The user experience remains uninterrupted even if a provider quota is exhausted.
* **Cons**: Slightly more complex orchestrator code in `lib/job-search/` to coordinate multiple provider clients and normalize their respective payloads.

## Rationale

Option 3 provides the best balance of data quality, resilience, and quota conservation:

1. **AI Match Precision**: JSearch provides the full job description. When GPT-4o analyzes complete role requirements rather than a 50 word snippet, match scores and skill gap analyses are significantly more accurate.
2. **Zero Wasted Credits**: By checking the database first and ignoring repeat clicks on unchanged search inputs, no credits are wasted on accidental double clicks or duplicate queries.
3. **Graceful Degradation**: If JSearch reaches its 200 monthly limit, the application transitions smoothly to Jooble and Adzuna without presenting error messages to the user.
4. **On Demand Exploration**: Loading 10 jobs initially keeps the interface fast and responsive. Users who need more options can click "Load 10 More from Web" to fetch page two on demand.

## References

* OpenWeb Ninja JSearch API Documentation (RapidAPI GET `/search` endpoint, `num_pages` parameter, `cursor` pagination)
* Jooble Developer API Documentation (POST JSON endpoint at `https://jooble.org/api/` with `keywords`, `location`, `ResultOnPage`)
* Adzuna API Documentation (GET `/v1/api/jobs/ca/search/1`)
* InsForge Database Schema Documentation ([0001-database-schema.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0001-database-schema.md))
