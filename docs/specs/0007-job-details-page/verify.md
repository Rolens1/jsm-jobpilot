# Verify: Feature 12 Job Details Page Full UI · Spec 0007

_Steps derived from spec 0007 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] Visit `/find-jobs/job-001` while logged in → expect complete job details page with Vercel header, 94% match badge, and quick metrics grid → AC-2, AC-3, AC-4
- [ ] Click "Back to Find Jobs" link at top left → expect navigation back to `/find-jobs` → AC-1
- [ ] Inspect "AI Recruiter Fit Breakdown" card → expect match reason narrative, 5 green matched skill pills, and 1 warning missing skill pill → AC-5
- [ ] Inspect "Role Overview" card → expect role description, key responsibilities with checkmark bullets, requirements, and bottom apply banner → AC-6
- [ ] Inspect "Company Intelligence Dossier" card → expect 4 preview pillars (Mission, Tech Stack, Team & Culture, Interview Prep) with styled "Research Company" CTA → AC-7
- [ ] Scroll down past 240 pixels on the page → expect sticky bottom floating apply bar to slide into view with job title, match score, and Apply Now CTA → AC-8
- [ ] Click "Apply Now" button on header or floating bar → expect original job source link to open in a new tab with `target="_blank"` and `rel="noopener noreferrer"` → AC-3, AC-8
- [ ] Visit `/find-jobs/nonexistent-id-99999` → expect Next.js 404 not found page → AC-9

## Commands
- [ ] `npx tsc --noEmit` → expect exit code 0 and no TypeScript compilation errors → AC-2, AC-3, AC-8
- [ ] `curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/find-jobs/job-001` → expect HTTP 307 temporary redirect to login when unauthenticated → AC-2

## Acceptance-criteria coverage
- AC-1 covered by Back to Find Jobs navigation test
- AC-2 covered by authenticated route loading, database query priority, and TypeScript check
- AC-3 covered by header monogram, title, company, location, match badge, and apply link checks
- AC-4 covered by 4-column quick metrics inspection
- AC-5 covered by AI recruiter fit narrative and green/warning skill pills
- AC-6 covered by role overview, responsibilities, and qualifications layout
- AC-7 covered by company intelligence dossier preview card
- AC-8 covered by sticky floating bottom bar scroll threshold detection and apply link
- AC-9 covered by non-existent ID 404 test
