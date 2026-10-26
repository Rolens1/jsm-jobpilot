# 0009. Dashboard Page Full UI: Architectural Rationale

**Date**: 2026-10-26  
**Status**: Proposed  

## Context

The dashboard is the central cockpit of the JobPilot application. After completing initial onboarding, every authenticated user lands on `/dashboard`. The page communicates value instantly by presenting four essential performance indicators: total jobs discovered, average match percentage against the candidate profile, number of target companies researched, and velocity of jobs found during the current week.

Beyond summary metrics, candidates need visibility into ongoing background tasks and historical agent executions. The Recent Activity timeline provides reassurance that the system is actively working on their behalf. Visual analytics charts for research cadence, discovery trends, and match score distribution convert raw application logs into strategic intelligence, helping job seekers refine their titles, locations, and skills.

Phase 5 of the project roadmap specifies a UI first delivery strategy. Implementing the full dashboard visual layer with realistic mock fixtures before connecting database aggregation queries and PostHog telemetry prevents layout thrashing, guarantees that every visual token is verified against design mockups, and establishes clean component boundaries.

## Options considered

### Option 1: Modular component architecture with native SVG charts (Recommended)

Build five distinct presentation components (`StatsBar`, `RecentActivity`, `CompanyResearchChart`, `JobsFoundChart`, `MatchScoreDistributionChart`) coordinated by a client container component. Render all charts as custom responsive SVG components using inline vector math.

**Pros**:
- Zero additional npm dependencies and zero bundle bloat.
- Eliminates React 19 and Next.js 16 peer dependency conflicts commonly seen with third party chart libraries.
- Exact visual matching with `context/designs/dashboard.png`, including custom dashed grid lines, smooth spline curves, and rounded bar caps.
- Fast initial server rendering with zero client hydration mismatch.

**Cons**:
- Requires custom SVG path geometry and coordinate scaling calculations rather than declarative component props.

### Option 2: Recharts charting library integration

Install `recharts` into `package.json` and use pre built `<BarChart>`, `<LineChart>`, `<AreaChart>`, and `<ResponsiveContainer>` wrappers.

**Pros**:
- Built in tooltip interactions, animations, and declarative axis configuration.
- Familiar API for React developers.

**Cons**:
- Adds significant client bundle size (over 100kB minified).
- Frequent peer dependency warnings and hydration friction when used with React 19 and Next.js 16 App Router.
- Harder to customize dashed grid styling and curve aesthetics to match `context/designs/dashboard.png` pixel for pixel.

### Option 3: Monolithic single file dashboard page

Implement all stat cards, timeline rows, and charts directly inside `app/dashboard/page.tsx` without modular component decomposition.

**Pros**:
- Minimal initial file count during Phase 5 scaffolding.

**Cons**:
- Severely hinders future phases (Features 15, 16, 17) where separate database and analytics queries must be wired into independent subcomponents.
- Breaches project modularity standards and makes visual regression testing difficult.

## Rationale

Option 1 is selected because it strictly aligns with the project philosophy: clean, lightweight, resilient, and visually faithful to `context/designs/dashboard.png`. 

In React 19 and Next.js 16 environments, heavy charting packages frequently cause hydration warnings or require forced legacy peer dependency overrides. Creating dedicated SVG chart components using standard SVG `<path>`, `<rect>`, `<line>`, and `<linearGradient>` elements gives complete control over colors, stroke widths, and responsive viewBox scaling. Each component directly consumes the design tokens defined in `app/globals.css`, ensuring seamless consistency across light and dark surfaces without runtime overhead.

Decomposing the dashboard into modular cards guarantees that subsequent build phases can proceed cleanly: Feature 15 will wire `StatsBar`, Feature 16 will wire `RecentActivity`, and Feature 17 will wire the three chart components to PostHog, all without touching adjacent component code.
