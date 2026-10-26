# 0014. Production Environment and Secrets Architecture

**Date**: 2026-10-26  
**Status**: In Progress  

## Summary

This specification establishes the production environment contract and secrets architecture for JobPilot deployment on Vercel. We introduce a dedicated type safe validation module in `lib/env.ts` built with Zod that validates critical environment variables during startup and build time. Optional third party AI and job discovery providers fail gracefully with clear warnings rather than halting builds. We also define a comprehensive `.env.example` catalog, strict InsForge production authentication whitelisting, and a local secrets sync helper script kept outside of git version control.

## Requirements

**User stories**:
- As a DevOps engineer deploying JobPilot to Vercel, I want a single source of truth for all required and optional environment variables so that deployment configuration is predictable and transparent.
- As a developer running local builds or automated continuous integration, I want immediate build time errors if core infrastructure keys like InsForge are missing so that broken builds never reach production.
- As an end user browsing the live application, I want JobPilot to remain operational even if an optional third party AI or job aggregator key is missing or experiencing downtime.
- As a security conscious project maintainer, I want server secrets strictly quarantined from client bundles and authentication redirect URLs locked to canonical production domains so that credentials and tokens are protected from leakage.

**Acceptance criteria**:
- **AC-1**: A central environment module `lib/env.ts` defines explicit Zod schemas for client variables (`NEXT_PUBLIC_*`) and server secrets, exporting a typed `validateEnv()` validator and parsed configuration contract.
- **AC-2**: Critical infrastructure variables (`NEXT_PUBLIC_INSFORGE_URL`, `NEXT_PUBLIC_INSFORGE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`) fail fast with human readable descriptive error messages if missing during build or runtime startup.
- **AC-3**: Optional service keys for AI providers (`GROQ_API_KEY`, `GEMINI_API_KEY`, `CEREBRAS_API_KEY`, `MISTRAL_API_KEY`, `OPENROUTER_API_KEY`, `OPENAI_API_KEY`) and job search aggregators (`RAPIDAPI_KEY`, `JOOBLE_API_KEY`, `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`) allow undefined values, enabling graceful fallback cascades and degraded mode warnings without crashing the build.
- **AC-4**: A comprehensive `.env.example` file documents every public and secret variable across all 7 functional domains (app URLs, InsForge BaaS, PostHog analytics, AI models, RapidAPI JSearch, Jooble, and Adzuna) with descriptions and placeholder formats.
- **AC-5**: InsForge production project settings document strict callback URL whitelisting limited exclusively to the canonical production domain (`https://<project>.vercel.app/callback` and any verified custom domain) with wildcard preview URLs omitted for security isolation.
- **AC-6**: A local helper script `scripts/sync-env.mjs` is established to automate pushing local environment variables to Vercel project settings via the Vercel CLI, with `.gitignore` updated so that `scripts/sync-env.mjs` and any `.env.production.local` files are never committed to GitHub.
- **AC-7**: Existing source files continue accessing `process.env` normally at this stage, while `next.config.ts` or server initialization invokes `validateEnv()` as an entry point gatekeeper to avoid disruptive churn across current application modules.

## Decision

**Chosen option**: Dedicated type safe Zod module in `lib/env.ts` with standalone entry point validation and private local sync tooling.

We select a lightweight, native Zod schema in `lib/env.ts` over third party packages like `@t3-oss/env-nextjs` because Zod is already a core project dependency. This eliminates redundant dependencies while giving us complete control over custom error messages and fallback cascades. The validator enforces critical variables at build time while keeping AI and aggregator keys optional so preview deployments and staging builds do not require all 6 AI provider keys to succeed. InsForge authentication callbacks are restricted strictly to the primary production domain to maximize security isolation. To simplify populating secrets to Vercel, we supply a helper script in `scripts/sync-env.mjs` but quarantine it from GitHub via `.gitignore`.

**Implementation skills**: Next.js 16 App Router runtime, Zod schema validation, Vercel Serverless environment conventions, InsForge BaaS authentication.

## Value Sourcing

| Variable / Value | Category | Source | Fallback / Behavior |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Client Public | Vercel Project Settings | Defaults to `http://localhost:3000` in development |
| `NEXT_PUBLIC_INSFORGE_URL` | Client Public | InsForge Project Metadata | Required: build fails if missing |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | Client Public | InsForge Project Metadata | Required: build fails if missing |
| `NEXT_PUBLIC_POSTHOG_KEY` | Client Public | PostHog Project Settings | Optional: analytics disabled if absent |
| `NEXT_PUBLIC_POSTHOG_HOST` | Client Public | PostHog Project Settings | Defaults to `https://us.i.posthog.com` |
| `GROQ_API_KEY` | Server Secret | Groq Console | Primary AI: falls back to Gemini if absent |
| `GEMINI_API_KEY` | Server Secret | Google AI Studio | Secondary AI: falls back to Cerebras if absent |
| `CEREBRAS_API_KEY` | Server Secret | Cerebras Cloud | Tertiary AI: falls back to Mistral if absent |
| `MISTRAL_API_KEY` | Server Secret | Mistral Console | Quaternary AI: falls back to OpenRouter if absent |
| `OPENROUTER_API_KEY` | Server Secret | OpenRouter Dashboard | Quinary AI: falls back to OpenAI if absent |
| `OPENAI_API_KEY` | Server Secret | OpenAI Platform | Ultimate AI: logs error if all AI providers absent |
| `RAPIDAPI_KEY` | Server Secret | RapidAPI JSearch | Primary search: falls back to Jooble if absent |
| `RAPIDAPI_HOST` | Server Secret | RapidAPI JSearch | Defaults to `jsearch.p.rapidapi.com` |
| `JOOBLE_API_KEY` | Server Secret | Jooble Publisher API | Secondary search: falls back to Adzuna if absent |
| `ADZUNA_APP_ID` | Server Secret | Adzuna Developer Portal | Tertiary search: required if using Adzuna |
| `ADZUNA_APP_KEY` | Server Secret | Adzuna Developer Portal | Tertiary search: required if using Adzuna |
| `BROWSERBASE_API_KEY` | Server Secret | Browserbase Dashboard | Optional: remote browser sessions for company research |
| `BROWSERBASE_PROJECT_ID` | Server Secret | Browserbase Dashboard | Optional: remote browser sessions for company research |

## Rationale

Reasoning and alternatives: see [rationale.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0014-production-environment/rationale.md).

## Feature Design

### 1. Schema Definition and Validator (`lib/env.ts`)

```typescript
import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_INSFORGE_URL: z.string().url({
    message: "NEXT_PUBLIC_INSFORGE_URL must be a valid InsForge project URL.",
  }),
  NEXT_PUBLIC_INSFORGE_ANON_KEY: z.string().min(1, {
    message: "NEXT_PUBLIC_INSFORGE_ANON_KEY is required for database and auth access.",
  }),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().default("https://us.i.posthog.com"),
});

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Core infrastructure
  INSFORGE_API_KEY: z.string().optional(),
  
  // AI Gateways (at least one recommended, but individual keys optional)
  GROQ_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  CEREBRAS_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // AI Default Model overrides
  GROQ_MODEL: z.string().default("qwen/qwen3.8-27b"),
  GEMINI_MODEL: z.string().default("gemini-3.8-flash"),
  CEREBRAS_MODEL: z.string().default("llama-3.3-70b"),
  MISTRAL_MODEL: z.string().default("mistral-small-latest"),
  OPENROUTER_MODEL: z.string().default("meta-llama/llama-3.3-70b-instruct:free"),

  // Job Search aggregators
  RAPIDAPI_KEY: z.string().optional(),
  RAPIDAPI_HOST: z.string().default("jsearch.p.rapidapi.com"),
  JOOBLE_API_KEY: z.string().optional(),
  ADZUNA_APP_ID: z.string().optional(),
  ADZUNA_APP_KEY: z.string().optional(),

  // Browserbase optional research agent
  BROWSERBASE_API_KEY: z.string().optional(),
  BROWSERBASE_PROJECT_ID: z.string().optional(),
});

export function validateEnv() {
  const clientParsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_INSFORGE_URL: process.env.NEXT_PUBLIC_INSFORGE_URL,
    NEXT_PUBLIC_INSFORGE_ANON_KEY: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });

  if (!clientParsed.success) {
    console.error("Invalid client environment variables:");
    console.error(clientParsed.error.flatten().fieldErrors);
    throw new Error("Missing critical client environment variables. Check .env or Vercel project settings.");
  }

  const serverParsed = serverEnvSchema.safeParse(process.env);
  if (!serverParsed.success) {
    console.error("Invalid server environment variables:");
    console.error(serverParsed.error.flatten().fieldErrors);
    throw new Error("Invalid server environment configuration.");
  }

  return {
    client: clientParsed.data,
    server: serverParsed.data,
  };
}
```

### 2. Standalone Gatekeeper Integration

To avoid modifying 20+ existing files that consume `process.env`, `validateEnv()` is imported and executed once in `next.config.ts` during build evaluation and server startup:

```typescript
// next.config.ts
import { validateEnv } from "./lib/env";

// Perform environment validation during build evaluation
if (process.env.NODE_ENV === "production" || process.env.CI) {
  validateEnv();
}
```

### 3. Local Secrets Sync Tooling (`scripts/sync-env.mjs`)

A developer utility that reads `.env.local` and optionally pushes keys to Vercel via `vercel env add`:
- Verifies Vercel CLI is present.
- Prompts or reads targets (Production, Preview, Development).
- Adds keys interactively or in batch.
- Protected by `.gitignore` entry:
  ```gitignore
  # Local secret sync scripts
  scripts/sync-env.*
  .env.production.local
  ```

### 4. Key Invariants

1. Zero client leakage: No server secrets (`*_API_KEY`, `*_APP_KEY`) may begin with `NEXT_PUBLIC_`.
2. Fail fast for InsForge: The application will never boot or compile in production without valid InsForge URLs and anon keys.
3. Resilience for AI and search: Missing third party provider keys degrade gracefully to next provider in cascade rather than causing unhandled runtime rejections.
4. Production redirect isolation: InsForge dashboard whitelist allows only `https://<production-domain>/callback` to prevent token interception across unofficial preview URLs.

### 5. Security Model

- **Public variables**: Only non sensitive identifiers (`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_INSFORGE_URL`, `NEXT_PUBLIC_INSFORGE_ANON_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`) are allowed to be packaged in browser javascript bundles.
- **Server secrets**: All AI and aggregator credentials remain strictly server side within Next.js API route handlers and server actions.
- **Git quarantine**: Real production credentials and local helper sync scripts are strictly banned from repository commits via `.gitignore`.

### 6. Critical Test Scenarios

- Happy path: Application builds cleanly with all required InsForge keys and at least one AI key present, satisfies **AC-1**, **AC-2**.
- Build failure case: Removing `NEXT_PUBLIC_INSFORGE_URL` triggers an immediate explanatory build error from `validateEnv()`, satisfies **AC-2**.
- Graceful degradation case: Running job search or resume extraction without `JOOBLE_API_KEY` or `OPENAI_API_KEY` cascades to alternative configured providers without crashing, satisfies **AC-3**.
- Git security check: `git status` verifies `.env.production.local` and `scripts/sync-env.mjs` are completely ignored by git, satisfies **AC-6**.

## Build Plan

1. [x] Create `lib/env.ts` with Zod schema and `validateEnv()` export for client and server environment variables, satisfies **AC-1**, **AC-2**, **AC-3**.
2. [x] Expand `.env.example` into a comprehensive documentation template covering all 16 variables across all 7 functional domains, satisfies **AC-4**.
3. [x] Integrate `validateEnv()` into `next.config.ts` so production builds fail fast on missing core infrastructure keys, satisfies **AC-2**, **AC-7**.
4. [x] Create the local sync script `scripts/sync-env.mjs` and update `.gitignore` to guarantee local sync tooling and production credentials remain out of GitHub, satisfies **AC-6**.
5. [x] Document InsForge production dashboard settings for domain whitelisting, OAuth callbacks, and CORS origins in `docs/deployment/insforge-setup.md`, satisfies **AC-5**.
6. [x] Run build verification (`npm run build` and `npx tsc --noEmit`) to confirm clean compilation under validated environment contracts, satisfies **AC-1**, **AC-2**, **AC-3**.

## Consequences

**Positive**:
- Eliminates mystery runtime crashes on Vercel by catching missing configuration at build time.
- Provides immediate onboarding clarity for any engineer through a fully documented `.env.example`.
- Shields private API keys from accidental client bundle inclusion or git commits.
- Preserves codebase stability by validating at entry points rather than rewriting every existing `process.env` reference.

**Negative / tradeoffs**:
- Requires maintaining the Zod schema in `lib/env.ts` whenever new third party API providers are added.
- Omitting Vercel preview URLs from InsForge callback whitelist means OAuth testing requires manual login rather than OAuth redirects on ephemeral preview branches.

**Neutral**:
- Team members deploying for the first time must execute `scripts/sync-env.mjs` or populate the 16 environment variables in the Vercel dashboard.

## Follow-up

- [ ] Execute `scripts/sync-env.mjs` or enter production variables into Vercel Project Settings when setting up Feature 23.
- [ ] Configure InsForge BaaS production redirect URLs and CORS settings in the InsForge project dashboard once the canonical Vercel production domain is assigned.
