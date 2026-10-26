# 0013. Language Architecture and Dictionaries

**Date**: 2026-10-26  
**Status**: Proposed  

## Summary

This specification defines the architecture, data contract, and component structure for Feature 18 (Language Architecture, Dictionaries, and Onboarding Preference). We establish a bilingual localization foundation for JobPilot in English and French. The implementation guarantees zero route disruption, preserving all existing URLs while synchronizing language preference through fast browser cookies. The system delivers type safe TypeScript dictionaries, a sleek segmented pill in the navigation bar, and an elegant first visit onboarding prompt for candidates.

## Requirements

**User stories**:
- As an English or French speaking candidate, I want to use JobPilot in my preferred language so that the interface feels natural and clear.
- As a candidate on the application, I want to switch between English and French at any time using a clear control in the top navigation bar with instant visual feedback.
- As a new candidate signing into the app for the first time, I want a welcoming prompt that asks my language preference once and remembers it without getting in the way.
- As an engineer maintaining JobPilot, I want compile time type safety across all translation keys so that missing translations and typos are caught before runtime.

**Acceptance criteria**:
- **AC-1**: The top navigation bar displays a segmented pill toggle showing EN and FR with the active language highlighted, accessible across both mobile and desktop viewports.
- **AC-2**: Clicking the language toggle sets the `NEXT_LOCALE` cookie (`en` or `fr`) with a one year expiration, updates the client language context, and refreshes the current view without a full browser reload or URL changes.
- **AC-3**: Translation dictionaries are structured as native TypeScript files (`dictionaries/en.ts` and `dictionaries/fr.ts`) conforming to a shared `Dictionary` type contract to guarantee compile time type safety.
- **AC-4**: A server utility (`lib/i18n.ts`) resolves the current locale from cookies or the `Accept-Language` header and loads the appropriate dictionary for Server Components.
- **AC-5**: A client provider (`components/providers/LanguageProvider.tsx`) wraps the application layout, exposing `locale`, `t(key)`, and `setLocale(locale)` to interactive client components.
- **AC-6**: A first visit onboarding modal dialog renders for authenticated candidates whose `JOBPILOT_LANG_PROMPTED` cookie is not yet set. Clicking English or Français, or dismissing the modal, sets the cookie so the prompt never displays again.
- **AC-7**: All switcher and onboarding components strictly adhere to JobPilot design tokens from `app/globals.css` with zero raw color classes or hardcoded hex codes.

## Decision

**Chosen option**: Cookie first zero route disruption with native TypeScript dictionaries.

We reject subpath URL rewrites like `/en/dashboard` because they disrupt existing bookmarks, require complicated middleware routing logic, and break partial prerendering. Instead, we keep all routes unchanged. Locale resolution reads the `NEXT_LOCALE` cookie, falling back to browser header detection, and defaulting to `en`. Dictionaries are authored in TypeScript with strict compile time checking rather than untyped external JSON files. Language preference lives in browser cookies with zero database migrations, ensuring instant sub millisecond access for both visitors and authenticated candidates.

**Implementation skills**: Next.js 16 App Router, React 19 Context and Hooks, TypeScript Type Contracts, Tailwind CSS v4 design tokens.

## Value Sourcing

| Value | Source | Fallback |
|---|---|---|
| `locale` | `NEXT_LOCALE` cookie | `Accept-Language` header starting with `fr` -> `fr`, else `en` |
| `hasPrompted` | `JOBPILOT_LANG_PROMPTED` cookie | Not set -> prompt modal triggers on first authenticated visit |
| `dictionary` | Loaded from `dictionaries/en.ts` or `dictionaries/fr.ts` | Complete English dictionary if any key is missing |

## Rationale

Reasoning and alternatives: see [rationale.md](file:///d:/Ai%20Projects/job-pilot/docs/specs/0013-language-architecture/rationale.md).

## Feature Design

### 1. Dictionary Architecture and Contracts

We define dictionary interfaces in `types/i18n.ts`:

```typescript
export type Locale = "en" | "fr";

export interface Dictionary {
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    back: string;
    apply: string;
    error: string;
    success: string;
  };
  nav: {
    dashboard: string;
    findJobs: string;
    profile: string;
    signOut: string;
    signIn: string;
  };
  onboarding: {
    title: string;
    description: string;
    selectEnglish: string;
    selectFrench: string;
    dismiss: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    statsTotalJobs: string;
    statsAvgMatch: string;
    statsResearched: string;
    statsThisWeek: string;
  };
}
```

Both `dictionaries/en.ts` and `dictionaries/fr.ts` implement `Dictionary` strictly.

### 2. Server and Client Access Patterns

```
HTTP Request
  │
  ├─► read `NEXT_LOCALE` cookie (or Accept-Language header)
  │
  ├─► Server Components:
  │     const locale = await getLocale();
  │     const dict = getDictionary(locale);
  │
  └─► Root Layout Client Context:
        <LanguageProvider initialLocale={locale} initialDict={dict}>
          <Navbar>
            <LanguageSwitcher />
          </Navbar>
          {children}
          <LanguageOnboardingModal />
        </LanguageProvider>
```

### 3. Server Actions and State Mutation

`actions/locale.ts` exposes:
- `setLocaleAction(locale: Locale)`: Sets `NEXT_LOCALE` cookie with `path=/; max-age=31536000; SameSite=Lax`. Calls `revalidatePath('/')`.
- `dismissLanguagePromptAction()`: Sets `JOBPILOT_LANG_PROMPTED=1` with `path=/; max-age=31536000; SameSite=Lax`.

### 4. Navigation Bar Switcher (`LanguageSwitcher.tsx`)

A segmented pill control embedded in `components/layout/Navbar.tsx`:
- Container: `inline-flex items-center p-0.5 rounded-lg bg-surface-secondary border border-border`
- Inactive segment: `px-2 py-1 text-xs font-medium text-text-secondary hover:text-text-primary rounded-md transition-all cursor-pointer`
- Active segment: `px-2 py-1 text-xs font-semibold text-accent-foreground bg-accent rounded-md shadow-2xs transition-all`

### 5. First Visit Onboarding Modal (`LanguageOnboardingModal.tsx`)

Rendered when `hasPrompted` is false and user is authenticated:
- Backdrop: `fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4`
- Card: `bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-xl`
- Two large choice cards for English and Français with native flags and welcome greetings.
- Choosing either option calls `setLocaleAction`, sets `JOBPILOT_LANG_PROMPTED=1`, and closes smoothly.
- Close icon button dismisses and marks prompted without forcing a choice.

## Build Plan

- **Step 1 (Contracts and Dictionaries)**: Create `types/i18n.ts`, `dictionaries/en.ts`, and `dictionaries/fr.ts` with complete type definitions covering common, nav, onboarding, and dashboard domains. Satisfies AC-3.
- **Step 2 (Server and Client Infrastructure)**: Build `lib/i18n.ts` for server locale detection and dictionary retrieval, plus `actions/locale.ts` for cookie setting actions. Satisfies AC-2 and AC-4.
- **Step 3 (Client Provider)**: Create `components/providers/LanguageProvider.tsx` supplying `useLocale()` and `useTranslation()`, and mount in `app/layout.tsx`. Satisfies AC-5.
- **Step 4 (Navbar Switcher)**: Build `components/layout/LanguageSwitcher.tsx` and integrate into `components/layout/Navbar.tsx` for desktop and mobile viewports. Satisfies AC-1 and AC-7.
- **Step 5 (Onboarding Modal)**: Build `components/onboarding/LanguageOnboardingModal.tsx` and mount inside the authenticated layout. Satisfies AC-6.
- **Step 6 (Verification)**: Verify TypeScript compile passes with zero errors, confirm cookie setting in browser devtools, test locale switching, and verify responsive design. Satisfies AC-1 through AC-7.

## Security Considerations

- The `locale` value is strictly validated against the allowed union `"en" | "fr"`. Any other string is discarded and defaults to `"en"`, preventing cookie injection attacks.
- Cookies are configured with `SameSite=Lax` and `Path=/`.
- Client translation lookups use object properties; no dynamic evaluation (`eval`) or arbitrary HTML injection is permitted.

## Performance Considerations

- Dictionaries are static TypeScript objects bundled directly, requiring zero runtime file reading or network requests.
- Cookie reading in Server Components runs synchronously in memory without database queries.
- Next.js 16 Partial Prerendering remains intact because route URLs do not change.
