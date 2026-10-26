# JobPilot

> An AI orchestrated career intelligence platform built via agentic workflows. Discovers matching jobs across multiple search providers, synthesizes deep company dossiers, and generates tailored ATS compliant resumes with bilingual support.

[![Live Demo](https://img.shields.io/badge/Live_Demo-jsm--jobpilot.vercel.app-10b981?style=for-the-badge&logo=vercel)](https://jsm-jobpilot.vercel.app)
[![Next.js 16](https://img.shields.io/badge/Next.js_16-Turbopack-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React_19-App_Router-61dafb?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![InsForge BaaS](https://img.shields.io/badge/Backend-InsForge_PostgreSQL-7928ca?style=for-the-badge)](https://insforge.app)

---

## 🌐 Live Application

Explore the production deployment at **[jsm-jobpilot.vercel.app](https://jsm-jobpilot.vercel.app)**.

Includes a demo showcase quota (3 searches, 3 company dossiers, 2 resume extractions, and 3 PDF generations per 10 minutes) so recruiters and evaluators can experience the full feature set and test edge rate limit guards in action.

---

## 💡 The Core Mission: Agentic Engineering

JobPilot was created to demonstrate how modern software engineering can be elevated through an **agentic development workflow**. 

Rather than treating AI as a superficial autocomplete tool, this project used specialized AI agent roles guided by formal specifications, strict design token constraints, and automated verification gates. The outcome is production grade, type safe architecture paired with a refined, human centered design system.

### How the Agentic Workflow Built This App
1. **Spec Driven Architecture**: Every major capability was designed through modular build specifications in `docs/specs/`, establishing clear acceptance criteria, security invariants, and fallback states before code was written.
2. **Design System Discipline**: All user interfaces adhere to a tokenized palette and component hierarchy defined in `context/ui-tokens.md` and `context/ui-rules.md`, strictly avoiding ad hoc hex codes or unconstrained CSS utility sprawl.
3. **Automated Verification Gates**: Every incremental milestone enforced pre flight compiler passes (`npx tsc --noEmit`) and Next.js 16 Turbopack production builds (`npm run build`) with zero tolerated type errors or hydration warnings.
4. **Resilient Provider Cascades**: Engineered with automatic fallback loops across high performance LLM inference providers and distributed job aggregator APIs (JSearch, Jooble, Adzuna).

---

## ✨ Key Features

### 1. Autonomous Multi Provider Job Discovery Agent
* Cascading search aggregator combining **RapidAPI JSearch**, **Jooble**, and **Adzuna** APIs.
* Evaluates semantic fit using structured LLM evaluation to compute candidate match scores (0 to 100%) and personalized match rationales.
* Deduplicates listings, enforces search session guards to save API quotas, and supports dynamic pagination.

### 2. Deep Company Intelligence Agent
* Automatically resolves verified company websites from career portal links while filtering generic aggregators.
* Extracts public web footprints and synthesizes an executive 9 field intelligence dossier (culture, business model, engineering tech stack, key leadership, candidate edge advantages, and strategic interview prep questions).

### 3. ATS Vector Resume Intelligence
* **AI Resume Parser**: Extracts structured candidate histories, skills, and education from uploaded PDF resumes.
* **Non Destructive Editing**: Candidates review extracted information with section level rollbacks before saving.
* **Server Side PDF Streaming**: Generates pixel perfect single page monochrome vector resumes optimized for Applicant Tracking Systems via `@react-pdf/renderer` with real time in browser preview.

### 4. Native Bilingual Experience (English & French)
* Instant cookie based runtime language switching without disruptive route redirects or page reloads.
* Synchronized dictionaries ensure complete copy coverage across all UI cards, modals, and tables.
* AI prompts dynamically adapt to candidate language preferences, producing French or English match rationales, interview questions, and resume bullet points.

### 5. Production Hardening & Abuse Protection
* **PostgreSQL Atomic Rate Limiting**: Row level locking (`FOR UPDATE`) in database stored procedures prevents quota exhaustion without requiring external Redis dependencies.
* **Vercel Edge Cron**: Automated daily maintenance task (`/api/cron/cleanup-rate-limits`) purges expired tracking records.
* **HTTP Security Headers**: Strict Content Security Policy (CSP), HSTS, `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff`.
* **Smart CI/CD Filter**: Custom `ignoreCommand` in `vercel.json` skips redeployments when only documentation or README changes are pushed.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | Next.js 16 (Turbopack, App Router, Partial Prerendering, Cache Components) |
| **Language & Styling** | TypeScript 5, React 19, Tailwind CSS 3.4, Lucide Icons |
| **Backend & Database** | InsForge BaaS (PostgreSQL with PostgREST, Row Level Security, Auth, Storage) |
| **Document Generation** | `@react-pdf/renderer` (Server side vector PDF synthesis), `pdfjs-dist` |
| **AI & LLM Orchestration** | High Performance LLM Inference Gateway with Automated Multi Provider Failover |
| **Job Aggregation** | RapidAPI JSearch, Jooble API, Adzuna Developer API |
| **Telemetry & Analytics**| PostHog Client and Node SDKs (Custom event instrumentation) |
| **Deployment & CI/CD** | Vercel Edge & Serverless Infrastructure, Vercel Crons, GitHub Actions |

---

## 🚀 Local Development Setup

### 1. Clone & Install
```bash
git clone https://github.com/Rolens1/jsm-jobpilot.git
cd jsm-jobpilot
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and provide your credentials:

```bash
cp .env.example .env.local
```

Required minimum variables:
* `NEXT_PUBLIC_INSFORGE_URL` and `NEXT_PUBLIC_INSFORGE_ANON_KEY` (InsForge BaaS backend)
* `GROQ_API_KEY` or `GEMINI_API_KEY` (LLM inference gateway)
* `RAPIDAPI_KEY` (Job discovery search)

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Production Build & Type Checking
```bash
# Type check with zero errors
npx tsc --noEmit

# Production build with Next.js 16 Turbopack
npm run build
```

---

## 📂 Project Structure

```text
├── actions/                  # Next.js Server Actions (Auth, Resume, Analytics)
├── app/                      # App Router routes and API handlers
│   ├── api/agent/find/       # Multi provider job discovery endpoint (60s budget)
│   ├── api/agent/research/   # Deep company research agent endpoint (60s budget)
│   ├── api/cron/             # Scheduled maintenance crons
│   ├── api/resume/           # Vector ATS PDF streaming route
│   ├── dashboard/            # Candidate analytics, SVG metrics, and activity
│   ├── find-jobs/            # Search controls, filter tabs, and jobs table
│   └── profile/              # Candidate profile, ATS resume upload, and preview
├── components/               # Modular presentation components with design tokens
├── context/                  # Project specifications, UI rules, and token registry
├── dictionaries/             # English (en) and French (fr) i18n translation maps
├── docs/specs/               # Specification index, rationales, and verify matrix
├── lib/                      # Core services (AI, rate limiting, PostHog, InsForge)
├── migrations/               # PostgreSQL schema definitions and stored procedures
└── vercel.json               # Serverless function allocations, cron schedules, and build filter
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
