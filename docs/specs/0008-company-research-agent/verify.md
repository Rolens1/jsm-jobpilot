# Verify: Feature 13 Company Research Agent · Spec 0008

_Steps derived from spec 0008 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] Open a job details page at `/find-jobs/[id]` (e.g. `/find-jobs/job-001`) → expect Company Intelligence Dossier card with "Research Company" CTA button → AC-7
- [ ] Click "Research Company" → expect button to enter loading state with animated spinner and progress status text → AC-7
- [ ] Wait for research synthesis to complete → expect card to transition smoothly into the full 9 field dossier without page reload → AC-7, AC-8
- [ ] Inspect "Overview & Why This Role" section → expect comprehensive company overview and strategic role rationale → AC-4, AC-8
- [ ] Inspect "Your Edge & Gap Strategy" section → expect candidate strengths highlighted in green and constructive gap strategies in warning style → AC-4, AC-8
- [ ] Inspect "Tech Stack & Team Culture" section → expect technical badges and culture bullets → AC-4, AC-8
- [ ] Inspect "Interview Prep & Smart Questions" section → expect actionable talking points and incisive questions to ask hiring managers → AC-4, AC-8
- [ ] Inspect "Sources Consulted" footer → expect public web sources and research timestamp → AC-4, AC-8
- [ ] Click "Refresh Research" button → expect agent to re-run research and update the stored dossier → AC-8
- [ ] Refresh the page in browser → expect previously researched dossier to load immediately from database without needing to click Research Company again → AC-5, AC-7

## Commands
- [ ] `npx tsc --noEmit` → expect exit code 0 and zero TypeScript compilation errors → AC-1, AC-4, AC-7
- [ ] `curl.exe -s -X POST http://localhost:3000/api/agent/research -H "Content-Type: application/json" -d "{}"` → expect HTTP 401 unauthorized or 400 bad request without credentials → AC-1

## Acceptance criteria coverage
- AC-1 covered by route handler session check and database queries
- AC-2 covered by redirect follower and root domain derivation tests
- AC-3 covered by web extraction engine with graceful job description fallback
- AC-4 covered by 9 field dossier schema validation and grounded career strategist prompt
- AC-5 covered by InsForge database `jobs.company_research` update and `agent_runs` / `agent_logs` logging
- AC-6 covered by PostHog `company_researched` event capture
- AC-7 covered by CompanyResearchCard empty, loading, and completed state transitions
- AC-8 covered by 9 field presentation styling with design tokens and refresh action
