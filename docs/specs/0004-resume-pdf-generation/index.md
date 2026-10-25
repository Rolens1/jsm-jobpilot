# 0004. Resume PDF Generation from Profile

**Date**: 2026-10-24  
**Status**: Accepted



## Summary

This specification establishes server side resume PDF generation from user profile data. It converts candidate profile records into a single page, ATS friendly PDF document styled in a classic monochrome layout. An AI polish pass tailors the professional summary and bullet points to the candidate target job titles, with an automatic fallback to raw profile data if the AI provider times out. The generated PDF uploads directly to private InsForge storage, updates the profile record, and opens immediately in the in app preview modal.

## Requirements

**User stories**:
- As a job seeker, I want to generate a polished PDF resume from my profile data with a single click, so that I can download and submit an executive ready resume to employers.
- As a candidate with diverse skills, I want the generated resume to emphasize the skills and experiences that align with my target job title, so that my resume is tailored for specific roles.
- As a user, I want the resume generation to succeed reliably even if external AI models are busy or rate limited, so that I always get a usable PDF.

**Acceptance criteria**:
- **AC-1**: Generation trigger is accessible from the Resume section on the profile page, displaying a loading indicator and disabling buttons while processing.
- **AC-2**: Core profile information (full name) is validated before generation. If missing, a clear alert informs the candidate to enter required details before generating.
- **AC-3**: Optional sections with no entries (work experience, education, portfolio, or LinkedIn links) are omitted cleanly without leaving blank headers, empty cards, or awkward gaps.
- **AC-4**: AI enhancement step generates a concise professional summary and polishes experience bullet points using action verbs, specifically prioritizing skills relevant to the candidate target job title (derived from job titles seeking or current title).
- **AC-5**: If the AI model service fails, errors out, or times out, the generator falls back immediately to raw profile text, rendering the PDF without delay so generation never fails.
- **AC-6**: PDF rendering uses react pdf renderer on the server, producing a crisp vector document in a classic monochrome style (serif typography, formal header, clear divider lines, pure black and charcoal palette) calibrated to fit cleanly on a single page.
- **AC-7**: Generated PDF buffer uploads to InsForge Storage in the private resumes bucket at path resumes/{user_id}/resume.pdf with upsert enabled, and updates the profile record with the stored URL.
- **AC-8**: Upon successful generation, the resume preview modal opens automatically displaying the new PDF, with options to download the file directly or view it in a separate browser tab.

## Decision

**Chosen option**: Server side React PDF rendering with targeted AI domain tailoring, classic monochrome layout, and graceful raw text fallback.

We will install `@react-pdf/renderer` and configure it in Next.js server external packages. A server action in `actions/resume.ts` will fetch the current profile, invoke the multi provider LLM gateway to tailor summary and bullets to target job titles, render the document buffer, upload to InsForge Storage, and update `profiles.resume_pdf_url`. The client `ResumeSection` component will handle validation guards, display progress states, and open the preview modal.

## Rationale

See [rationale.md](rationale.md) for context, options considered, and detailed tradeoff analysis.

## Feature design

**Data model sketch**:
No new database tables or column migrations are required. The feature reads from and writes to the existing `profiles` table:
- `profiles.id` (UUID, primary key matching auth user id)
- `profiles.full_name` (Text, required for generation)
- `profiles.email` (Text, from auth user session)
- `profiles.phone` (Text, optional contact line)
- `profiles.location` (Text, optional contact line)
- `profiles.linkedin_url` (Text, optional contact link)
- `profiles.portfolio_url` (Text, optional contact link)
- `profiles.current_title` (Text, used for tailoring context)
- `profiles.job_titles_seeking` (Text array or comma string, primary target domain input)
- `profiles.skills` (Text array, filtered and emphasized based on target title)
- `profiles.experience` (JSONB array of roles, polished by AI)
- `profiles.education` (JSONB array of education items)
- `profiles.resume_pdf_url` (Text, updated with storage path upon successful generation)

**State transitions**:
Client generation state in `ResumeSection.tsx`:
`idle` -> `validating` -> `generating_ai` -> `rendering_pdf` -> `uploading` -> `preview_ready` (or `error`).

**API surface**:
| Surface | Type | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `generateResumePdf` | Server Action | `profileId?: string` (inferred from session) | `{ success: boolean, resumeUrl?: string, error?: string }` | Authenticated user session | 401 Unauthorized, 400 Incomplete Core Data, 500 Storage Failure |
| `GET /api/resume` | Route Handler | None (reads cookie session) | PDF binary stream (`application/pdf`) | Authenticated user session | 401 Unauthorized, 404 Resume Not Found |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| `generateResumePdf` | Candidate name and contact header | `profiles.full_name`, `auth.users.email`, `profiles.phone`, `profiles.location` |
| `generateResumePdf` | Target career direction | `profiles.job_titles_seeking` (first entry) or `profiles.current_title` |
| `generateResumePdf` | Professional summary | AI generated from experience and skills, tailored to target career direction |
| `generateResumePdf` | Polished experience bullets | AI enhanced from `profiles.experience` responsibilities text, or raw text on fallback |
| `generateResumePdf` | Filtered relevant skills | Extracted from `profiles.skills`, sorted by relevance to target job title (top 10 max) |
| `generateResumePdf` | Education credentials | `profiles.education` array (institution, degree, field, graduation year) |
| `generateResumePdf` | Stored PDF URL | Storage upload response (`resumes/{userId}/resume.pdf`) saved to `profiles.resume_pdf_url` |

**Key invariants**:
- Core profile check: full name must not be empty.
- Page budget constraint: the PDF must fit on a single standard Letter page. Content length is budgeted by limiting experience entries to the top 3 and skills to the top 10.
- Integrity: AI polish must never invent fake employers, fabricate dates, or claim non existent degrees.
- Zero network stall: if AI enhancement takes longer than 6 seconds or returns an error, the pipeline immediately falls back to raw profile text rendering.

**Security model**:
- Authenticated user isolation: candidates can only generate and overwrite resumes belonging to their own authenticated user id.
- Server side execution: all AI gateway keys (`GROQ_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) and storage service keys remain on the server.
- Private storage: uploaded resumes remain in the private `resumes` bucket, accessible only through the authenticated streaming proxy `/api/resume`.

**Configuration required**:
- `next.config.ts`: add `serverExternalPackages: ["@react-pdf/renderer"]` to avoid Turbopack server component bundling errors.

**Critical test scenarios**:
- Happy path: candidate with full profile clicks Generate AI Resume; server tailors summary and experience to target job, compiles single page monochrome PDF, saves to storage, and opens modal preview. Verifies **AC-1**, **AC-4**, **AC-6**, **AC-7**, **AC-8**.
- Core validation failure: candidate with empty full name clicks Generate AI Resume; action returns validation error and UI shows alert to complete personal info. Verifies **AC-2**.
- Sparse profile handling: candidate with name and skills but no education or past experience generates resume; optional sections are omitted cleanly without empty visual artifacts. Verifies **AC-3**.
- AI provider failure fallback: simulated AI timeout or rate limit; system cleanly falls back to raw profile text, compiles PDF, and succeeds without user facing failure. Verifies **AC-5**.

## Build plan

The build plan follows a Tracer Bullet approach. We install the rendering engine, build a thin end to end generation pipeline, verify the PDF output, and then wire up the AI tailoring, visual polish, and client preview interaction.

- [x] 1. Install `@react-pdf/renderer` dependency and configure `serverExternalPackages` in `next.config.ts`, satisfies **AC-6**
- [x] 2. Create PDF document template in `lib/pdf/ClassicMonochromeTemplate.tsx` implementing classic serif typography, formal layout, and strict single page dimensions, satisfies **AC-3**, **AC-6**
- [x] 3. Create server action `generateResumePdf` in `actions/resume.ts` validating core profile inputs and returning validation errors when name is missing, satisfies **AC-2**
- [x] 4. Implement AI profile tailoring prompt in `lib/ai.ts` that creates a targeted executive summary and polishes bullet points matching candidate target title, with instant heuristic fallback, satisfies **AC-4**, **AC-5**
- [x] 5. Connect PDF rendering via `renderToBuffer` and upload output buffer to InsForge Storage `resumes/{user_id}/resume.pdf`, updating `profiles.resume_pdf_url`, satisfies **AC-7**
- [x] 6. Wire "Generate AI Resume" button and progress feedback in `components/profile/ResumeSection.tsx`, connecting output directly to the existing PDF preview modal, satisfies **AC-1**, **AC-8**
- [x] 7. Perform manual verification across sparse profiles, target title tailoring, and fallback modes, satisfies **AC-1** through **AC-8**

## Consequences

**Positive**:
- Candidates can produce an executive ready PDF resume without leaving the platform or copying data to third party tools.
- Tailoring to target job titles increases interview relevance.
- Classic monochrome layout provides high ATS readability and print friendly formatting.
- Graceful fallback ensures resume generation never fails when external AI services experience downtime.

**Negative / tradeoffs**:
- Server side PDF generation consumes Node memory during compilation.
- `@react-pdf/renderer` adds package weight to node modules.

**Neutral**:
- Generates a single page document. Candidates with ten plus years of history will have their experience capped to the three most recent roles.

## Follow-up

- [ ] Add multiple resume style templates (such as Modern Single Column with accent colors or Two Column Compact) in a future enhancement.
