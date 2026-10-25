# Verify: AI Profile Extraction from Resume (spec 0003, updated 2026-10-24)

Steps derived from spec 0003 acceptance criteria. You can run these manually or via verification checks.

## UI and manual steps

- [ ] Navigate to `/profile` with a stored resume or select a PDF file -> Expect "Extract from Resume" and "Extract from Saved Resume" actions visible alongside "View PDF" -> AC-1
- [ ] Select a corrupted or empty document with under 50 characters -> Click "Extract from Resume" -> Expect an alert stating the text could not be extracted -> AC-2
- [ ] Click "Extract from Resume" with a valid resume -> Expect spinner state during parsing, gateway invoking Groq or Gemini with heuristic fallback -> AC-3
- [ ] Observe review interface after parsing -> Expect Extracted Resume Information panel with 6 section cards and "0/6 sections validated" counter -> AC-4
- [ ] Click "Validate" on the Skills card -> Expect button updates to green "Validated", counter displays "1/6", and only skills and industries update in the form -> AC-5
- [ ] Click "Auto-fill & Validate All" button -> Expect all 6 cards update to "Validated" and all form fields receive extracted details -> AC-6
- [ ] Inspect form inputs with existing manual entries -> Expect empty fields filled, new skills and industries merged uniquely without duplicates -> AC-7
- [ ] Check database records before clicking Save Profile -> Expect form fields remain in review state until clicking the primary "Save Profile" button -> AC-8

## Value sourcing checks

- [ ] Server action text extraction -> Expect candidate profile structure produced from Groq or Gemini model JSON, or regex heuristics
- [ ] Section card validation -> Expect updated form React state merged without altering unvalidated sections
- [ ] Primary profile save -> Expect profile row updated in profiles table upon clicking Save Profile

## Acceptance criteria coverage

- AC-1 covered by step 1
- AC-2 covered by step 2
- AC-3 covered by step 3
- AC-4 covered by step 4
- AC-5 covered by step 5
- AC-6 covered by step 6
- AC-7 covered by step 7
- AC-8 covered by step 8
