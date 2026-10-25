# 0003. AI Profile Extraction from Resume (Rationale)

## Context

Candidates looking for jobs want a quick onboarding experience. Filling out multi field forms with company names, dates, responsibilities, skills, and degrees is tedious and leads to form abandonment. Candidates already have this information structured inside their resume documents. Enabling automated resume extraction allows candidates to pre-populate their profile in seconds.

However, artificial intelligence extraction can sometimes misinterpret abbreviations, titles, or dates. Applying extracted values blindly without review can overwrite candidate edits or introduce mistakes. Therefore, a balance of speed, visibility, and candidate control is required.

## Options considered

### Option 1: Explicit action with granular review cards and multi provider fallback (Chosen)

Candidate clicks Extract from Resume after uploading. The server runs text parsing and multi provider artificial intelligence with a heuristic fallback. An interactive review panel shows six section cards where the user can toggle individual checks or click Auto-fill and Validate All before saving manually.

**Pros**:
- Candidate has total visibility and control over every field.
- Non destructive merge protects existing manual input.
- Multi provider fallback guarantees zero downtime and zero cost.

**Cons**:
- Requires one review step before saving.

### Option 2: Automatic silent form overwrite

Extracts the resume immediately upon file selection and replaces all form inputs directly without a separate review interface.

**Pros**:
- Single click experience.

**Cons**:
- High risk of silently erasing manual edits.
- Candidate cannot easily see what was extracted versus what was previously entered.

### Option 3: Step by step modal wizard

A multi screen modal dialog that presents personal information, experience, education, and skills across separate screens.

**Pros**:
- High structure.

**Cons**:
- Feels slow and cumbersome for candidates who want a fast auto fill.

## Rationale

Option 1 provides the best combination of candidate control, speed, and safety. Giving the user distinct section review cards with checkmarks matches their mental model of reviewing a document, while the Auto-fill and Validate All action keeps the workflow fast for those wanting immediate completion. Using Groq and Gemini with an offline heuristic engine provides 100% uptime with no API costs.
