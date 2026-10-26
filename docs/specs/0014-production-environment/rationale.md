# 0014. Production Environment and Secrets Architecture: Rationale and Alternatives

**Date**: 2026-10-26  
**Status**: Proposed  

## Context

JobPilot is preparing for deployment to Vercel production infrastructure. The application relies on multiple distributed subsystems including InsForge PostgreSQL, authentication, and storage, PostHog product analytics, a multi tier AI gateway supporting 6 distinct model providers (Groq, Gemini, Cerebras, Mistral, OpenRouter, OpenAI), and a three tier job search cascade (RapidAPI JSearch, Jooble, Adzuna).

Without a formalized environment architecture, applications deploying to serverless platforms suffer from silent build time passes that fail catastrophically at runtime due to missing or misspelled environment variables. Furthermore, because Next.js inlines variables prefixed with `NEXT_PUBLIC_` into client javascript bundles during compilation, strict segregation between public configuration and server secrets is essential to prevent credential leaks.

Additionally, InsForge BaaS requires explicit network and callback authorization for OAuth PKCE redirection. Deploying to Vercel requires a deliberate decision on whether to permit wildcard preview domains or restrict authorization strictly to canonical production domains. Finally, developers need a streamlined mechanism to populate these 16 variables to Vercel without committing sensitive values or helper scripts to public repositories.

## Options Considered

### Option 1: Heavy External Library (@t3-oss/env-nextjs) (Rejected)

In this approach, the project installs `@t3-oss/env-nextjs` to manage environment schemas and runtime wrappers.

*Why rejected*:
- Adds an unnecessary external runtime dependency when Zod is already installed and actively used throughout the project.
- Introduces opinionated wrapper functions that can complicate Next.js 16 Partial Prerendering and standalone serverless build targets.
- Increases maintenance overhead for a setup that native Zod schemas accomplish in under 70 lines of clean code.

### Option 2: Loose Runtime Checking with Plain process.env (Rejected)

In this approach, no build time schema validation is implemented. The application continues relying on `process.env.VAR!` assertions scattered across route handlers and server actions.

*Why rejected*:
- Builds succeed even when essential infrastructure keys are missing, leading to broken 500 errors on the live Vercel domain.
- Missing configuration is only discovered when a specific code path is triggered by an active user.
- Offers no centralized documentation or automated verification of the 16 required variables.

### Option 3: Dedicated Type Safe Zod Module in lib/env.ts with Standalone Entry Point Validation and Private Local Sync Tooling (Recommended)

In this approach, a lightweight Zod schema in `lib/env.ts` defines all client and server variables. A standalone `validateEnv()` function executes during build evaluation in `next.config.ts`, failing fast on critical missing variables like InsForge while permitting optional third party providers to remain undefined. Existing code continues reading `process.env` normally to prevent churn. A local sync script `scripts/sync-env.mjs` facilitates pushing variables to Vercel but is quarantined from GitHub via `.gitignore`.

*Why chosen*:
- Employs boring and proven technology: uses our existing Zod dependency with zero new packages.
- Fast failure during compilation: catches missing core credentials before code ever reaches production servers.
- Resilient architecture: allows preview builds and staging tests to run without requiring all 6 third party AI provider keys.
- Complete security isolation: restricts InsForge OAuth callbacks strictly to the production domain and guarantees secrets sync tooling remains out of GitHub.
- Non disruptive integration: verifies the environment at the build entry point without requiring modifications to 20+ existing source files.

## Rationale

The central requirement of this phase is guaranteeing a reliable, secure deployment on Vercel while preserving the high velocity of the team. 

Option 3 strikes the ideal balance between strict security contracts and operational pragmatism. Enforcing hard failure on InsForge keys eliminates the single most common cause of broken deployments, while treating AI gateways and job search aggregators as optional with fallback cascades ensures JobPilot remains operable in degraded modes. 

Keeping `lib/env.ts` as an entry point validator rather than refactoring every existing `process.env` reference avoids risky regressions across completed features 1 through 20. Quarantining the helper sync script in `.gitignore` honors our rule that real production secrets and developer sync tooling must never leak into GitHub.
