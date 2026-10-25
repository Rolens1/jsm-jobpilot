# Rationale: 0002 Profile save logic and resume storage persistence

## Context

Candidates need to save their personal information, professional background, education, job preferences, and resume file so the JobPilot agent can match opportunities and research companies accurately. Feature 05 delivered the complete visual interface with mock data. Now we must implement the persistence layer that saves these candidate details into the PostgreSQL `profiles` table and uploads uploaded resumes to the private `resumes` storage bucket.

Several forces shape this decision. First, candidates should not lose typed data if a network glitch interrupts a large resume file upload. Second, students and early career candidates who have never held a corporate job should not be blocked from achieving a complete profile simply because their work history is empty. Third, returning candidates must see their saved data immediately upon loading the profile page without layout shifts or secondary spinners. Finally, the solution must strictly follow our project rules by performing data mutations through Server Actions and data reads in Server Components.

## Options considered

### Option 1: Multi request decoupled save (upload PDF first, then save JSON)

Upload the resume PDF via a separate upload endpoint as soon as the file is chosen, storing the URL in temporary client state. When the user clicks Save Profile, submit only a JSON payload to the Server Action.

**Pros**:
- Keeps the Server Action payload purely JSON with smaller payload size.
- Upload progress bar can be tracked during the initial file selection.

**Cons**:
- Can create orphaned files in storage if the candidate uploads a resume but leaves the page without clicking Save Profile.
- Requires managing two independent network calls and error states on the client.

### Option 2: Unified multipart form submission Server Action (Chosen)

Submit all profile fields and the optional resume PDF file together in one multipart `FormData` payload to a single `saveProfile` Server Action in `actions/profile.ts`.

**Pros**:
- Provides a clean single submission flow matching user expectation.
- Prevents orphaned storage files because file upload and profile row update happen together.
- Handles partial failures gracefully by saving text fields even if the file upload fails.

**Cons**:
- Slightly larger payload size during the single submit action when a PDF is included.

## Rationale

A unified Server Action offers the cleanest developer experience and candidate experience. It eliminates orphaned storage objects because files are only committed when the candidate confirms their save action. If the storage upload encounters a timeout or size limit, the action catches that failure specifically, saves all valid text information, and returns an actionable warning notice. This protects students and job seekers from ever losing extensive text input. Furthermore, prefilling via the Server Component directly aligns with Next.js 16 conventions, avoiding unnecessary client side waterfalls.

## References

- [InsForge Documentation](https://pprn26i7.us-east.insforge.app)
- [PostHog Event Specification](file:///d:/Ai%20Projects/job-pilot/lib/posthog-client.ts)
