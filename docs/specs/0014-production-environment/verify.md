# Verify: Production Environment and Secrets Architecture · spec 0014 · updated 2026-10-26
_Steps derived from spec 0014 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## Commands
- [ ] `npx tsc --noEmit` → completes with 0 errors → AC-1
- [ ] `npm run build` → runs Next.js 16 Turbopack build, executes `validateEnv()` in `next.config.ts`, passes with 0 errors → AC-1, AC-2, AC-7
- [ ] `node scripts/sync-env.mjs production .env.example --dry-run` → parses non empty example keys, confirms Vercel CLI version, reports zero crashes → AC-6
- [ ] `git check-ignore -v scripts/sync-env.mjs` → confirms `.gitignore` ignores sync tooling from GitHub → AC-6
- [ ] `git status --short` → confirms `.env.example` is tracked while secret files remain untracked → AC-4, AC-6

## Configuration and Documentation
- [ ] Inspect `.env.example` → confirms all 16 environment variables across all 7 functional domains with documentation and placeholders → AC-4
- [ ] Inspect `docs/deployment/insforge-setup.md` → confirms canonical redirect URLs, CORS origins, and RLS storage policies → AC-5
- [ ] Inspect `lib/env.ts` → confirms fail fast rules on missing InsForge URLs and graceful degradation warnings on missing AI keys → AC-2, AC-3

## Acceptance criteria coverage
- AC-1: covered by `npx tsc --noEmit` and `lib/env.ts` schema
- AC-2: covered by `lib/env.ts` required string validation on InsForge URL and anon key
- AC-3: covered by optional schema keys and graceful degradation notice logs
- AC-4: covered by `.env.example` documentation across all 7 domains
- AC-5: covered by `docs/deployment/insforge-setup.md` dashboard configuration guide
- AC-6: covered by `scripts/sync-env.mjs` dry run test and `.gitignore` quarantine
- AC-7: covered by `next.config.ts` gatekeeper execution during production build
