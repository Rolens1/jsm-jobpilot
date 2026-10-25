# 0005. Find Jobs Page Full UI: Verification Plan

This checklist outlines the verification procedure to confirm all acceptance criteria for Feature 09 before closing development.

---

### Verification Matrix

| AC | Requirement | Verification Method | Status |
|---|---|---|---|
| **AC-1** | Active navbar indicator on `/find-jobs` | Visual inspection of top navigation bar | Passed |
| **AC-2** | Search controls layout matching mockup | Compare inputs and action button with `context/designs/find-jobs.png` | Passed |
| **AC-3** | Simulated loading pulse and green success banner | Click Find Jobs button and confirm feedback banner appears | Passed |
| **AC-4** | Interactive text filter, score threshold, and sort | Type search queries, switch filter dropdowns, and check table updates | Passed |
| **AC-5** | Structured jobs table columns | Inspect table headers, company names, titles, and formatted dates | Passed |
| **AC-6** | Token based match score progress bar colors | Confirm score ranges 80 to 100 are green, 60 to 79 are blue, under 60 are orange | Passed |
| **AC-7** | Interactive pagination controls | Click page numbers, Next, and Previous, verifying slice bounds | Passed |
| **AC-8** | Navigation links to job details | Inspect row anchor targets and click to verify `/find-jobs/[id]` routing | Passed |

---

### Step by Step Verification Runbook

1. **Navigation and Layout Inspection**:
   - Navigate to `http://localhost:3000/find-jobs`.
   - Verify that the Find Jobs navigation tab displays active purple text and border indicator.
   - Verify that the page container centers with maximum width 1440px and white card backgrounds with standard border tokens.

2. **Search Controls Test**:
   - Inspect Job Title input with search icon and Location input with location pin icon.
   - Click Find Jobs button.
   - Confirm button shows a brief loading spinner for 600 milliseconds.
   - Confirm green success banner appears immediately below the search controls with text "Found 8 jobs and saved 4 strong matches".

3. **Filter and Search Test**:
   - Enter "Stripe" in the "Filter by company or role..." input.
   - Confirm only Stripe positions remain visible in the table.
   - Switch match filter to "High Match (>= 70%)".
   - Confirm only positions with match score 70 and above appear.
   - Select sort dropdown option "Newest".
   - Confirm positions order by date found from most recent to oldest.

4. **Match Score Progress Bar Check**:
   - Inspect rows with match scores 90% or 85% to confirm green track and fill color tokens (`bg-success`).
   - Inspect rows with match scores 74% or 68% to confirm blue track and fill color tokens (`bg-info`).
   - Inspect rows with match scores below 60% to confirm orange track and fill color tokens (`bg-warning`).
   - Confirm no hardcoded hex color codes are present in component markup.

5. **Pagination Test**:
   - Confirm footer row displays "Showing 1 to 6 of 24 results".
   - Click page 2 button.
   - Confirm rows 7 through 12 render and "Showing 7 to 12 of 24 results" updates.
   - Click Next button to navigate to page 3.
   - Click Previous button to return to page 2.

6. **Job Details Link Test**:
   - Click on a role title or company link.
   - Verify the browser targets `/find-jobs/[id]` where `[id]` matches the job item identifier.
