# 0008. Company Research Agent Decision Record

## Context

Job applications are significantly more effective when candidates demonstrate deep understanding of the hiring company, its product, its engineering stack, and its team culture. However, conducting thorough company research before every application is exhausting and time consuming. Candidates often apply with generic resumes or enter interviews unprepared to ask insightful questions.

In Phase 3, JobPilot introduced the multi provider job discovery agent (Feature 10) and comprehensive filter and sort mechanisms (Feature 11). Discovered jobs are parsed and scored, with full details accessible on the Job Details page built in Feature 12. 

Feature 13 introduces the Company Research Agent. The agent must investigate the hiring employer, fuse web intelligence with the job requirements and candidate profile, and construct an actionable briefing document. The primary engineering challenges are reliable domain resolution, resilient web scraping across arbitrary corporate websites without brittle browser dependencies, grounded AI synthesis that eliminates hallucinations, and intuitive UI presentation.

## Options considered

### Option 1: Multi tier hybrid extraction with native redirect resolution, public web parsing, and grounded LLM fallback

The server resolves the company root domain by following HTTP redirects on the job posting URL or constructing the domain from the company name. Public pages (Homepage, About, Engineering, Product) are extracted using HTTP fetch or lightweight reader parsers, with Browserbase / Stagehand invoked if explicit browser credentials are provided. If web extraction encounters anti bot defenses or returns empty text, the system seamlessly proceeds to LLM synthesis using the job description and candidate profile alone. The LLM synthesis runs with a strict grounding prompt, outputs a 9 field JSON dossier, and saves the result to `jobs.company_research`.

**Pros**:
- Zero single point of failure: guarantees an insightful dossier is produced every time, even when employer firewalls block external crawlers.
- Extremely fast: lightweight HTTP extraction completes in 1 to 2 seconds compared to 15 to 30 seconds for heavy browser sessions.
- Keeps operational costs zero by avoiding paid browser infrastructure unless explicitly configured.
- Seamlessly fits into the existing Next.js App Router and InsForge database architecture.

**Cons**:
- Certain dynamic single page applications built entirely in client JavaScript without server side rendering might only yield metadata or fallback to job posting facts when headless browsers are unconfigured.

### Option 2: Heavyweight browser automation only (Browserbase + Stagehand required)

Every research request requires spinning up a remote Chromium instance on Browserbase and executing Stagehand extract actions across multiple pages.

**Pros**:
- Handles complex client rendered single page applications.

**Cons**:
- Fails completely whenever `BROWSERBASE_API_KEY` is not configured or remote browser quotas are exhausted.
- Substantially higher latency (15 to 30 seconds per research job), creating poor user experience.
- High operational overhead and cost for every researched job.

### Option 3: Static LLM knowledge retrieval without web extraction

The LLM generates company information entirely from its pre trained parametric knowledge base, without inspecting current company websites.

**Pros**:
- Simplest code to implement with zero web requests.

**Cons**:
- Prone to hallucinations and stale information for rapidly growing startups, new funding rounds, or recent tech migrations.
- Fails to capture current job board redirect links or specific company values.

## Rationale

We selected Option 1. It provides the ideal balance of speed, resilience, cost efficiency, and accuracy. By attempting real web extraction while retaining an automatic fallback to rich job description and candidate profile synthesis, JobPilot guarantees that the candidate always receives a high quality, personalized briefing.

Furthermore, grounding the synthesis prompt with strict instructions (rule 1: ground claims in evidence; rule 2: personalize to the candidate; rule 3: turn skill gaps into constructive strategies) prevents generic AI filler and delivers concrete value that directly improves interview outcomes.
