# Library Docs

Project-specific usage patterns for every third party library in this project. This file only covers how we use each library in this specific project — rules, patterns, and constraints specific to JobPilot.

Read the relevant section before implementing any feature that touches these libraries.

---

## Before Using Any Library

Before implementing any feature that uses a third party library:

1. **Check AGENTS.md** at the project root — it lists every skill installed for this project and how to use them. Skills contain up-to-date API documentation, usage patterns, and best practices specific to this codebase.

2. **Check if an MCP server is configured** for that library. Some tools have MCP servers that give the AI agent direct access to documentation, logs, and debugging tools. If an MCP server is available — use it before falling back to general knowledge.

3. **Read this file** for project-specific patterns that override general library knowledge.

The order of authority is:

```
MCP server (real-time docs) → Skills via AGENTS.md → This file (project rules) → General training knowledge
```

Never rely on general training knowledge alone for library APIs — they change frequently and training data may be outdated.

---

## InsForge

**Check first:** Check AGENTS.md for an installed InsForge skill. If an InsForge MCP server is configured — use it. The skill/MCP will have the latest API patterns.

### Client vs Server

Two separate instances — never mix them:

```typescript
// lib/insforge-client.ts — browser context only
import { createBrowserClient } from "@insforge/ssr";

export const insforge = createBrowserClient(
  process.env.NEXT_PUBLIC_INSFORGE_URL!,
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
);
```

```typescript
// lib/insforge-server.ts — server context only
import { createServerClient } from "@insforge/ssr";
import { cookies } from "next/headers";

export const createInsforgeServer = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_INSFORGE_URL!,
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
};
```

**Rules:**

- Browser client — Client Components, browser-side auth state, realtime subscriptions
- Server client — Server Components, API routes, Server Actions, agent functions
- Never use browser client in server context
- Never use server client in browser context

---

### Auth

```typescript
// Get current user in server context
const insforge = await createInsforgeServer();
const {
  data: { user },
  error,
} = await insforge.auth.getUser();
if (!user) redirect("/login");
```

---

### DB Queries

```typescript
// Read
const { data, error } = await insforge
  .from("jobs")
  .select("*")
  .eq("user_id", user.id)
  .order("found_at", { ascending: false });

// Insert
const { data, error } = await insforge
  .from("jobs")
  .insert({ user_id: user.id, title, company, match_score })
  .select()
  .single();

// Update
const { error } = await insforge
  .from("jobs")
  .update({ company_research: dossier })
  .eq("id", jobId)
  .eq("user_id", user.id); // always scope to user
```

**Rules:**

- Always scope queries to `user_id` — never query without user filter
- Always handle the `error` return — never assume success
- Use `.single()` when expecting exactly one row

---

### Storage

```typescript
// Upload file
const { data, error } = await insforge.storage
  .from("resumes")
  .upload(`${userId}/resume.pdf`, fileBuffer, {
    contentType: "application/pdf",
    upsert: true, // overwrites existing file
  });

// Get public URL
const { data } = insforge.storage
  .from("resumes")
  .getPublicUrl(`${userId}/resume.pdf`);

const url = data.publicUrl;
```

**Storage paths:**

- Base resume: `resumes/{user_id}/resume.pdf`

**Rules:**

- Always use `upsert: true` for base resume uploads — overwrites existing file
- Always save the public URL back to the DB after upload
- Never write files to disk — always upload buffer directly to storage

---

## Job Search APIs (JSearch, Jooble, Adzuna)

JobPilot uses a multi provider cascading engine for job discovery. JSearch on RapidAPI is the primary provider with full job descriptions and employer logos. Jooble and Adzuna serve as automated fallbacks when quotas or errors occur.

### Provider Cascade Architecture

```
User Search → Check Existing DB Listings (Same Search Guard)
                     │
         ┌───────────┴───────────┐
         │ (If new or refresh)   │
         ▼                       ▼
    1. JSearch (Primary)    2. Jooble (Fallback 1)    3. Adzuna (Fallback 2)
    RapidAPI GET            POST JSON                 GET REST
    Full descriptions       Excerpts                  Excerpts
```

### 1. JSearch API (Primary Provider)

```typescript
// lib/job-search/jsearch.ts
export async function searchJSearch(
  jobTitle: string,
  location: string,
  page: number = 1
): Promise<UnifiedJob[]> {
  const query = location ? `${jobTitle} in ${location}` : jobTitle;
  const params = new URLSearchParams({
    query,
    page: String(page),
    num_pages: "1",
    country: "ca",
    date_posted: "month",
  });

  const response = await fetch(
    `https://jsearch.p.rapidapi.com/search?${params}`,
    {
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
        "x-rapidapi-host": process.env.RAPIDAPI_HOST || "jsearch.p.rapidapi.com",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`JSearch API error: ${response.status}`);
  }

  const data = await response.json();
  return (data.data || []).map((raw: any) => ({
    id: raw.job_id,
    provider: "jsearch",
    title: raw.job_title,
    company: raw.employer_name,
    location: raw.job_city ? `${raw.job_city}, ${raw.job_state || ""}` : raw.job_country,
    salary: raw.job_salary_string || (raw.job_min_salary ? `$${Math.round(raw.job_min_salary / 1000)}k` : null),
    jobType: raw.job_employment_type?.toLowerCase().includes("contract") ? "contract" : "fulltime",
    aboutRole: raw.job_description,
    sourceUrl: raw.job_google_link || raw.job_apply_link,
    externalApplyUrl: raw.job_apply_link,
    employerLogo: raw.employer_logo || null,
  }));
}
```

### 2. Jooble API (Secondary Fallback)

```typescript
// lib/job-search/jooble.ts
export async function searchJooble(
  jobTitle: string,
  location: string,
  page: number = 1
): Promise<UnifiedJob[]> {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) throw new Error("JOOBLE_API_KEY not configured");

  const response = await fetch(`https://jooble.org/api/${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      keywords: jobTitle,
      location: location || "Canada",
      page,
      ResultOnPage: 10,
    }),
  });

  if (!response.ok) {
    throw new Error(`Jooble API error: ${response.status}`);
  }

  const data = await response.json();
  return (data.jobs || []).map((raw: any) => ({
    id: String(raw.id),
    provider: "jooble",
    title: raw.title.replace(/<\/?[^>]+(>|$)/g, ""),
    company: raw.company,
    location: raw.location,
    salary: raw.salary || null,
    jobType: "fulltime",
    aboutRole: raw.snippet.replace(/<\/?[^>]+(>|$)/g, ""),
    sourceUrl: raw.link,
    externalApplyUrl: raw.link,
  }));
}
```

### 3. Unified Job Type

```typescript
export type UnifiedJob = {
  id: string;
  provider: "jsearch" | "jooble" | "adzuna";
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  jobType: "fulltime" | "parttime" | "contract";
  aboutRole: string;
  sourceUrl: string;
  externalApplyUrl: string | null;
  employerLogo?: string | null;
};
```

### Rules:
- Default `num_pages` to `1` (10 results per search) to conserve API credits.
- If the user repeats the exact same search terms without changing input, return database records without calling external APIs.
- Deduplicate listings against existing user jobs in the database before running AI scoring.
- Batch evaluate all new listings in a single GPT-4o call.

---

## Browserbase

**Check first:** Check AGENTS.md for an installed Browserbase skill. If a Browserbase MCP server is configured — use it. The skill/MCP will have the latest session management and API patterns.

### Session Creation — Company Research

```typescript
import Browserbase from "@browserbasehq/sdk";

const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });

// Single session for company research — sequential page visits
const session = await bb.sessions.create({
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  timeout: 120, // 2 minute session — visits 3-4 pages max
});
```

**Important — Browserbase runs independently from your Next.js server:**
Browserbase sessions run on Browserbase's cloud infrastructure, not inside your Next.js API route. The API route triggers the Browserbase session and returns a response while the session continues running independently on Browserbase's platform. Do not add `maxDuration` or any timeout configuration to Next.js API routes to accommodate Browserbase session length.

**Rules:**

- Always use single sessions — never parallel sessions (free plan limit)
- Session timeout is 120 seconds — sufficient for 3-4 page visits
- Always end sessions cleanly — call stagehand.close() when done
- Project ID always from `process.env.BROWSERBASE_PROJECT_ID` — never hardcode
- Browserbase client lives in `lib/browserbase.ts` — always import from there

---

## Stagehand

**Check first:** Check AGENTS.md for an installed Stagehand skill. If a Stagehand MCP server is configured — use it. The skill/MCP will have the latest act() and extract() patterns.

### Initialisation

```typescript
import { Stagehand } from "@browserbasehq/stagehand";

const stagehand = new Stagehand({
  env: "BROWSERBASE",
  apiKey: process.env.BROWSERBASE_API_KEY!,
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  browserbaseSessionID: session.id,
  model: { modelName: "openai/gpt-4o", apiKey: process.env.OPENAI_API_KEY! },
  disablePino: true,
});

await stagehand.init();
const page = stagehand.context.activePage()!;
```

### extract()

```typescript
import { z } from "zod";

const result = await stagehand.extract({
  instruction:
    "Extract the company overview, main product description, and any technology mentions from this page.",
  schema: z.object({
    companyOverview: z.string().optional(),
    mainProduct: z.string().optional(),
    techMentions: z.array(z.string()).optional(),
    navLinks: z
      .array(
        z.object({
          label: z.string(),
          url: z.string(),
        }),
      )
      .optional(),
  }),
});
```

### act()

```typescript
// Always wrap in try/catch
try {
  await stagehand.act({
    action: "Click the About link in the navigation",
  });
} catch (error) {
  await logAgentError(jobId, null, error);
}
```

## Company Research Section

Replace the existing Stagehand "Company Research Pattern" section in library-docs.md with this:

---

### Company Research Pattern

Three-step process: homepage extraction → sub-page extraction → GPT-4o synthesis.
Job description and user profile come from DB — never re-fetch what you already have.
Browser's only job is the company website.

```typescript
// Step 1 — Homepage extraction
const homepageData = await stagehand.extract({
  instruction:
    "This is a company's homepage. Capture what the company actually does, who it's for, and any concrete signals (funding, customers, scale, mission, recent launches). Then find the internal links most worth visiting to research them as an employer.",
  schema: z.object({
    oneLiner: z.string().describe("What the company does in one sentence"),
    productSummary: z
      .string()
      .describe("What they build/sell and who it's for"),
    signals: z
      .array(z.string())
      .describe("Funding, notable customers, scale, mission, recent news"),
    pageLinks: z
      .array(
        z.object({
          url: z.string(),
          kind: z.enum([
            "about",
            "careers",
            "blog",
            "engineering",
            "product",
            "team",
            "other",
          ]),
        }),
      )
      .describe("Internal links worth visiting"),
  }),
});

// If oneLiner and productSummary are empty — wrong site or parked domain
// Skip to synthesis with job description and profile only
if (!homepageData.oneLiner && !homepageData.productSummary) {
  await stagehand.close();
  // proceed to synthesis with empty companyResearch
}

// Step 2 — Sub-page extraction (max 3, prefer about/blog/engineering/product over careers)
const subPageData = await stagehand.extract({
  instruction:
    "Extract substance that helps a candidate understand this company before applying: what they do, their values and how they work, the specific technologies and tools they use, notable projects or customers, and how the team operates. Ignore nav, footers, cookie banners, and generic marketing copy.",
  schema: z.object({
    keyPoints: z.array(z.string()),
    technologies: z
      .array(z.string())
      .describe("Specific languages, frameworks, tools, platforms"),
    valuesOrCulture: z
      .array(z.string())
      .describe("Stated values, working style, team norms"),
    notable: z
      .array(z.string())
      .describe("Customers, funding, scale, projects, awards"),
  }),
});

// Step 3 — GPT-4o synthesis (after browser closes)
// Feed three data sources: company research + job from DB + profile from DB
const systemPrompt = `You are a sharp career strategist preparing a candidate to apply for a specific role. You are given (a) research collected from the company's own website, (b) the job posting, and (c) the candidate's profile. Produce a concise, concrete briefing that gives this specific candidate an edge for this specific role.

Rules:
- Ground every company claim in the provided research or job posting. Never invent funding, customers, headcount, or facts. If research was thin, infer carefully from the job posting and say what's inferred.
- Be specific to THIS candidate. Connect their actual skills and past work to this company's stack, product, and values. No generic advice that would apply to anyone.
- Turn the candidate's missing skills into a strategy: how to frame the gap honestly and what adjacent experience to lean on.
- Talking points and questions must reference real things from the research, the kind of detail that signals the candidate did their homework.
- Keep every item tight: one or two sentences. No fluff.

Return ONLY valid JSON matching this shape:
{
  "companyOverview": string,
  "techStack": string[],
  "culture": string[],
  "whyThisRole": string,
  "yourEdge": string[],
  "gapsToAddress": string[],
  "smartQuestions": string[],
  "interviewPrep": string[],
  "sources": string[]
}`;

const userPrompt = `COMPANY RESEARCH (from their website):
${JSON.stringify(companyResearch)}

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Matched skills (already computed): ${job.matched_skills.join(", ")}
Missing skills (already computed): ${job.missing_skills.join(", ")}

CANDIDATE PROFILE:
Current title: ${profile.current_title}
Experience: ${profile.years_experience} years, level ${profile.experience_level}
Skills: ${profile.skills.join(", ")}
Work history: ${JSON.stringify(profile.work_experience)}`;

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  response_format: { type: "json_object" },
  temperature: 0.4,
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ],
});
```

**Dossier fields:**

| Field           | Type     | Purpose                                             |
| --------------- | -------- | --------------------------------------------------- |
| companyOverview | string   | What the company does                               |
| techStack       | string[] | Technologies they use                               |
| culture         | string[] | Values and working style                            |
| whyThisRole     | string   | Why this role exists                                |
| yourEdge        | string[] | Specific links between THIS candidate and this role |
| gapsToAddress   | string[] | Missing skills reframed as strategy                 |
| smartQuestions  | string[] | Questions that show real research                   |
| interviewPrep   | string[] | Topics to prepare for this role                     |
| sources         | string[] | Pages the company info came from                    |

**Rules:**

- Always use `extract()` with a Zod schema — never parse raw HTML or use regex
- Always wrap every `act()` and `extract()` in try/catch
- Always call `await stagehand.close()` when done — ends the Browserbase session
- Model is always `gpt-4o` — never use other models
- Temperature is `0.4` for synthesis — grounded but flexible enough to make real connections
- Max 3 sub-pages — never exceed this on free plan
- Always close session in finally block — never leave sessions open even if research fails
- Job description and profile always come from DB — never re-fetch via browser
- If browser research returns empty — still run synthesis with job + profile only
- yourEdge, gapsToAddress, and smartQuestions are the most valuable fields — never skip them

## OpenAI GPT-4o

**Check first:** Check AGENTS.md for an installed OpenAI skill. The skill will have the latest API patterns and model capabilities.

### Structured JSON Response

```typescript
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  response_format: { type: "json_object" },
  temperature: 0.3,
  messages: [
    {
      role: "system",
      content: "You are a job matching assistant. Return only valid JSON.",
    },
    {
      role: "user",
      content: `Your prompt here`,
    },
  ],
});

const result = JSON.parse(response.choices[0].message.content!);
```

**Temperature settings:**

- `0.3` — matching, scoring, extraction, research synthesis — deterministic results
- `0.7` — resume generation — natural variation

**Max tokens:**

- Job matching + scoring: `300`
- Company research synthesis: `800`
- Resume generation: `1000`
- Profile extraction from resume: `800`

**Rules:**

- Model string is always `'gpt-4o'` — never use other model names
- Always use `response_format: { type: 'json_object' }` for structured data
- Always parse `response.choices[0].message.content` as string — even with json_object it returns a string
- Always validate parsed JSON before using — wrap in try/catch
- Match threshold is always `MATCH_THRESHOLD` from `lib/utils.ts` — never hardcode 70
- Company research synthesis must always return a complete dossier — never return empty even if browser research failed

---

## PostHog

**Check first:** Check AGENTS.md for an installed PostHog skill. If a PostHog MCP server is configured — use it. The skill/MCP will have the latest client and server patterns.

### Client Setup (Browser)

```typescript
// lib/posthog-client.ts
import posthog from "posthog-js";

export function initPostHog() {
  if (typeof window !== "undefined") {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
      capture_pageview: false, // manual pageview tracking
    });
  }
}

// Capture event client-side
posthog.capture("job_found", {
  userId,
  source: "search",
  matchScore: score,
});
```

### Server Setup

```typescript
// lib/posthog-server.ts
import { PostHog } from "posthog-node";

export const createPostHogServer = () =>
  new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
    flushAt: 1, // send immediately
    flushInterval: 0, // no batching — Next.js functions are short-lived
  });

// Always use and shutdown in the same function
const posthog = createPostHogServer();
posthog.capture({
  distinctId: userId,
  event: "company_researched",
  properties: { userId, jobId, company },
});
await posthog.shutdown(); // required — ensures event is sent
```

**Rules:**

- Always call `await posthog.shutdown()` in server-side functions — events are lost without it
- `flushAt: 1` and `flushInterval: 0` always set on server client
- Event names must match exactly the list in `code-standards.md`
- Always include `userId` as a property on every server-side event
- Call `posthog.identify(userId)` after login on client side
- Call `posthog.reset()` on logout on client side

---

## @react-pdf/renderer

**Check first:** Check AGENTS.md for an installed react-pdf skill. PDF generation APIs can differ from general training knowledge.

### Resume PDF Generation

```typescript
import { renderToBuffer } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  section: { marginBottom: 10 },
  heading: { fontSize: 14, fontWeight: 'bold' },
  text: { fontSize: 10 },
})

const ResumePDF = ({ profile }: { profile: Profile }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.heading}>{profile.fullName}</Text>
        <Text style={styles.text}>{profile.email}</Text>
      </View>
    </Page>
  </Document>
)

// Generate buffer
const buffer = await renderToBuffer(<ResumePDF profile={profile} />)

// Upload directly to InsForge Storage
await insforge.storage
  .from('resumes')
  .upload(`${userId}/resume.pdf`, buffer, {
    contentType: 'application/pdf',
    upsert: true
  })
```

**Supported CSS properties:**
Only use these — others are silently ignored:
`padding, margin, fontSize, color, fontFamily, flexDirection, alignItems, justifyContent, borderRadius, width, height, fontWeight, textAlign, lineHeight`

**Rules:**

- Server-side only — never import in client components
- Always use `renderToBuffer` — not `renderToStream` or `PDFDownloadLink`
- PDF generation only in `app/api/resume/` routes
- Generated buffer uploaded directly to InsForge Storage — never written to disk
- Always save public URL to DB after upload

---

## pdf-parse

**Check first:** Check AGENTS.md for an installed pdf-parse skill.

### Extract Text from Uploaded Resume

```typescript
import pdf from "pdf-parse";

// In API route handling resume upload
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("resume") as File;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const pdfData = await pdf(buffer);
  const extractedText = pdfData.text; // raw text content

  // Send to GPT-4o for structured extraction
}
```

**Rules:**

- Server-side only — never import in client components
- `pdfData.text` is raw unformatted text — GPT-4o handles the structure extraction
- Always handle parse errors — some PDFs are image-based and return empty text
- If `pdfData.text` is empty or very short — return error to user: "Could not extract text from this PDF. Please try a different file."

---

## Vercel Deployment and Runtime Integration

**Check first:** Check AGENTS.md for installed Vercel skills (`deploy-to-vercel`, `vercel-cli-with-tokens`).

### Overview and Deployment Strategy

JobPilot is deployed on Vercel using Next.js 16 App Router with Partial Prerendering and Turbopack. The preferred deployment workflow is GitHub git push integration, where pushes to `master` trigger production releases and pull requests produce isolated preview environments.

### Environment Variables Matrix

All production environment variables must be configured in Vercel Project Settings (Settings -> Environment Variables). Never commit `.env.local` to version control.

| Variable Name | Exposure | Purpose |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Public (Client + Server) | Canonical production domain (e.g. `https://jobpilot.vercel.app`) |
| `NEXT_PUBLIC_INSFORGE_URL` | Public (Client + Server) | InsForge BaaS API endpoint |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | Public (Client + Server) | InsForge public anonymous access key |
| `INSFORGE_API_KEY` | Secret (Server only) | InsForge server admin key for storage and server actions |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public (Client + Server) | PostHog public project ingest token |
| `NEXT_PUBLIC_POSTHOG_HOST` | Public (Client + Server) | PostHog host endpoint (e.g. `https://us.i.posthog.com`) |
| `GROQ_API_KEY` | Secret (Server only) | Groq ultra fast Llama 3.3 inference gateway |
| `GEMINI_API_KEY` | Secret (Server only) | Google Gemini 2.0 Flash fallback |
| `CEREBRAS_API_KEY` | Secret (Server only) | Cerebras inference fallback |
| `MISTRAL_API_KEY` | Secret (Server only) | Mistral Small and Large fallback |
| `OPENROUTER_API_KEY` | Secret (Server only) | OpenRouter community model access |
| `OPENAI_API_KEY` | Secret (Server only) | OpenAI GPT-4o fallback gateway |
| `RAPIDAPI_KEY` | Secret (Server only) | JSearch primary job discovery aggregator |
| `JOOBLE_API_KEY` | Secret (Server only) | Jooble secondary job discovery fallback |
| `ADZUNA_APP_ID` | Secret (Server only) | Adzuna tertiary job discovery application ID |
| `ADZUNA_APP_KEY` | Secret (Server only) | Adzuna tertiary job discovery application key |

### vercel.json Serverless Function Limits

Multi provider job discovery cascades and web research synthesis can require extended execution time. Configure `maxDuration` in `vercel.json` for long running route handlers:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
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

### Next.js 16 Partial Prerendering on Vercel

1. **Root Layout Static Invariant**: Root layout (`app/layout.tsx`) must never invoke dynamic `cookies()` or `headers()` outside a Suspense boundary. Locale initialization occurs cleanly on client mount in `LanguageProvider.tsx`.
2. **Server Action Streaming**: PDF generation and server action calls return streaming buffers directly to private InsForge storage without local filesystem writes.
3. **Response Headers**: Security headers (Content Security Policy, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, Referrer-Policy) are configured in `next.config.ts` using the `async headers()` configuration.

### InsForge Production Configuration

Before launching production traffic on Vercel:
1. **Allowed Origins**: In InsForge console under Authentication Settings, add your Vercel domains (`https://<project-name>.vercel.app` and custom domain) to Allowed Web Origins.
2. **OAuth Redirect URLs**: Add `https://<project-name>.vercel.app/callback` to the permitted redirect URI whitelist for Google and GitHub authentication.
3. **Cookie Security**: Ensure session and locale cookies (`insforge_access_token`, `NEXT_LOCALE`) operate with `SameSite=Lax` and secure transport on HTTPS.

