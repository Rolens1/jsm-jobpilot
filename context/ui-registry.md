# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

### `Navbar`
- **File**: `components/layout/Navbar.tsx`
- **Classes**: `h-16 w-full bg-surface border-b border-border sticky top-0 z-50`
- **Container**: `max-w-[1440px] mx-auto h-full px-6 flex items-center justify-between`
- **Active Nav Item**: `text-sm font-medium text-accent`
- **Inactive Nav Item**: `text-sm font-medium text-text-dark hover:text-accent transition-colors`
- **Action Button**: `bg-text-darkest text-surface rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity`

### `Footer`
- **File**: `components/layout/Footer.tsx`
- **Classes**: `w-full bg-surface border-t border-border mt-auto`
- **Container**: `max-w-[1440px] mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4`
- **Links**: `text-sm text-text-secondary hover:text-text-primary transition-colors`

### `Hero`
- **File**: `components/homepage/Hero.tsx`
- **Card**: `w-full bg-hero-gradient rounded-3xl border border-border pt-16 sm:pt-20 pb-8 sm:pb-12 px-4 sm:px-8 text-center overflow-hidden`
- **Heading**: `text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary max-w-4xl mx-auto leading-[1.15]`
- **Subheading**: `text-base sm:text-lg text-text-secondary max-w-2xl mx-auto mt-5 leading-relaxed`
- **Primary CTA**: `bg-text-darkest text-surface rounded-lg px-6 py-3 text-sm font-medium flex items-center gap-2 shadow-sm hover:opacity-90 transition-opacity`
- **Secondary CTA**: `bg-surface text-text-primary border border-border rounded-lg px-6 py-3 text-sm font-medium shadow-sm hover:bg-surface-secondary transition-colors`
- **Dashboard Preview Wrapper**: `relative rounded-2xl overflow-hidden shadow-2xl border border-border/80 bg-surface`

### `Features`
- **File**: `components/homepage/Features.tsx`
- **Card**: `w-full bg-surface rounded-2xl border border-border shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-2`
- **Heading**: `text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-8 sm:mb-10`
- **Active Feature Item**: `border-l-2 border-accent pl-4 py-1`
- **Feature Title**: `text-base font-semibold text-text-primary`
- **Feature Description**: `text-sm text-text-secondary mt-1.5 leading-relaxed`
- **Graphic Container**: `bg-surface-secondary/50 p-6 sm:p-10 flex items-center justify-center`
- **Image Mockup Card**: `relative w-full max-w-lg rounded-xl overflow-hidden shadow-md border border-border bg-surface`

### `Testimonial`
- **File**: `components/homepage/Testimonial.tsx`
- **Card**: `w-full bg-surface rounded-2xl border border-border shadow-sm p-8 sm:p-16 text-center`
- **Eyebrow**: `text-xs font-semibold tracking-[0.2em] uppercase text-accent`
- **Quote**: `text-2xl sm:text-3xl font-medium text-text-primary max-w-3xl mx-auto mt-6 mb-8 leading-snug`
- **Avatar**: `w-11 h-11 rounded-xl object-cover border border-border`

### `BottomCta`
- **File**: `components/homepage/BottomCta.tsx`
- **Card**: `w-full bg-hero-gradient rounded-3xl border border-border py-16 sm:py-24 px-6 sm:px-12 text-center overflow-hidden`
- **Heading**: `text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary max-w-2xl mx-auto leading-tight`
- **Subtitle**: `text-base text-text-secondary max-w-xl mx-auto mt-4 mb-8 leading-relaxed`

### `LoginCard`
- **File**: `components/auth/LoginCard.tsx`
- **Card**: `w-full max-w-[420px] bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm`
- **Heading**: `text-2xl font-bold text-text-primary tracking-tight`
- **Subtitle**: `text-sm text-text-secondary mt-2`
- **OAuth Button**: `w-full h-11 px-4 bg-surface hover:bg-surface-secondary border border-border text-text-primary text-sm font-medium rounded-lg flex items-center justify-center gap-3 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer`
- **Error Banner**: `mb-6 p-3.5 rounded-lg bg-error/10 border border-error/20 flex items-start gap-2.5 text-sm text-error`
- **Terms Footnote**: `text-xs text-text-muted leading-relaxed`

### `AuthLayoutContainer`
- **Usage**: Fullscreen standalone centered viewport for auth/onboarding (`/login`, `/callback`)
- **Outer Wrapper**: `min-h-screen w-full bg-background flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden`
- **Backdrop Mesh**: `absolute inset-0 bg-hero-gradient pointer-events-none opacity-60`
- **Content Stack**: `relative z-10 w-full flex flex-col items-center`
- **Branded Logo Header**: `mb-8 flex items-center gap-2 hover:opacity-90 transition-opacity`

### `SignOutButton`
- **File**: `components/auth/SignOutButton.tsx`
- **Button**: `inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg text-text-secondary hover:text-text-primary border border-border bg-surface hover:bg-surface-secondary transition-colors cursor-pointer disabled:opacity-50`

### `DashboardPlaceholder`
- **File**: `app/dashboard/page.tsx`
- **Card**: `w-full bg-surface rounded-2xl border border-border p-8 sm:p-12 shadow-sm flex flex-col items-center text-center`
- **Status Badge**: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold`
- **Primary Action**: `bg-text-darkest text-surface rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity`

### `ProfilePlaceholder`
- **File**: `app/profile/page.tsx`
- **Card**: `w-full bg-surface rounded-2xl border border-border p-8 sm:p-12 shadow-sm flex flex-col items-center text-center`
- **Verified Badge**: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-semibold`
- **Detail List**: `w-full max-w-md p-5 rounded-xl bg-surface-secondary border border-border text-left space-y-3`

### `EventTrackingCard`
- **File**: `components/dashboard/EventTrackingCard.tsx`
- **Card**: `w-full bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm text-left mt-8`
- **Header**: `flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border`
- **Channel Switcher**: `flex items-center bg-surface-secondary p-1 rounded-lg border border-border text-xs`
- **Active Channel Button**: `bg-surface text-accent shadow-xs font-semibold`
- **Event Action Button**: `p-4 rounded-xl border border-border bg-surface hover:bg-surface-secondary transition-all text-left flex flex-col justify-between group cursor-pointer disabled:opacity-50`
- **Status Toast**: `mt-4 p-3 rounded-lg bg-success-lightest border border-success-light flex items-center gap-2 text-xs text-success-dark`
- **Feed Row**: `p-3 rounded-lg bg-surface-secondary border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs`

### `ProfileCompleteTracker`
- **File**: `components/profile/ProfileCompleteTracker.tsx`
- **Container**: `mt-6 w-full max-w-md p-4 rounded-xl border border-border bg-surface-secondary flex items-center justify-between text-xs text-left`
- **Trigger Button**: `px-3 py-1.5 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0`

### `PostHogProvider`
- **File**: `components/providers/PostHogProvider.tsx`
- **Purpose**: Client provider wrapping root layout to initialize PostHog in the browser.



