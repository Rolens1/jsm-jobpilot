# 0008. Company Research Agent

**Date**: 2026-10-25
**Status**: Proposed

## Summary

This specification establishes the architecture, data extraction pipeline, AI synthesis, and interactive interface for the Company Research Agent in JobPilot. Located on the Job Details page at `/find-jobs/[id]`, the agent autonomously investigates an employer by fusing three rich data sources: public company website content, detailed job posting requirements from the database, and the candidate profile. The resulting intelligence dossier equips the job seeker with actionable interview talking points, an honest assessment of their unique edge, a constructive strategy for addressing skill gaps, verified technical stack insights, and incisive questions to ask hiring managers.

## Requirements

**User stories**:
- As a candidate, I want to trigger autonomous company research on any discovered job so that I do not spend hours manually scouring corporate homepages, engineering blogs, and career portals.
- As a candidate, I want an intelligence briefing tailored specifically to my background, connecting my actual projects and skills to the company needs rather than receiving generic interview advice.
- As a candidate, I want to understand how to frame my missing skills constructively as learning strategies so that I feel confident addressing potential gaps during interviews.
- As a candidate, I want ready to use talking points and insightful questions derived from real company initiatives so that interviewers recognize that I did deep homework.
- As a candidate, I want the research dossier saved directly to the job listing so that I can review it anytime without having to re-run research.

**Acceptance criteria**:
- **AC-1**: Endpoint `POST /api/agent/research` accepts `{ jobId }`, validates candidate session authentication via InsForge, and loads the target job and candidate profile from the database.
- **AC-2**: Domain derivation engine follows HTTP redirects on `external_apply_url` or `source_url` using server fetch to extract the genuine employer root domain, stripping job board prefixes and subdomains, or falls back to the clean company name domain (`https://www.{company}.com`).
- **AC-3**: Public web extraction gathers company footprint content across the homepage and key internal pages (About, Culture, Engineering, Product). If public web extraction is blocked or yields minimal text, the engine automatically falls back to synthesizing the dossier from the job description and candidate profile without failing silently.
- **AC-4**: AI synthesis invokes the configured LLM client (`lib/ai.ts`) using the career strategist system prompt, outputting a strictly valid JSON dossier with all 9 required fields: `companyOverview`, `techStack`, `culture`, `whyThisRole`, `yourEdge`, `gapsToAddress`, `smartQuestions`, `interviewPrep`, and `sources`.
- **AC-5**: Dossier is persisted to the `jobs` table in the `company_research` JSONB column for the target job ID, an `agent_runs` record is created, and an `agent_logs` entry is recorded with log level `success`.
- **AC-6**: Route handler tracks the PostHog server event `company_researched` with properties `userId`, `jobId`, and `company`.
- **AC-7**: The `CompanyResearchCard` on `/find-jobs/[id]` renders an empty state with a "Research Company" action button when no dossier exists, transitions to an animated progress indicator while research runs, and presents the full 9-field dossier once complete.
- **AC-8**: When a dossier is present, `CompanyResearchCard` renders structured sections with semantic design tokens, clean typography, badge pills for tech stack, highlighted callouts for candidate edge, and an optional refresh button to trigger an updated analysis.

## Decision

**Chosen option**: Resilient Multi Tier Web Extraction with Grounded Career Strategist LLM Synthesis and Persistent JSONB Storage.

We build a specialized research engine in `lib/agent/research.ts` coordinated by `POST /api/agent/research`. Web extraction uses native redirect resolution and public page parsing (with Browserbase or public reader fallbacks), feeding extracted facts alongside database role data and candidate profile into our LLM pipeline. The resulting 9-field dossier is saved directly into `jobs.company_research` and rendered by an interactive `CompanyResearchCard` component.

**Implementation skills**: Next.js 16 App Router route handlers, `@insforge/sdk/ssr` database queries and updates, OpenAI / Groq / Gemini via `lib/ai.ts`, PostHog telemetry, and Tailwind CSS design tokens.

## Rationale

Reasoning and options: see [rationale.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0008-company-research-agent/rationale.md).

## Feature design

**Data contract (CompanyResearchDossier)**:
The dossier stored in `jobs.company_research` matches the following JSON structure:

```typescript
export interface CompanyResearchDossier {
  companyOverview: string;
  techStack: string[];
  culture: string[];
  whyThisRole: string;
  yourEdge: string[];
  gapsToAddress: string[];
  smartQuestions: string[];
  interviewPrep: string[];
  sources: string[];
  extractedAt?: string;
}
```

**System Prompt Rules**:
The synthesis prompt enforces strict career coaching rules:
1. Ground every company claim in the provided web research or job posting. Never invent funding, customers, headcount, or facts.
2. Be specific to THIS candidate. Connect their actual skills and past work experience to this company stack, product, and mission.
3. Turn candidate missing skills into proactive learning strategies: frame the gap honestly and highlight adjacent transferable experience.
4. Provide talking points and questions referencing real details from the research.
5. Keep each bullet point tight (one or two sentences, no fluff).

**UI Sections in CompanyResearchCard**:
1. **Overview & Strategic Fit**: Company overview narrative and "Why This Role" strategic rationale.
2. **Your Edge & Gap Strategy**: Highlighted green callouts for candidate edge and constructive warning callouts for turning missing skills into interview strategies.
3. **Tech Stack & Culture Footprint**: Interactive tech badges and culture bullet points.
4. **Interview Talking Points & Smart Questions**: Actionable interview preparation tips and incisive questions to ask hiring leaders.
5. **Sources & Metadata**: Public domains consulted and extraction timestamp with refresh button.

## Build plan

1. Create `lib/agent/research.ts`:
   - Domain derivation from redirect URLs and company names.
   - Web extraction engine with clean text parsing and fallback guards.
   - LLM synthesis pipeline feeding web facts, job posting, and candidate profile.
   - Dossier validation and default filling.
2. Create `app/api/agent/research/route.ts`:
   - Session authentication check.
   - Job and profile retrieval from InsForge PostgreSQL.
   - Execution of research pipeline.
   - Update `jobs.company_research`, insert into `agent_runs` and `agent_logs`.
   - PostHog telemetry event `company_researched`.
3. Update `components/find-jobs/details/CompanyResearchCard.tsx`:
   - Live research invocation via `fetch("/api/agent/research")`.
   - Loading state with step animation and progress text.
   - Full 9-field dossier presentation using semantic design tokens.
   - Seamless toggle between empty state, loading state, and dossier state.
4. Verification:
   - TypeScript compilation check (`npx tsc --noEmit`).
   - Route verification with sample job ID.
   - Visual and manual verification checklist in `verify.md`.

## Consequences

- Candidates gain an immediate unfair advantage in job applications with tailored interview intelligence.
- Database records are enriched permanently, avoiding repeated external network calls when revisiting previously researched jobs.
- The system remains completely resilient: even if a company firewall blocks automated web fetches, candidate specific dossiers are still synthesized from job description and profile data.

## Follow-up

- In Phase 5 (Feature 14 and 15), dashboard statistics will track total companies researched and display active research trends.
- Future enhancements can add deeper Glassdoor or Crunchbase integrations when dedicated API keys become available.
