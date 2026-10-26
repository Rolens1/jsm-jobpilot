# 0013. Language Architecture and Dictionaries: Rationale and Alternatives

**Date**: 2026-10-26  
**Status**: Proposed  

## Context

Phase 6 introduces bilingual internationalization in English and French across the entire JobPilot platform. Feature 18 is the foundational architectural milestone of this phase. It establishes how translations are stored, how the candidate language preference is resolved on both server and client, how the user toggles language, and how new candidates are welcomed on their first visit.

## Options Considered

### Option 1: URL Subpath Routing like /en/... and /fr/... (Rejected)

In this approach, every route in the Next.js App Router is nested inside an optional or mandatory `[locale]` folder (for example `app/[locale]/dashboard/page.tsx`).

*Why rejected*:
- Requires modifying the folder structure of every single existing page in the project.
- Breaks existing links, bookmarks, and OAuth callback redirection paths.
- Requires complex middleware rewrites to handle unprefixed URLs, which causes complications with Next.js 16 Partial Prerendering.
- Incompatible with the project requirement for zero route disruption.

### Option 2: Heavy Third Party Internationalization Libraries like next-intl or react-i18next (Rejected)

In this approach, an external framework library is installed to manage localization routing, formatting, and translation bundles.

*Why rejected*:
- Adds external dependencies and bundle weight to both client and server code.
- Often causes React 19 compatibility hurdles and peer dependency warnings with Next.js 16 canary or current builds.
- JobPilot only requires English and French across a well defined set of screens, making a lightweight custom TypeScript dictionary solution much simpler, faster, and more transparent.

### Option 3: Storing Language in Database Profiles Table (Considered and Deferred)

In this approach, candidate language preference is saved to a new column in the InsForge PostgreSQL `profiles` table in addition to cookies.

*Why deferred*:
- The engineer requested keeping preference strictly in browser cookies to eliminate database schema changes and avoid migrations.
- Cookies provide instant, sub millisecond availability to both Server Components and Client Components without waiting for database queries.
- If cross device synchronization is desired in the future, it can easily be layered on top by persisting the cookie value to `profiles` during regular profile saves.

### Option 4: Cookie First Zero Route Disruption with Native TypeScript Dictionaries (Recommended)

In this approach, we keep all Next.js routes exactly as they are today. The active locale (`en` or `fr`) is read from the `NEXT_LOCALE` cookie, with a fallback to the `Accept-Language` header on first visit. Translation dictionaries are authored as type safe TypeScript files in `dictionaries/`. A segmented pill in the top navigation bar toggles the cookie and updates the interface without a full page reload.

*Why chosen*:
- 100% zero route disruption: no paths or folders change.
- Strict compile time type safety: TypeScript immediately catches any missing translation keys or misspelled identifiers.
- Zero database migrations required: entirely self contained in browser cookies.
- Flawless compatibility with Next.js 16 Partial Prerendering and Server Components.
- Delivers an intuitive segmented control in the navigation bar and a welcoming onboarding modal.

## References

No external references required. This design is built on standard Next.js 16 App Router patterns and React 19 Context.
