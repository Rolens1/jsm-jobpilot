# 0016. Vercel Deployment Architecture, CI/CD Pipeline and Live Release

**Date**: 2026-10-26  
**Status**: In Progress  

## Summary

This specification defines the production release architecture and continuous deployment workflow for Feature 23. We establish the serverless execution configuration in `vercel.json` (allocating 60 second execution windows and 1024MB memory for multi provider search and company research agents), link the GitHub repository to Vercel, synchronize production environment secrets from `.env.example`, confirm InsForge production OAuth and CORS whitelisting, execute pre-flight verification gates, and trigger the live deployment release.

## Requirements

**User stories**:
- As a candidate and recruiter visiting JobPilot, I want a fast, resilient live website deployed on Vercel high performance edge and serverless infrastructure with high availability.
- As an engineering team maintainer, I want automated continuous integration and continuous deployment on every git push so updates deploy to preview and production automatically.
- As an AI agent executor, I want serverless function timeouts configured to 60 seconds so long running job discovery cascades and deep web research agents complete reliably without 504 gateway timeout errors.
- As a site reliability engineer, I want pre-flight validation gates ensuring broken TypeScript code or failing production builds never deploy to production.

**Acceptance criteria**:
- **AC-1**: `vercel.json` configures function memory (1024MB) and extended `maxDuration` (60s for `/api/agent/find` and `/api/agent/research`, 30s for `/api/resume`) preventing gateway timeouts on multi provider scraping and LLM synthesis.
- **AC-2**: The GitHub repository `Rolens1/jsm-jobpilot` is connected to Vercel with automated deployment triggers on git push to `master` and pull requests.
- **AC-3**: Production environment variables are mapped and synchronized to Vercel production and preview scopes, matching the 16 documented keys across all 7 functional domains from `.env.example`.
- **AC-4**: InsForge BaaS production CORS allowed origins (`https://*.vercel.app` and custom domain) and OAuth redirect URI (`https://*.vercel.app/callback`) are documented and active.
- **AC-5**: Pre-flight verification gates (`npx tsc --noEmit` and `npm run build`) execute cleanly with zero errors before triggering live production deployment.
- **AC-6**: Vercel deployment builds successfully under Next.js 16 Turbopack with Partial Prerendering and Cache Components enabled.
- **AC-7**: Post deployment live smoke testing verifies end to end functionality on the live URL: authentication, PostgreSQL queries, multi provider job search, company research dossier synthesis, ATS resume generation, and bilingual French/English switching.

## Decision

**Chosen option**: Direct Git integrated Vercel deployment backed by `vercel.json` function duration overrides, GitHub push automation, and CLI verification tooling.

Connecting GitHub directly to Vercel provides the most reliable long term continuous deployment workflow. Every push to `master` automatically produces a production deployment, while pull requests produce isolated preview environments. Configuring `vercel.json` specifically addresses the serverless execution demands of our AI agents, raising default 15s function timeouts to 60s. Pre-flight verification in the local environment guarantees clean builds before code reaches Vercel builders.

**Implementation skills**: Vercel deployment workflows, Next.js 16 serverless architecture, InsForge production CORS/OAuth configuration.

## Value Sourcing

| Value / Constraint | Category | Source | Fallback / Behavior |
|---|---|---|---|
| `maxDuration` (find/research) | Serverless Timeout | `context/library-docs.md` (60 seconds) | Vercel default 15s (risks gateway timeouts) |
| `maxDuration` (resume) | Serverless Timeout | `context/library-docs.md` (30 seconds) | Vercel default 15s |
| `memory` | Function Memory | `context/library-docs.md` (1024MB) | 1024MB |
| `Git Remote` | Deployment Source | `https://github.com/Rolens1/jsm-jobpilot.git` | Direct CLI deploy |
| `Branch Target` | Production Branch | `master` | Main branch |
| `InsForge Redirect URI` | OAuth Security | `https://<project-domain>.vercel.app/callback` | Localhost callback |

## Rationale

Reasoning and alternatives: see [rationale.md](docs/specs/0016-vercel-deployment-pipeline/rationale.md).

## Feature Design

### 1. Serverless Function Configuration (`vercel.json`)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "functions": {
    "app/api/agent/find/route.ts": {
      "maxDuration": 60,
      "memory": 1024
    },
    "app/api/agent/research/route.ts": {
      "maxDuration": 60,
      "memory": 1024
    },
    "app/api/resume/route.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

### 2. Environment Variables Sync to Vercel

```bash
# Preview and production secrets synchronization
NEXT_PUBLIC_INSFORGE_URL
NEXT_PUBLIC_INSFORGE_ANON_KEY
INSFORGE_API_KEY
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
GROQ_API_KEY
GEMINI_API_KEY
OPENROUTER_API_KEY
RAPIDAPI_KEY
JOOBLE_API_KEY
ADZUNA_APP_ID
ADZUNA_APP_KEY
```

### 3. Build Milestones

- [ ] Milestone 1: Create `vercel.json` with serverless function limits (satisfies AC-1)
- [ ] Milestone 2: Execute pre-flight verification gates (`npx tsc --noEmit` and `npm run build`) (satisfies AC-5, AC-6)
- [ ] Milestone 3: Guide Vercel project connection via Git repository or CLI (satisfies AC-2)
- [ ] Milestone 4: Synchronize environment secrets to Vercel dashboard/project (satisfies AC-3)
- [ ] Milestone 5: Validate InsForge production CORS and OAuth redirect configuration (satisfies AC-4)
- [ ] Milestone 6: Trigger live deployment release and run post release smoke test checklist (satisfies AC-6, AC-7)

---

## Consequences

- Serverless functions have 60 seconds to execute complex job searches and web crawls, eliminating premature gateway aborts.
- Continuous deployment ensures any future pull requests or commits to `master` automatically deploy with zero manual server management.
- Production environment variables are secured inside Vercel encrypted environment vault.
