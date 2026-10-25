# 0004. Resume PDF Generation from Profile: Rationale

## Context

Candidates looking for tech and corporate roles frequently struggle to format their career history into clean, single page resumes that pass automated Applicant Tracking Systems (ATS). While JobPilot already allows candidates to maintain structured profile data and upload external PDF resumes, candidates need a frictionless way to export their current profile into a professional, download ready PDF.

The generation pipeline must handle several competing forces:
- Candidate profiles are versatile, containing experiences that span multiple disciplines. A generic export can appear disjointed unless content is focused on the candidate specific target career direction.
- External AI models are subject to periodic latency spikes, rate limits, or transient outages. A failure in an upstream LLM API must not prevent a job seeker from obtaining their resume.
- Automated ATS parsers reject complex multi layer graphics, unusual fonts, or multi column text blocks that jumble reading order. A clean, classic single column serif format ensures near universal parsing accuracy.
- Server environments in Next.js require deterministic PDF compilation without running heavy headless browser instances that degrade memory and CPU limits.

## Options considered

### Option 1: Headless Chromium via Puppeteer or Browserless

Render standard HTML and CSS in a headless browser instance and capture the page as a PDF via `page.pdf()`.

**Pros**:
- Full CSS styling support including Tailwind classes and flexbox grids.
- Identical visual output between browser preview and generated PDF.

**Cons**:
- Heavy memory footprint (100MB to 300MB per browser instance), creating concurrency limits on serverless and small servers.
- Slow cold start times and complex external binary dependencies.

### Option 2: Client Side Generation via jsPDF or html2canvas

Capture the DOM on the candidate device and render into a canvas or client generated PDF buffer.

**Pros**:
- Zero server compute and zero memory overhead on the application host.
- Instant client feedback.

**Cons**:
- Text in canvas exports is often rasterized into images, ruining ATS machine readability and searchability.
- Uploading the resulting client blob back to server storage requires an extra network round trip and creates vulnerability to client side failures.

### Option 3: Server Side Declarative PDF Rendering with react pdf renderer (Chosen)

Render the PDF directly in Node.js using `@react-pdf/renderer` via `renderToBuffer()`.

**Pros**:
- True vector PDF output with selectable, searchable text that scores optimally on ATS systems.
- Lightweight compared to headless browsers, with fast compilation times.
- Integrates seamlessly with Next.js server actions, uploading output buffers directly to InsForge Storage without round trips to the browser.

**Cons**:
- Requires specialized primitive components (`Document`, `Page`, `View`, `Text`, `StyleSheet`) rather than standard HTML divs.
- Strict layout engine requires careful budgeting of font sizes and line heights to guarantee single page fit.

## Rationale

We chose Option 3 because server side declarative PDF rendering produces high quality ATS compatible vector documents without the heavy infrastructure tax of headless browsers.

To address the need for role relevance, the generation action passes the candidate target job title (from `job_titles_seeking` or `current_title`) to our multi provider LLM gateway (`lib/ai.ts`). The model generates an executive summary and selects the strongest action verbs for experience bullet points tailored to that role.

To ensure resilience, the system incorporates an automatic fallback: if the LLM provider experiences latency or returns an error, the generator immediately compiles the PDF using the candidate original profile text. This guarantees zero downtime and reliable resume creation under all conditions.

Finally, the classic monochrome design (formal serif typography, crisp horizontal rules, and pure black text) was selected over multi column or colored designs because it provides superior readability on paper, screens, and automated employer ingestion systems.
