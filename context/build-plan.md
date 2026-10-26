# Build Plan

## Core Principle

Full page UI built with mock data first — verified visually before any logic is written. Then functionality is built and wired to the UI step by step. Every feature must be visible and testable before moving to the next. No invisible backend phases.

---

## Phase 1 — Foundation

### 01 Homepage

Build the complete homepage UI.

**UI:**

- Navbar — logo, Dashboard, Find Jobs, Profile links, Start for free button
- Hero section — headline, subheadline, Get Started CTA and Find Your First Match CTA
- Dashboard preview screenshot embedded below hero
- Features section — three value props with descriptions
- Testimonial section
- Bottom CTA section
- Footer

**Logic:**

- Get Started and Start for free → /login if not authenticated, /dashboard if authenticated

---

### 02 Auth

InsForge authentication — Google and GitHub OAuth.

**UI:**

- Login page — Google OAuth button, GitHub OAuth button

**Logic:**

- Google OAuth via InsForge
- GitHub OAuth via InsForge
- OAuth callback handler
- Session management
- Middleware protecting /dashboard, /profile, /find-jobs, /find-jobs/[id]
- After login → redirect to /dashboard

---

### 03 PostHog Initialization

Set up PostHog before any events fire. Must be done before any agent features.

**Logic:**

- Create lib/posthog-client.ts — PostHog browser client, initialized with NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST
- Create lib/posthog-server.ts — PostHog server client with flushAt: 1 and flushInterval: 0
- Initialize PostHog in root app layout — wraps entire app
- posthog.identify() called after successful login with user ID
- posthog.reset() called on logout

---

### 04 Database Schema

All InsForge tables and storage bucket created before any data is written.

**Logic:**

- Create `profiles` table with all columns from architecture.md
- Create `agent_runs` table
- Create `jobs` table with all columns including:
  - tailored fields
  - company_research jsonb column
  - source values: 'search' | 'url'
- Create `agent_logs` table
- Create `resumes` storage bucket with authenticated access only
- Row level security policies on all four tables — always filter by user_id

---

## Phase 2 — Profile Page

### 05 Profile Page — Full UI

Build the complete profile page UI with mock data. No save logic yet.

**UI:**

- Profile needs attention banner at top — completion percentage ring, missing field tags highlighted (e.g. PHONE, LOCATION, EDUCATION)
- Resume section — drag and drop upload area, "Click to upload or drag and drop" text, PDF only note, Select Resume button, Generate Resume from Profile button below
- Profile Information form with clearly labeled sections:
  - Personal Info — Full Name, Email (pre-filled, not editable), Phone Number, Location, LinkedIn URL, Portfolio/GitHub, Work Authorization dropdown
  - Professional Info — Current Job Title, Experience Level dropdown, Years of Experience, Skills tag input with Add button, Industries tag input with Add button
  - Work Experience — up to 3 roles, each with Company Name, Job Title, Start Date, End Date, Currently working here checkbox, Key Responsibilities textarea. Add role button.
  - Education — Highest Degree dropdown, Field of Study, Institution Name, Graduation Year
  - Job Preferences — Job Titles Seeking, Remote Preference dropdown, Salary Expectation, Preferred Locations, Cover Letter Tone dropdown
- Save Profile button at bottom

---

### 06 Profile Save Logic

> Spec: [docs/specs/0002-profile-save-logic/index.md](docs/specs/0002-profile-save-logic/index.md)

Wire profile form to InsForge DB.

**Logic:**

- Server Action in actions/profile.ts saves all form fields to profiles table
- Resume PDF uploaded to InsForge Storage at resumes/{user_id}/resume.pdf with upsert: true
- resume_pdf_url saved to profiles table after upload
- is_complete set to true when all required fields are filled
- Completion percentage and missing fields calculated and saved
- Form pre-fills with existing data on return visits
- revalidatePath('/profile') called after save

---

### 07 AI Profile Extraction from Resume

> Spec: [docs/specs/0003-resume-ai-extraction/index.md](docs/specs/0003-resume-ai-extraction/index.md)

Extract from Resume button — GPT-4o reads uploaded PDF and auto-fills profile form fields.

**UI:**

- Extract from Resume button appears after resume is uploaded
- Loading state while processing
- Form fields populate automatically after extraction
- User reviews and edits if needed before saving

**Logic:**

- pdf-parse extracts raw text from uploaded PDF buffer
- If extracted text is empty or too short — return error: "Could not extract text from this PDF. Please try a different file."
- GPT-4o reads extracted text and returns structured JSON matching all profile field names
- Form fields populated with extracted data
- User saves manually after reviewing

---

### 08 Resume PDF Generation from Profile

> Spec: [docs/specs/0004-resume-pdf-generation/index.md](docs/specs/0004-resume-pdf-generation/index.md)

Generate a clean professional PDF resume from current profile data using GPT-4o.

**Logic:**

- POST /api/resume/generate
- Reads current profile data from profiles table
- GPT-4o generates professional resume content:
  - Professional summary paragraph
  - Polished work experience bullet points
  - Clean professional language throughout
- @react-pdf/renderer renders GPT-4o output into clean single-page PDF using renderToBuffer()
- Buffer uploaded to InsForge Storage at resumes/{user_id}/resume.pdf with upsert: true
- resume_pdf_url updated in profiles table

---

## Phase 3 — Find Jobs Page

### 09 Find Jobs Page — Full UI

> Spec: [docs/specs/0005-find-jobs-ui/index.md](docs/specs/0005-find-jobs-ui/index.md)

Build the complete Find Jobs page UI with mock data. No logic yet.

**UI:**

- Search controls card at top:
  - JOB TITLE label + input with search icon placeholder "Frontend Engineer"
  - LOCATION label + input placeholder "Remote, New York..."
  - Find Jobs button with search icon
  - Success message area below controls — green banner: "Found 8 jobs and saved 4 strong matches."
- Job list section below:
  - Filter bar: text search input "Filter by company or role...", All Matches dropdown, Match Score sort dropdown
  - Jobs table with columns: COMPANY, ROLE, MATCH SCORE (color coded progress bar + percentage), SALARY EST., SOURCE (Search/URL badge), DATE FOUND
  - Pagination — "Showing 1 to 6 of 24 results", Previous, page numbers, Next

---

### 10 Multi Provider Job Discovery Agent

Agent finds jobs matching user search criteria using JSearch on RapidAPI as the primary provider with full descriptions, falling back to Jooble and Adzuna. Scored against user profile using GPT-4o, with same search caching and deduplication.

**Logic:**

- POST /api/agent/find receives jobTitle, location, and optional page/forceRefresh from client
- Check database for existing matches. If the user submits the identical search terms without changes, return existing records without consuming external API credits.
- Query external providers in cascade:
  - Primary: JSearch via RapidAPI (10 jobs per page, full descriptions, company logos, direct apply links)
  - Secondary fallback: Jooble API (if JSearch returns 429 or error)
  - Tertiary fallback: Adzuna API (if both prior providers fail)
- Deduplicate listings against existing user jobs in the database
- Batch evaluate all new listings with GPT-4o in a single structured JSON completion:
  - matchScore: integer 0 to 100
  - matchReason: one paragraph explanation
  - matchedSkills: skills user has that job requires
  - missingSkills: skills job requires that user lacks
- Persist structured jobs into jobs table and create agent_run record
- Return discovered jobs and success counts to frontend

**PostHog events:** `job_search_started`, `job_found`

---

### 11 Filter + Sort + Pagination

Wire filter tabs, sort dropdown, text search, and pagination to real InsForge DB data.

**Logic:**

- All Matches tab — all jobs for current user
- High Match filter — jobs with match_score >= 70
- Low Match filter — jobs with match_score < 70
- Sort by Match Score — order by match_score descending
- Sort by Newest — order by found_at descending
- Sort by Oldest — order by found_at ascending
- Text search — filter by company name or job title (case insensitive)
- Pagination — 20 jobs per page, total count shown

---

## Phase 4 — Job Details Page

### 12 Job Details Page — Full UI

> Spec: [docs/specs/0007-job-details-page/index.md](docs/specs/0007-job-details-page/index.md)

Build the complete job details page UI. Job data from DB is already available from Phase 3 — wire real data for all job info and match sections immediately. Company research section shows empty state only.

**UI:**

- Back to Jobs link
- Job header — company logo placeholder, job title, company name, match score badge with percentage, View Job Post button (links to redirect_url)
- Info cards row — Salary Est., Location, Job Type, Date Found
- AI Match Reasoning section — match reason paragraph from GPT-4o
- Required Skills vs Your Profile — matched skills as green badges, missing skills as red/orange badges
- Job Description section — description content from Adzuna
- Company Research card — empty state with Research Company button. After research: structured dossier with company overview, tech stack, culture, why this role, interview prep
- Apply Now button (links to redirect_url, opens in new tab)

---

# Feature 13 — Company Research Agent (Updated)

> Spec: [docs/specs/0008-company-research-agent/index.md](docs/specs/0008-company-research-agent/index.md)

Agent researches the company using their public website and builds a structured dossier using a single Browserbase session. Three data sources fused together: company website content, job description from DB, user profile from DB.

**Logic:**

- POST /api/agent/research receives jobId
- Load job data from DB — extract company_name, job description, matched_skills, missing_skills
- Load user profile from DB — skills, experience, work history
- Derive company homepage URL by following the Adzuna redirect with server-side fetch() — no browser needed for this step:
  - fetch(redirect_url, { redirect: "follow" }) follows HTTP redirects natively before the browser opens
  - Use response.url as the real employer job page URL
  - Strip subdomain from response.url hostname (e.g. jobs.stripe.com → stripe.com)
  - Construct homepage URL as https://{rootDomain}
  - If response.url still contains "adzuna.com" or fetch throws — fall back to https://www.{company}.com (company name from DB)
  - If Stagehand gets no meaningful content (oneLiner and productSummary empty) — skip browser research entirely, proceed to GPT-4o synthesis with job description and profile only
- Open single Browserbase session with Stagehand
  **Stagehand homepage extraction:**

```typescript
const homepage = await stagehand.extract({
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
```

If oneLiner and productSummary are empty — bail to synthesis with job description and profile only.

**Stagehand sub-page extraction (max 3 pages — prefer about/blog/engineering/product over careers):**

```typescript
const page = await stagehand.extract({
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
```

- Close Browserbase session after homepage + max 3 sub-pages
  **GPT-4o synthesis (runs after browser closes):**

System prompt:

```
You are a sharp career strategist preparing a candidate to apply for a specific role.
You are given (a) research collected from the company's own website, (b) the job posting,
and (c) the candidate's profile. Produce a concise, concrete briefing that gives this
specific candidate an edge for this specific role.

Rules:
- Ground every company claim in the provided research or job posting. Never invent
  funding, customers, headcount, or facts. If research was thin, infer carefully from
  the job posting and say what's inferred.
- Be specific to THIS candidate. Connect their actual skills and past work to this
  company's stack, product, and values. No generic advice that would apply to anyone.
- Turn the candidate's missing skills into a strategy: how to frame the gap honestly
  and what adjacent experience to lean on.
- Talking points and questions must reference real things from the research, the kind
  of detail that signals the candidate did their homework.
- Keep every item tight: one or two sentences. No fluff.

Return ONLY valid JSON.
```

User prompt feeds three data sources:

```
COMPANY RESEARCH (from their website): {companyResearch}
JOB POSTING: title, company, description, matched_skills, missing_skills
CANDIDATE PROFILE: current_title, years_experience, experience_level, skills, work_experience
```

Temperature: 0.4

**Dossier shape saved to jobs.company_research jsonb:**

```json
{
  "companyOverview": "string",
  "techStack": ["string"],
  "culture": ["string"],
  "whyThisRole": "string",
  "yourEdge": ["string"],
  "gapsToAddress": ["string"],
  "smartQuestions": ["string"],
  "interviewPrep": ["string"],
  "sources": ["string"]
}
```

- Save complete dossier to jobs.company_research jsonb column
- Always return a dossier — never fail silently. If browser research failed, GPT-4o synthesizes from job description and profile alone.
  **PostHog event:** `company_researched` — { userId, jobId, company }

---

## Job Details UI — Company Research Card (Updated)

The Company Research card on the job details page must render all 9 fields:

- **Company Overview** — paragraph
- **Tech Stack** — tag list
- **Culture** — bullet list
- **Why This Role** — paragraph
- **Your Edge** — bullet list (highlight — specific to this candidate)
- **Gaps to Address** — bullet list (reframed as strategy, not weaknesses)
- **Smart Questions** — bullet list (questions to ask in interview)
- **Interview Prep** — bullet list
- **Sources** — small text, links to pages researched

## Phase 5 — Dashboard

### 14 Dashboard Page — Full UI

> Spec: [docs/specs/0009-dashboard-page-ui/index.md](docs/specs/0009-dashboard-page-ui/index.md)

Build the complete dashboard UI with mock data matching `context/designs/dashboard.png`.
**UI:**

- Four stat cards: Total Jobs Found, Avg. Match Rate, Companies Researched, Jobs This Week — with trend indicators and subtitles matching `context/designs/dashboard.png`
- Recent Activity card — list of 5 activity entries with double ring colored dots, titles, and relative timestamps
- Company Research Activity — responsive SVG bar chart (daily counts Monday through Sunday)
- Jobs Found Over Time — responsive SVG area chart with smooth purple spline curve and gradient fill
- Match Score Distribution — responsive SVG bar chart (score ranges 50-60%, 60-70%, 70-80%, 80-90%, 90-100%)
- Incomplete profile banner at top if profile not complete (`ProfileAttentionBanner`)


---

### 15 Stats Bar — Real Data

Wire four stat cards to real InsForge DB data for current user.

**Logic:**

- Total Jobs Found — COUNT of jobs where user_id = current user
- Avg. Match Rate — AVG of match_score across all user jobs
- Companies Researched — COUNT of jobs where company_research IS NOT NULL and user_id = current user
- Jobs This Week — COUNT of jobs found in last 7 days

---

### 16 Recent Activity — Real Data

Wire recent activity list to real InsForge DB data for current user.

**Logic:**

- Query agent_runs table — most recent runs for current user
- Query jobs table — most recent company research entries for current user
- Merge and sort all by created_at descending — take last 5-10 entries
- Format each into human readable string:
  - agent_run completed → "Found X jobs for [jobTitle] — [time ago]"
  - company_research populated → "Researched [company] — [time ago]"
- Color coded dot per entry type — info blue, success green

---

### 17 Analytics Charts — PostHog Data

Wire three dashboard charts to real PostHog event data for current user.

**Logic:**

- Jobs Found Over Time — query PostHog for job_found events where distinctId = current userId, last 30 days, group by day
- Match Score Distribution — query PostHog for job_found events, extract matchScore property, group into ranges: 50-60, 60-70, 70-80, 80-90, 90-100
- Company Research Activity — query PostHog for company_researched events where distinctId = current userId, last 7 days, group by day
- All three charts rendered with recharts
- Empty state shown for each chart when no data exists yet

---

## Phase 6: Internationalization (French and English Localization)

### 18 Language Architecture, Dictionaries, and Onboarding Preference

Build the core bilingual infrastructure with frictionless first login onboarding and a sleek navbar control.

**Logic & UI:**
- Lightweight type safe dictionary system (`messages/en.json` and `messages/fr.json`) supporting server and client components without route disruption.
- Automatic browser language detection on initial landing using `Accept-Language` header and browser navigator.
- First time login language prompt: displays an elegant onboarding prompt asking the candidate for their preferred language (English or Français) with one click confirmation, immediately setting `NEXT_LOCALE` cookie and updating `preferred_language` in the InsForge `profiles` table.
- Professional Navbar switcher: integrated seamlessly into the top navigation bar alongside profile controls as a clean segmented pill (EN | FR) with smooth micro interactions, avoiding persistent floating badges.
- Instant cookie synchronization and live revalidation on language switch.

---

### 19 Full UI Copy Conversion Across All App Surfaces

Translate all application screens and UI components with high quality native French terminology tailored to modern engineering and tech recruitment.

**Scope:**
- Public pages: Homepage (Hero, Features, Testimonial, Bottom CTA), Footer, Auth (Login card, callback states).
- Candidate Profile: Attention banner, circular progress meter, resume dropzone, profile form sections, tag inputs, and extracted resume review modal.
- Find Jobs: Search controls, quick filter bar, status tabs (All Matches / Toutes les correspondances, High Match / Forte compatibilité), table columns, and pagination labels.
- Job Details: Header card, metrics grid (Salary, Type, Found Date, Source), AI match analysis badges, job description layout, and floating sticky apply bar.
- Dashboard: Header greeting, stats cards, recent activity feed, and analytics chart axes.

---

### 20 Bilingual AI and Document Intelligence

Make AI generation, scoring explanations, and document generation respect the candidate active language preference.

**Logic:**
- Scorer Prompt Calibration (`lib/job-search/scorer.ts`): Passes candidate preferred language to the AI system prompt so `match_reason` narrative and skill summaries are generated in French when requested.
- ATS Resume PDF Generator (`lib/pdf/ClassicMonochromeTemplate.tsx`): Translates classic ATS section headings (Expérience professionnelle, Formation, Compétences clés) and date format strings based on candidate preference.
- Resume AI Extraction (`actions/resume.ts`): Preserves multilingual extraction compatibility, handling both French and English CVs seamlessly.
- Error messages and validation alerts rendered in the candidate chosen language.

---

## Phase 7: Deployment & Production Launch

### 21 Production Environment & Secrets Architecture

> Spec: [docs/specs/0014-production-environment/index.md](docs/specs/0014-production-environment/index.md)

Configure and validate production environment variables, security contracts, and InsForge database network settings for Vercel deployment.

**Scope & Logic:**
- Audit all required runtime and build time environment variables across authentication, database, analytics, AI gateways, and job aggregators.
- Produce a hardened `.env.example` defining exact expected keys, defaults, and documentation for deployment.
- Implement type safe validation schema in `lib/env.ts` using Zod, executing fail fast validation at build entry points.
- Verify InsForge BaaS production domain whitelisting, OAuth redirect URLs for Vercel production domain, and database connection pooling.
- Create local `scripts/sync-env.mjs` helper for Vercel CLI sync while protecting credentials via `.gitignore`.

**Build Milestones:**
- [x] Milestone 1: Zod schema & validator in `lib/env.ts` (satisfies AC-1, AC-2, AC-3)
- [x] Milestone 2: Comprehensive `.env.example` documentation across 7 functional domains (satisfies AC-4)
- [x] Milestone 3: Entry point integration in `next.config.ts` (satisfies AC-2, AC-7)
- [x] Milestone 4: Local sync script `scripts/sync-env.mjs` and `.gitignore` update (satisfies AC-6)
- [x] Milestone 5: InsForge production setup documentation in `docs/deployment/insforge-setup.md` (satisfies AC-5)
- [x] Milestone 6: Build verification with `npm run build` and `tsc --noEmit` (satisfies AC-1, AC-2, AC-3)

---

### 22 Build Hardening, Security Headers, Rate Limiting & Runtime Compatibility

> Spec: [docs/specs/0015-security-headers-rate-limiting/index.md](docs/specs/0015-security-headers-rate-limiting/index.md)

Ensure the Next.js 16 application is fully hardened for production edge and serverless execution on Vercel with active abuse protection.

**Scope & Logic:**
- Address Next.js 16 runtime conventions (resolve proxy/middleware deprecation warnings).
- Configure production HTTP security headers in `next.config.ts` (Content-Security-Policy, Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
- Implement database backed API rate limiting in `lib/rate-limit.ts` backed by an InsForge PostgreSQL table (`rate_limits`) with zero extra third party dependencies.
- Protect expensive endpoints (`/api/agent/find`, `/api/agent/research`, and resume extraction) against quota exhaustion using sliding window counters by client IP address and authenticated user ID.
- Return standard HTTP 429 Too Many Requests status codes with `Retry-After` headers and localized candidate friendly alert messages when limits are reached.
- Verify bundle optimization, static page caching, and Partial Prerendering compliance under production flags.

**Build Milestones:**
- [ ] Milestone 1: Create migration `migrations/0002_rate_limits.sql` and apply to InsForge database (satisfies AC-1, AC-2)
- [ ] Milestone 2: Implement rate limiting service in `lib/rate-limit.ts` (satisfies AC-3, AC-5)
- [ ] Milestone 3: Integrate rate limiter into API routes and server actions (satisfies AC-4)
- [ ] Milestone 4: Migrate `middleware.ts` to `proxy.ts` conforming to Next.js 16 conventions (satisfies AC-6)
- [ ] Milestone 5: Configure HTTP security headers and CSP in `next.config.ts` (satisfies AC-7)
- [ ] Milestone 6: Build verification with `npm run build` and `tsc --noEmit` (satisfies AC-6, AC-7)

---

### 23 Vercel Project Architecture, CI/CD Pipeline & Live Deployment

Link the project to Vercel, configure automated deployment triggers, and perform the live production release.

**Scope & Logic:**
- Create `vercel.json` if required for build settings, region selection, and serverless function limits.
- Link repository via Vercel CLI / GitHub integration with preview and production deployment workflows.
- Run pre-flight verification checks (`tsc --noEmit`, `next build`) and trigger deployment.
- Perform end-to-end smoke verification on live `.vercel.app` URL covering auth, database queries, AI scoring, bilingual toggle, and resume PDF generation.

---

## Feature Count

| Phase                 | Features |
| --------------------- | -------- |
| Phase 1: Foundation   | 4        |
| Phase 2: Profile      | 4        |
| Phase 3: Find Jobs    | 3        |
| Phase 4: Job Details  | 2        |
| Phase 5: Dashboard    | 4        |
| Phase 6: i18n (FR/EN) | 3        |
| Phase 7: Deployment   | 3        |
| **Total**             | **23**   |
