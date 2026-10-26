# Verify: Language Architecture and Dictionaries · spec 0013 · updated 2026-10-26
_Steps derived from spec 0013 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] Visit homepage `/` -> expect LanguageSwitcher pill in header with EN and FR buttons -> AC-1
- [ ] Click FR in navbar -> expect language state to switch to French and NEXT_LOCALE=fr cookie set -> AC-2
- [ ] Log in as candidate -> land on `/dashboard` with no JOBPILOT_LANG_PROMPTED cookie -> expect onboarding modal to appear -> AC-6
- [ ] In onboarding modal, click Français -> expect modal to dismiss and JOBPILOT_LANG_PROMPTED=1 cookie set -> AC-6
- [ ] Reload `/dashboard` -> expect modal does not appear again and navbar retains FR selection -> AC-6
- [ ] Inspect navbar and modal elements -> confirm all colors and borders use semantic CSS variable tokens -> AC-7

## Commands
- [ ] `npx tsc --noEmit` -> compiles with code 0 and zero type errors -> AC-3
- [ ] `npm run build` -> all 13 routes compile cleanly with Partial Prerendering (`◐`) -> AC-4, AC-5

## Acceptance criteria coverage
- AC-1 covered by step 1
- AC-2 covered by step 2
- AC-3 covered by step 7
- AC-4 covered by step 8
- AC-5 covered by step 8
- AC-6 covered by steps 3, 4, 5
- AC-7 covered by step 6
