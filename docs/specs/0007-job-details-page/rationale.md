# 0007. Job Details Page Full UI Decision Record

## Context

Candidates browsing job opportunities on JobPilot need to evaluate discovered roles in depth before applying. While the Find Jobs table provides high level summary cards with company names, match scores, and salary estimates, deciding whether to apply requires comprehensive role inspection. Candidates need to read the full job description, understand specific responsibilities, evaluate matched skills versus missing qualifications, and review company intelligence.

In Phase 3, we built the multi provider job search engine (Spec 0006) and connected live InsForge PostgreSQL database results with filtering, sorting, and pagination (Feature 11). Discovered jobs are stored in the database with evaluated match scores, matched skills, missing skills, and detailed role descriptions.

The initial route at `/find-jobs/[id]` was created as a lightweight placeholder during Feature 09, rendering only basic mock fixtures. Feature 12 requires transforming this route into a production grade, modular interface that reads real job records from the database while maintaining development reliability and setting the stage for the Feature 13 company research agent.

## Options considered

### Option 1: Modular Server Component architecture with database priority prefetching and sticky apply bar

The route handler runs as a Next.js Server Component that checks user authentication, queries the InsForge database by job ID and user ID, and falls back to mock fixtures if the ID corresponds to a development seed. The user interface is split into clean, modular subcomponents under `components/find-jobs/details/` covering the header card, quick metrics grid, AI match breakdown, full job description, company research preview card, and a sticky floating bottom apply bar.

**Pros**:
- Preloads data on the server with zero client waterfall or layout shift.
- Preserves clean file size limits by isolating each section into its own component.
- The sticky bottom bar ensures the candidate never loses access to the apply link while reading deep role descriptions.
- Graceful mock fallback prevents broken routes when developing with seed data.

**Cons**:
- Slightly more component files to manage compared to an inline monolithic page.

### Option 2: Monolithic Server Component page rendering all sections inline

All layout logic, metric cards, skill pills, and company research placeholders reside inside a single `app/find-jobs/[id]/page.tsx` file.

**Pros**:
- Single file implementation with no subfolder dependencies.

**Cons**:
- The file quickly exceeds 350 lines, making maintenance, review, and testing difficult.
- Tightly couples presentation markup with server data fetching and layout structure.

### Option 3: Client Component container with client side fetching

A client component container that fetches job data via an API endpoint upon mounting, displaying skeleton loaders during the request.

**Pros**:
- Familiar client side state management.

**Cons**:
- Introduces an unnecessary client network waterfall.
- Degrades initial page load performance and SEO metadata generation.
- Increases complexity by requiring an additional API route for simple reads.

## Rationale

We selected Option 1. Next.js 16 Server Components are designed for authenticated data prefetching, allowing the page to load with zero client fetch delays and generate accurate dynamic metadata. 

Decomposing the page into dedicated presentation subcomponents follows our established project standards from the Profile and Find Jobs pages. Keeping components focused ensures that when Feature 13 introduces live company research streaming or interactive dossiers, the `CompanyResearchCard` can be modified in isolation without touching the core job details layout.

Furthermore, job descriptions for modern engineering roles are frequently several pages long. Incorporating a sticky floating bottom apply bar guarantees that the candidate can trigger the primary call to action at any point in their evaluation without scrolling back to the top.
