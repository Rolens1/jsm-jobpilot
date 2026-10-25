# Handoff / Session Memory

> Generated: 2026-10-25T00:23:00-04:00  
> Project: JobPilot (`d:/Ai Projects/job-pilot`)  
> Session summary: Completed Feature 08 (Resume PDF Generation from Profile) with single page serif styling, AI tailoring with zero latency raw fallback, private InsForge Storage persistence, and in app modal preview with direct download. Verified all 8 acceptance criteria, completed five axis quality audit, updated registry via `/imprint`, and saved memory to prepare for Phase 3.

## Goal

Build JobPilot, an AI-powered job hunting assistant using Next.js 16 (App Router), InsForge backend (Auth, DB, Storage), Browserbase + Stagehand for company research, Adzuna API for job discovery, OpenAI/Groq/Gemini for LLM operations, and PostHog for analytics. Follow the 17-feature build plan in `context/build-plan.md`.

## Current State

**Completed & Confirmed Working:**
- **Feature 01: Homepage** is fully implemented and compiled cleanly with `npm run build` (Next.js 16.4.3 Turbopack, 0 errors).
- **Feature 02: Auth** is fully implemented and compiled cleanly with `npm run build`.
- **Feature 03: PostHog Initialization & Event Tracking** is fully implemented, debugged, and verified.
- **Feature 04: Database Schema & Storage Bucket** is fully implemented, migrated, and verified.
- **Feature 05: Profile Page — Full UI** is fully implemented, responsive, and verified.
- **Feature 06: Profile Save Logic & Secure Resume PDF Viewing** is fully implemented, hardened, and verified:
  - Profile fields persist directly to the PostgreSQL `profiles` table via Server Action [actions/profile.ts](file:///d:/Ai%20Projects/job-pilot/actions/profile.ts).
  - Resumes upload to private storage bucket `resumes` under user-scoped paths (`{userId}/resume.pdf`).
  - Authenticated streaming endpoint [app/api/resume/route.ts](file:///d:/Ai%20Projects/job-pilot/app/api/resume/route.ts) streams stored PDF files directly with `Content-Disposition: inline`.
  - In-app PDF preview modal in [components/profile/ResumeSection.tsx](file:///d:/Ai%20Projects/job-pilot/components/profile/ResumeSection.tsx) allows users to view selected local files or existing saved resumes in an embedded viewer or open in a native browser tab.
- **Feature 07: AI Profile Extraction from Resume** is fully implemented, debugged, and verified:
  - Multi provider AI model gateway in [lib/ai.ts](file:///d:/Ai%20Projects/job-pilot/lib/ai.ts) and [actions/resume.ts](file:///d:/Ai%20Projects/job-pilot/actions/resume.ts) using Groq, Gemini, and offline heuristics.
  - Explicit candidate trigger buttons ("Extract from Resume", "Extract from Saved Resume") in [components/profile/ResumeSection.tsx](file:///d:/Ai%20Projects/job-pilot/components/profile/ResumeSection.tsx).
  - Interactive validation panel [components/profile/ExtractedResumeReview.tsx](file:///d:/Ai%20Projects/job-pilot/components/profile/ExtractedResumeReview.tsx) displaying six section cards with checkmarks and an "Auto-fill & Validate All" action.
  - Non-destructive form merge in [components/profile/ProfileForm.tsx](file:///d:/Ai%20Projects/job-pilot/components/profile/ProfileForm.tsx) applying only validated cards with unique union merges for tags and preserving manual inputs.
  - Preserved candidate persistence boundary (AC-8): form updates remain in review state until the user clicks the primary "Save Profile" button.
  - Verified test checklist in [docs/specs/0003-resume-ai-extraction/verify.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0003-resume-ai-extraction/verify.md).
- **Feature 08: Resume PDF Generation from Profile** is fully implemented, verified, and accepted (Spec [0004-resume-pdf-generation](docs/specs/0004-resume-pdf-generation/index.md)):
  - Server Action rendering via `@react-pdf/renderer` with `renderToBuffer()`.
  - Classic monochrome serif styling in [ClassicMonochromeTemplate.tsx](file:///d:/Ai%20Projects/job-pilot/lib/pdf/ClassicMonochromeTemplate.tsx) calibrated for strict single page ATS compliance.
  - Domain tailored executive summary and bullet points matching target job titles in [lib/ai.ts](file:///d:/Ai%20Projects/job-pilot/lib/ai.ts).
  - Instant zero latency fallback to raw profile text on upstream AI provider errors or timeouts.
  - Direct upload to private InsForge Storage (`resumes/{user_id}/resume.pdf`) and auto-opening preview modal with direct PDF download.
  - All 8 acceptance criteria verified in [verify.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0004-resume-pdf-generation/verify.md).
- **Phase 2 (Profile Page) is 100% Complete!**
- **Next up:**
  - **Phase 3 — Find Jobs Page**: Feature 09 (Find Jobs Page — Full UI).

## Files in Play

| File | Why It Matters |
|------|---------------|
| [docs/specs/0004-resume-pdf-generation/index.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0004-resume-pdf-generation/index.md) | Governing build specification for Feature 08 |
| [docs/specs/0004-resume-pdf-generation/rationale.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0004-resume-pdf-generation/rationale.md) | Architectural rationale and tradeoffs for Feature 08 |
| [docs/specs/0004-resume-pdf-generation/verify.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0004-resume-pdf-generation/verify.md) | Verification checklist with all 8 ACs verified |
| [actions/resume.ts](file:///d:/Ai%20Projects/job-pilot/actions/resume.ts) | Server Actions for resume extraction and PDF generation |
| [lib/pdf/ClassicMonochromeTemplate.tsx](file:///d:/Ai%20Projects/job-pilot/lib/pdf/ClassicMonochromeTemplate.tsx) | React-pdf declarative document template |
| [components/profile/ResumeSection.tsx](file:///d:/Ai%20Projects/job-pilot/components/profile/ResumeSection.tsx) | Generate AI Resume button, error alerts, and preview modal trigger |
| [context/progress-tracker.md](file:///d:/Ai%20Projects/job-pilot/context/progress-tracker.md) | Progress tracker marking Phase 2 complete and Phase 3 next |
| [context/build-plan.md](file:///d:/Ai%20Projects/job-pilot/context/build-plan.md) | 17-feature build plan |

## Next Steps

1. Transition to **Phase 3 (Find Jobs Page)**.
2. Run `/architect feature 9` or build **Feature 09 (Find Jobs Page — Full UI)**.




## Key Constraints

- **Tailwind v4 `@theme` only**: Never use hardcoded hex values or raw Tailwind colors. Use token utilities (`bg-accent`, `text-text-primary`, `bg-surface`, etc.).
- **Server Components by default**: Only use `"use client"` when state, effects, or browser APIs are required.
- **Always update trackers**: Keep `context/progress-tracker.md` and `context/ui-registry.md` current after every feature.
- **Client vs Server separation**: Keep `insforge-client.ts` and `insforge-server.ts` completely isolated.
- **4 Canonical PostHog Events**: `job_search_started`, `job_found`, `profile_completed`, `company_researched`. Keep payloads strictly typed.
