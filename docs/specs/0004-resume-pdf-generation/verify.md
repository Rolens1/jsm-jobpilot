# 0004. Resume PDF Generation: Verification Plan

This checklist outlines the verification procedure to confirm all acceptance criteria for Feature 08 before closing development.

---

### Verification Matrix

| AC | Requirement | Verification Method | Status |
|---|---|---|---|
| **AC-1** | Generation button with progress feedback in ResumeSection | Manual UI test on `/profile`, verify loading spinner and disabled state | Verified |
| **AC-2** | Core validation guard (full name required) | Trigger generation with empty full name, verify alert message appears | Verified |
| **AC-3** | Permissive omission of empty optional sections | Generate resume with empty education or experience, confirm no empty boxes or gaps in PDF | Verified |
| **AC-4** | AI tailored summary and role specific bullet points | Generate resume with target title set (e.g. Software Engineer), verify AI emphasizes relevant skills | Verified |
| **AC-5** | Graceful fallback to raw profile text on AI error | Simulate AI error/timeout, verify PDF renders successfully using raw profile text | Verified |
| **AC-6** | Classic monochrome vector PDF layout | Verify serif typography, black divider rules, clear hierarchy, single page budget | Verified |
| **AC-7** | Upload to InsForge Storage and database update | Confirm PDF is saved in `resumes/{user_id}/resume.pdf` and `profiles.resume_pdf_url` is updated | Verified |
| **AC-8** | Automatic preview modal opening and direct download | Verify PDF preview opens immediately upon completion with working download button | Verified |

---

### Step by Step Verification Runbook

1. **Core Validation Check**:
   - Clear the Full Name field in profile form.
   - Click "Generate Resume" in the Resume section.
   - Confirm an alert banner or toast appears asking for required personal information, and no generation request is made.

2. **Full Generation Run**:
   - Fill in Full Name, contact details, target job title ("Full Stack Developer"), two work experiences, education, and five skills.
   - Click "Generate Resume".
   - Confirm button displays loading spinner and "Generating AI Resume...".
   - Confirm modal opens automatically upon completion displaying the compiled PDF document.
   - Confirm document uses classic serif typography, clean section dividers, and fits on a single page.
   - Confirm summary and bullet points emphasize full stack development tools and action verbs.

3. **Sparse Profile Run**:
   - Remove education entries and portfolio URL.
   - Click "Generate Resume".
   - Confirm PDF renders cleanly with only contact info, summary, work experience, and skills, with no blank cards or missing headers.

4. **Storage and Persistence Check**:
   - Check InsForge database and storage console or API.
   - Confirm `profiles.resume_pdf_url` contains the valid storage path.
   - Test downloading the file directly from the preview modal and opening in a PDF reader.

5. **Fallback Simulation**:
   - Test with offline or invalid AI credentials.
   - Confirm system falls back to direct profile text rendering and creates a valid PDF without crashing.
