# 0002. Profile save logic and resume storage persistence

**Date**: 2026-10-24
**Status**: In Progress

## Summary

This decision wires the profile page form and resume upload to the InsForge database and storage bucket. We use a single Next.js Server Action with multipart form data to handle both structured candidate fields and binary PDF uploads in one seamless submission. This design ensures student friendly completion criteria, reliable storage persistence, and fast prefilled rendering on repeat visits without client side loading waterfalls.

## Requirements

**User stories**:
- As a candidate, I want to save my profile information and resume PDF in one click so that my preferences and background are ready for automated job discovery.
- As a student or entry level candidate, I want my profile marked complete without being forced to invent prior job roles when I have none.
- As a returning user, I want the profile page to open with all my previously saved details already filled in so that I can make quick updates.

**Acceptance criteria**:
- **AC-1**: When the candidate clicks Save Profile with a valid resume PDF selected, the Server Action uploads the file to `resumes/{user_id}/resume.pdf` with overwrite enabled and saves the resulting public URL in `profiles.resume_pdf_url`.
- **AC-2**: When the candidate saves their profile, all text fields, skills arrays, industries arrays, work experience JSON array, and education JSON object persist to the `profiles` table scoped strictly to the authenticated user ID.
- **AC-3**: When all primary required fields (Full Name, Phone, Location, Current Title, Experience Level, at least one Skill, Highest Degree, Institution Name, and Resume URL) are populated, `is_complete` is set to true and the completion indicator calculates one hundred percent. Empty work experience does not block completion.
- **AC-4**: When `is_complete` transitions from false to true for the first time, the Server Action records the `profile_completed` analytics event in PostHog.
- **AC-5**: If the resume storage upload fails, the Server Action still saves the text profile details and returns a partial warning so the candidate can retry the resume file without retyping their inputs.
- **AC-6**: When a returning user visits `/profile`, the Server Component fetches their profile row from InsForge and prefills the form without layout shifts.
- **AC-7**: After a successful save, `revalidatePath('/profile')` runs so the page cache stays fresh across future navigations.

## Decision

**Chosen option**: Option 2: Unified multipart form submission Server Action

We implement a unified Server Action `saveProfile` in `actions/profile.ts` taking `FormData`. It uploads the resume PDF to InsForge Storage at `resumes/{user_id}/resume.pdf` when provided, updates the user row in the `profiles` table, computes completion and missing fields, records initial completion to PostHog, and calls `revalidatePath('/profile')`.

**Implementation skills**: `insforge` (`context/library-docs.md`)

## Rationale

See [rationale.md](rationale.md) for the decision record, options considered, and tradeoffs.

## Feature design

**Data model sketch**:

Table `profiles` (existing columns updated):
- `id` (uuid, primary key, references `auth.users(id)`)
- `full_name` (text, required for complete)
- `email` (text, read only, matches auth account)
- `phone` (text, required for complete)
- `location` (text, required for complete)
- `current_title` (text, required for complete)
- `experience_level` (text, required for complete)
- `years_experience` (integer, default 0)
- `skills` (text array, at least one required for complete)
- `industries` (text array)
- `work_experience` (jsonb array, optional for students)
- `education` (jsonb object with degree, field, institution, year)
- `job_titles_seeking` (text array)
- `remote_preference` (text, default any)
- `salary_expectation` (text, optional)
- `preferred_locations` (text array)
- `linkedin_url` (text, optional)
- `portfolio_url` (text, optional)
- `work_authorization` (text, default citizen)
- `resume_pdf_url` (text, required for complete)
- `is_complete` (boolean, set automatically based on rules)
- `updated_at` (timestamptz, updated automatically via trigger)

**State transitions**:
Profile lifecycle:
`unfilled` (is_complete = false) then `partial` (is_complete = false, completion percentage 20 to 99) then `complete` (is_complete = true, completion percentage 100)

**API surface**:
| Endpoint / Action | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `saveProfile` (`actions/profile.ts`) | Server Action (POST) | `formData: FormData` (all fields + optional resume file) | `{ success: boolean, isComplete: boolean, percentage: number, warning?: string, error?: string }` | Authenticated session cookie | 401 unauthenticated, 400 invalid file type or size, 500 storage or db error |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| `saveProfile` | candidate id | Authenticated session user ID from `createInsforgeServer()` |
| `saveProfile` | resume storage path | Derived format `resumes/${userId}/resume.pdf` |
| `saveProfile` | `resume_pdf_url` | Storage public URL returned by InsForge Storage SDK |
| `saveProfile` | `is_complete` | Evaluated boolean checking all primary required fields |
| `saveProfile` | completion percentage | Weighted formula checking personal, skills, education, and resume |
| `saveProfile` | missing tags | Filtered array of missing required section names |
| `ProfilePage` | prefilled input values | Loaded from `profiles` row in `app/profile/page.tsx` Server Component |

**Key invariants**:
- The user can only view, create, or update the profile matching their authenticated user ID.
- Storage files for user resumes are always isolated to the path `resumes/{user_id}/resume.pdf`.
- If no new resume file is supplied during a profile save, any existing `resume_pdf_url` is preserved and not cleared.
- Uploaded resume files are validated for PDF MIME type and capped at a maximum of 5MB before storage transmission.
- Students and early career seekers are never blocked from reaching one hundred percent completion when work experience is empty.
- An existing resume file in storage is overwritten cleanly using `upsert: true` without creating multiple files.

**Security model**:
- Every query and mutation is authenticated via the HTTP only session cookie using `createInsforgeServer()`.
- Row Level Security policies on `profiles` and `storage.objects` reject any attempt to read or mutate another candidate data.

**Configuration required**:
- `NEXT_PUBLIC_INSFORGE_URL`: Base backend URL (already present)
- `NEXT_PUBLIC_INSFORGE_ANON_KEY`: Backend anon key (already present)

**Critical test scenarios**:
- Happy path: Submitting the form with all required fields and a valid PDF resume saves all columns, uploads the PDF, sets `is_complete` to true, and records the PostHog event, verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**.
- Student path: Submitting with complete personal, education, skills, and resume details but empty work experience marks the profile complete at one hundred percent, verifies **AC-3**.
- Storage failure resilience: Submitting when the storage bucket is unreachable saves the text profile fields, returns a partial warning, and lets the user retry the file later without retyping, verifies **AC-5**.
- Return visit prefill: Opening `/profile` on an authenticated account renders existing database values directly in the HTML inputs without client side loading spinners, verifies **AC-6**.
- Unauthenticated rejection: Calling `saveProfile` without a valid session cookie returns an authentication error, verifies **AC-2**.

## Build plan

- [x] 1. Create profile helper utilities in `lib/profile-utils.ts` to calculate completion percentage and missing fields with student friendly rules, satisfies **AC-3**
- [x] 2. Create the unified `saveProfile` Server Action in `actions/profile.ts` with multipart form parsing, InsForge Storage upload, profiles table update, and PostHog event emission, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-7**
- [x] 3. Update `app/profile/page.tsx` Server Component to fetch existing profile data from InsForge and calculate initial banner values, satisfies **AC-6**
- [x] 4. Wire `components/profile/ResumeSection.tsx` and `components/profile/ProfileForm.tsx` to the `saveProfile` Server Action with loading states, feedback toasts, and live completion recalculation, satisfies **AC-1**, **AC-2**, **AC-5**
- [x] 5. Verify profile save, resume upload, student edge case, return visit prefill, and build compilation with `npm run build`, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-6**

## Consequences

**Positive**:
- Single form submission eliminates orphaned storage files and keeps network calls predictable.
- Student friendly completion rules ensure university candidates and career switchers can discover jobs without artificial barriers.
- Server Component prefilling eliminates layout shift and prevents empty input flicker on returning visits.

**Negative / tradeoffs**:
- Submitting a large PDF together with form data increases the single request duration slightly compared to background uploading.
- If a candidate wants to keep multiple past versions of a resume, this single file overwrite pattern only preserves their current active resume.

**Neutral**:
- Requires passing initial profile data down from the Server Component to the Client Component form.

## Follow-up

- [ ] Ensure Feature 07 (AI Profile Extraction from Resume) can read from the saved `resume_pdf_url` once uploaded.
