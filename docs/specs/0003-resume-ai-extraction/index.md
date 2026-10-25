# 0003. AI Profile Extraction from Resume

**Date**: 2026-10-24
**Status**: In Progress

## Summary

You can extract your complete candidate profile directly from an uploaded resume document with one click. A server action extracts text from the document, calls a fast artificial intelligence model with fallback to local rules, and returns your details for review. You can inspect individual sections, click checkmarks to validate each part, or choose auto fill to populate the entire form before saving.

## Requirements

**User stories**:
- As a job seeker, I want to extract my candidate details from my uploaded resume so that I do not have to type my work history, education, and skills by hand.
- As a job seeker, I want to review extracted data cleanly with section checks so that I can verify accuracy before saving to my profile.

**Acceptance criteria**:
- **AC-1**: When a valid PDF resume is selected or stored in the profile, an explicit Extract from Resume action is available to click.
- **AC-2**: Clicking the extraction action extracts clean text from the PDF on the server, reporting a clear error message if the file is password protected or has fewer than 50 text characters.
- **AC-3**: The server passes text to an artificial intelligence model using a multi provider gateway (Groq primary, Gemini secondary, with deterministic heuristic fallback) returning structured JSON.
- **AC-4**: An interactive review panel displays the extracted data divided into cards (Personal Information, Professional Profile, Skills, Education, Work History, Target Roles) with individual validation checkmarks.
- **AC-5**: Clicking a section validation checkmark applies that specific section to the active profile form without overwriting unrelated fields.
- **AC-6**: Clicking Auto-fill and Validate All populates all form fields with extracted details and marks all cards as validated in the review interface.
- **AC-7**: Form fields merge non destructively (empty fields are filled, new skills and industries are combined uniquely, and existing manual entries are preserved).
- **AC-8**: Form inputs remain in review state until the candidate explicitly clicks the primary Save Profile button at the bottom of the page to persist data to the database.

## Decision

**Chosen option**: Option 1: Explicit candidate triggered extraction with multi provider model gateway, granular section review cards, non destructive form merge, and explicit candidate save.

**Implementation skills**: `api-and-interface-design`, `backend-patterns`, `frontend-ui-engineering`

## Rationale

Reasoning, alternatives considered, and tradeoffs: see rationale.md

## Feature design

**Data model sketch**:
Extracted data maps directly to existing columns in the profiles table in InsForge PostgreSQL:
- full_name (text, nullable)
- phone (text, nullable)
- location (text, nullable)
- current_title (text, nullable)
- experience_level (text: junior, mid, senior, lead)
- years_experience (integer, default 0)
- skills (jsonb array of strings)
- industries (jsonb array of strings)
- work_experience (jsonb array of objects: company, title, startDate, endDate, isCurrent, responsibilities)
- education (jsonb array of objects: degree, field, institution, graduationYear)
- job_titles_seeking (jsonb array of strings)
- remote_preference (text: remote, hybrid, onsite, any)
- salary_expectation (text, nullable)
- preferred_locations (jsonb array of strings)
- linkedin_url (text, nullable)
- portfolio_url (text, nullable)
- work_authorization (text: citizen, permanent_resident, visa_required)

**State transitions**:
1. Idle: Document uploaded or selected, Extract from Resume action visible.
2. Extracting: Spinner active on action button, user interactions disabled on resume card.
3. Review: Extracted data displayed in review panel with six section cards and validation toggles.
4. Form populated: Candidate validates cards or clicks Auto-fill and Validate All, inputs receive values.
5. Saved: Candidate clicks primary Save Profile button, data writes to database.

**API surface**:
| Endpoint / Action | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| extractResumeProfile | Server Action | formData (optional resume file) | success, data, error, extractionMethod | Authenticated session | 401 Unauthorized, 400 Empty or invalid PDF |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| extractResumeProfile | candidate details | Parsed from PDF text via Groq or Gemini model JSON response, or regex heuristics |
| validateSection | updated form field state | Extracted section card values merged into active form React state |
| saveProfile | persisted profile record | React form state submitted via actions/profile.ts to profiles table |

**Key invariants**:
- Candidate credentials and artificial intelligence API keys never leave server environment.
- Empty or scanned documents under 50 characters must fail fast with actionable guidance.
- Validation must never overwrite existing manual fields unless explicitly confirmed by candidate.
- Database persistence occurs only upon candidate clicking Save Profile.

**Security model**:
- Action verifies authenticated user session before downloading stored resume or extracting data.
- User can only extract their own resume stored in their private storage bucket path.

**Configuration required**:
- `GROQ_API_KEY`: Primary ultra fast zero cost model provider
- `GEMINI_API_KEY` or `GOOGLE_API_KEY`: Secondary free model provider
- `OPENROUTER_API_KEY`: Optional community fallback

**Critical test scenarios**:
- Happy path: Valid PDF extracted, cards displayed, Auto-fill clicked, form populated, verifies **AC-1**, **AC-3**, **AC-4**, **AC-6**
- Low character count: Image scan PDF rejected with helpful error, verifies **AC-2**
- Section checkmark: Validating only Skills card updates skills array without touching other fields, verifies **AC-5**, **AC-7**
- Save boundary: Validated fields do not write to database until Save Profile is clicked, verifies **AC-8**

## Build plan

- [x] 1. Configure server side text parser and multi provider model client with deterministic heuristic fallback, satisfies **AC-2**, **AC-3**
- [x] 2. Implement extractResumeProfile Server Action supporting buffer and stored storage file retrieval, satisfies **AC-1**, **AC-2**
- [x] 3. Build ExtractedResumeReview component displaying six section cards with validation toggles and Auto-fill action, satisfies **AC-4**, **AC-5**, **AC-6**
- [x] 4. Wire non destructive merge logic into ProfileContainer and ProfileForm, satisfies **AC-7**, **AC-8**
- [x] 5. End to end test extraction, validation, and profile save with live candidate resume, satisfies **AC-1**, **AC-4**, **AC-8**

## Consequences

**Positive**:
- Candidates complete profile setup in seconds rather than typing entire work history manually.
- Clear review cards give candidates complete visibility and control over what gets applied.
- Multi provider architecture guarantees high availability with zero cost.

**Negative / tradeoffs**:
- Extremely unconventional resume layouts or non standard section headers may require candidate to edit fields manually.
- Complex multi page PDF extraction takes between 1 and 3 seconds depending on network speed.

**Neutral**:
- Extracted values use standard database profile schema without schema migrations.

## Follow-up

- [ ] Add support for optional docx files if candidates request Word format upload
