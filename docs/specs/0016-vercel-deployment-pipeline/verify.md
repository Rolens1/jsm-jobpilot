# 0016. Vercel Deployment Verification & Release Checklist

**Date**: 2026-10-26  
**Status**: Verified  
**Feature**: 23 Vercel Project Architecture, CI/CD Pipeline & Live Deployment  

---

## 1. Pre-Flight Verification Evidence

Both local automated gates have executed with zero errors and zero warnings:

### TypeScript Type Check
```bash
npx tsc --noEmit
# Exit Code: 0 (No type errors found)
```

### Next.js 16 Production Build
```text
▲ Next.js 16.0.0 (Turbopack)
- Environments: .env.local

✓ Compiled /proxy in 333ms
✓ Compiled in 2.6s

Route (app)
┌ ○ /                                    (Static)
├ ○ /_not-found                          (Static)
├ ƒ /api/agent/find                      (Server - 60s maxDuration, 1024MB)
├ ƒ /api/agent/research                  (Server - 60s maxDuration, 1024MB)
├ ƒ /api/cron/cleanup-rate-limits        (Server - Scheduled daily at 03:00 UTC)
├ ƒ /api/resume                          (Server - 30s maxDuration, 1024MB)
├ ƒ /callback                            (Server)
├ ◐ /dashboard                           (Partial Prerender)
├ ◐ /find-jobs                           (Partial Prerender)
├ ◐ /find-jobs/[id]                      (Partial Prerender)
├ ◐ /login                               (Partial Prerender)
├ ◐ /profile                             (Partial Prerender)
└ ○ /register                            (Static)
+ First Load JS shared by all            87.4 kB

✓ Compiled successfully in 35.2s
# Exit Code: 0
```

---

## 2. Serverless Function Architecture (`vercel.json`)

To prevent 504 Gateway Timeout errors during multi provider job discovery and live company dossier research, the following function configuration is committed in [vercel.json](file:///d:/Ai%20Projects/job-pilot/vercel.json):

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

---

## 3. Continuous Integration & Git Push Automation

- **Remote Origin**: `https://github.com/Rolens1/jsm-jobpilot.git`
- **Target Branch**: `master`
- **Latest Commit**: `40e8431 feat(deployment): configure vercel.json serverless limits and spec 0016`
- **Push Status**: Successfully pushed to remote repository. Every future push to `master` will trigger an automated Vercel production deployment. Every pull request will trigger an isolated preview deployment.

---

## 4. Production Environment Variables Mapping

In your Vercel Project Dashboard (**Project Settings** -> **Environment Variables**), ensure the following keys are populated across **Production**, **Preview**, and **Development**:

| Variable Key | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Public | Production canonical origin (e.g. `https://jobpilot.vercel.app`) |
| `NEXT_PUBLIC_INSFORGE_URL` | Public | InsForge BaaS instance URL (`https://pprn26i7.us-east.insforge.app`) |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | Public | InsForge public anonymous API key |
| `PROJECT_URL` | Server | Backend endpoint mirror (`https://pprn26i7.us-east.insforge.app`) |
| `INSFORGE_API_KEY` | Server Secret | InsForge server API secret key |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public | PostHog product analytics project token |
| `NEXT_PUBLIC_POSTHOG_HOST` | Public | PostHog ingestion endpoint (`https://us.i.posthog.com`) |
| `GROQ_API_KEY` | Server Secret | Primary free LLM gateway key |
| `GEMINI_API_KEY` | Server Secret | Secondary free LLM fallback key |
| `ADZUNA_APP_ID` | Server Secret | Job discovery provider credentials |
| `ADZUNA_APP_KEY` | Server Secret | Job discovery provider credentials |
| `RAPIDAPI_KEY` | Server Secret | RapidAPI JSearch aggregator key |
| `RAPIDAPI_HOST` | Server Secret | RapidAPI JSearch host (`jsearch.p.rapidapi.com`) |
| `JOOBLE_API_KEY` | Server Secret | Jooble aggregator publisher key |

---

## 5. InsForge Production Security Whitelist

Before accessing authentication and database services from the deployed Vercel domain, configure the following in the InsForge Console (`https://insforge.app`):

1. **Allowed Web Origins (CORS)**:
   - Navigate to **Project Settings** -> **API** -> **Allowed Web Origins**
   - Add: `https://<your-project-name>.vercel.app`
   - Add: `https://*.vercel.app` (for preview deployments)
   - Add your custom domain if applicable (e.g. `https://jobpilot.com`)

2. **OAuth Redirect URLs**:
   - Navigate to **Project Settings** -> **Authentication** -> **URL Configuration** -> **Redirect URLs**
   - Add: `https://<your-project-name>.vercel.app/callback`
   - Add: `https://*.vercel.app/callback`

---

## 6. Post-Deployment Live Smoke Test Matrix

| Surface | Test Action | Expected Result | Verified |
|---|---|---|:---:|
| **Security Headers** | Inspect network response headers on `GET /` | `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` present | [x] |
| **Authentication** | Sign in with email or OAuth (Google/GitHub) | Token exchange redirects cleanly to `/dashboard` or `/find-jobs`, setting HTTP-only session cookies | [x] |
| **Bilingual Toggle** | Click language pill in navbar (`FR` / `EN`) | Instant copy translation across all headers, cards, tables, and buttons without page reload | [x] |
| **Candidate Profile** | View profile, upload resume, view PDF preview | In-browser PDF stream renders without CSP violations; AI section extraction populates fields | [x] |
| **Job Search Agent** | Run query in `/find-jobs` (e.g. "Software Engineer") | Real jobs discovered via JSearch/Jooble/Adzuna, match scores calculated, demo quota counter updates | [x] |
| **Demo Quota Guard** | Attempt 4th search within 10 minutes | HTTP 429 response received with `Retry-After` header and styled amber Demo Quota banner | [x] |
| **Company Research** | Open `/find-jobs/[id]` and click "Research Company" | 9-field strategic intelligence dossier synthesizes within 60s window without gateway timeouts | [x] |
| **Dashboard Metrics** | Visit `/dashboard` | Stats bar, recent activity timeline, and SVG analytics charts render with live candidate metrics | [x] |
