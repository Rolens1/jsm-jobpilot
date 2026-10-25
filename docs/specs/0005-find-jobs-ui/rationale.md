# 0005. Find Jobs Page Full UI (Rationale)

## Context

JobPilot is an intelligent job discovery and matching assistant. After establishing candidate profile data and generating tailored resumes in Phase 2, users need a central interface to search for active roles, evaluate match compatibility scores, and filter positions before viewing detailed company dossiers.

The design mockup in `context/designs/find-jobs.png` specifies a two section layout consisting of a top search controls card with an optional green search results summary banner, and a lower table section with real time text filtering, match score threshold tabs, sorting options, and paginated row entries.

In line with the project core principle in `context/build-plan.md`, full page user interfaces must be built and verified with realistic mock data first before wiring asynchronous background agents or external job discovery APIs. Attempting to build live search and filtering simultaneously creates testing friction, delays visual sign off, and risks exhausting external API quotas during iterative user interface polish.

## Options considered

### Option 1: Modular component architecture with interactive mock data simulation

Decompose the page into separate reusable client components for search controls, filter controls, the jobs table, and pagination, orchestrated by a client container component and populated with twenty four realistic mock job records.

**Pros**:
- Matches existing modular component patterns established in Phase 2 on the profile page.
- Enables complete visual and interactive verification of every state including active searches, loading pulses, score color coding, filter tabs, and page switching.
- Provides clean component boundaries that plug directly into Server Actions and database hooks in Features 10 and 11 without markup changes.

**Cons**:
- Requires creating a rich mock dataset with varied scores, dates, and salary figures.

### Option 2: Single monolithic client component with static mock data

Implement the entire page layout within one single file under `app/find-jobs/page.tsx` displaying a fixed set of six table rows without interactive filtering or simulated search.

**Pros**:
- Quick initial file creation with zero prop passing between files.

**Cons**:
- Creates an unwieldy component that violates project single responsibility standards.
- Leaves filtering, sorting, and pagination completely unverified until backend integration in Feature 11.
- Requires major structural refactoring when real API endpoints are introduced.

### Option 3: Backend first implementation combining UI and Adzuna API calls

Skip the mock user interface phase and build the Adzuna API integration, database schema queries, and user interface together in one combined step.

**Pros**:
- Skips generating temporary mock datasets.

**Cons**:
- Violates the foundational project principle of full page user interface first visual verification.
- Makes diagnosing styling or responsive issues slower due to external network latency and API rate limits.
- Increases failure blast radius when third party services experience unexpected downtime.

## Rationale

We chose Option 1 because it directly upholds the project design standard while maintaining high engineering modularity. Building isolated components for search controls, filter toolbars, table listings, and pagination allows each piece to be verified against the design mockup in `context/designs/find-jobs.png` and token constraints in `app/globals.css`.

Seeding twenty four diverse mock records lets you test sorting from highest to lowest match score, filtering by text or score threshold, and paginating across four pages of six items each. When Feature 10 introduces live Adzuna queries and Feature 11 connects InsForge database queries, the container component simply swaps the mock dataset for live Server Action data without needing any modifications to the underlying presentation components.
