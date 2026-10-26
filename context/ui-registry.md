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
- **Container**: `max-w-[1440px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between`
- **Authenticated App Nav Items**: `Dashboard`, `Find Jobs`, `Profile` with Lucide icons (`LayoutDashboard`, `Search`, `User`)
- **Active App Nav Item**: `h-full flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-colors border-b-2 border-accent text-accent`
- **Inactive App Nav Item**: `h-full flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-colors border-b-2 border-transparent text-text-secondary hover:text-text-primary`
- **Authenticated User Actions Container**: `flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-border h-8`
- **User Email Text**: `text-xs text-text-secondary hidden xl:inline-block max-w-[160px] truncate`
- **Sign Out Button**: `inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-text-secondary hover:text-text-primary border border-border bg-surface hover:bg-surface-secondary transition-colors cursor-pointer`
- **Unauthenticated Nav Action Button**: `bg-text-darkest text-surface rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity`

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

### `ProfileAttentionBanner`
- **File**: `components/profile/ProfileAttentionBanner.tsx`
- **Card**: `w-full bg-surface rounded-2xl border border-border p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6`
- **Attention Icon**: `w-5 h-5 text-error shrink-0`
- **Completed Icon**: `w-5 h-5 text-success shrink-0`
- **Heading**: `text-lg font-bold tracking-tight text-text-primary`
- **Description**: `text-xs sm:text-sm text-text-secondary mt-1.5 max-w-xl leading-relaxed`
- **Missing Tag Badge**: `px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wider uppercase bg-error/10 text-error border border-error/20`
- **Progress Ring**: SVG 96x96 circle, radius 38, strokeWidth 9, background `stroke-border-light`, active stroke `stroke-error` (attention) or `stroke-success` (completed), center text `text-xl sm:text-2xl font-bold text-text-primary`

### `ResumeSection`
- **File**: `components/profile/ResumeSection.tsx`
- **Card**: `w-full bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm`
- **Dropzone Area**: `mt-6 border-2 border-dashed border-border-muted rounded-xl p-8 sm:p-10 flex flex-col items-center justify-center text-center bg-surface-secondary/40 hover:bg-surface-secondary/70 transition-all`
- **Cloud Badge**: `w-12 h-12 rounded-full bg-accent-light/50 flex items-center justify-center text-accent mb-3.5`
- **Saved Resume Badge**: `inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border shadow-xs text-xs sm:text-sm font-medium text-text-primary`
- **View Resume Action Button**: `bg-accent hover:bg-accent-dark text-accent-foreground font-semibold px-4 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer`
- **Extract from Resume Button**: `bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 font-semibold px-4 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`
- **Resume PDF Preview Modal**: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200`
- **Resume Modal Container**: `relative w-full max-w-4xl bg-surface border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]`
- **Resume Modal Header**: `flex items-center justify-between px-6 py-4 border-b border-border bg-surface-secondary/40`
- **Resume Modal Iframe Viewer**: `w-full h-[68vh] rounded-xl border border-border bg-surface`
- **Change File Button**: `px-3.5 py-2 bg-surface hover:bg-surface-secondary border border-border rounded-lg text-xs sm:text-sm font-medium text-text-secondary transition-colors cursor-pointer`
- **Select Button**: `mt-4 px-4 py-2 bg-surface hover:bg-surface-secondary border border-border rounded-lg text-xs sm:text-sm font-medium text-text-primary shadow-xs transition-colors cursor-pointer`
- **Tailor Resume Footer Row**: `mt-6 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-border/60`
- **Generate AI Resume Action**: `bg-accent hover:bg-accent-dark text-accent-foreground rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0`
- **Modal Download Action**: `px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-dark text-accent-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs`
- **Modal Open in Tab Action**: `px-3 py-1.5 rounded-lg border border-border hover:bg-surface-secondary text-text-secondary hover:text-text-primary text-xs font-medium flex items-center gap-1.5 transition-colors`
- **Generation Error Banner**: `mt-4 p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs sm:text-sm font-medium flex items-center justify-between gap-2.5`

### `ClassicMonochromeTemplate`
- **File**: `lib/pdf/ClassicMonochromeTemplate.tsx`
- **Document Engine**: `@react-pdf/renderer` single page ATS serif document layout
- **Page Dimensions**: Standard Letter `612 x 792pt` with `36pt` margins (half inch)
- **Primary Typography**: Times-Roman serif body, Times-Bold for headings and titles
- **Candidate Header**: `fontSize: 18pt`, bold, uppercase, letter spacing `0.5pt`, centered
- **Contact Row**: `fontSize: 9pt`, color `#4b5563`, centered, items separated by bullet dots (`•`)
- **Section Heading**: `fontSize: 10pt`, bold, uppercase, bottom hairline divider (`borderBottomWidth: 0.75pt`, `borderBottomColor: #111827`, padding bottom `2pt`, margin bottom `5pt`)
- **Experience Entry**: Two column top row with job title and bold company name on the left, right aligned date range and location, followed by bullet point list
- **Bullet Point Row**: Left indented bullet dot (`width: 10pt`), bullet text `fontSize: 8.5pt`, line height `1.3`, color `#1f2937`
- **Education Entry**: Degree name, institution, graduation year, and optional honors or relevant coursework
- **Skills Category**: Inline bold category prefix with comma separated skill badges (`fontSize: 8.5pt`)
- **Permissive Omission**: Omits sections cleanly when empty without leaving vacant header borders or irregular vertical gaps



### `ProfileForm`
- **File**: `components/profile/ProfileForm.tsx`
- **Card**: `w-full bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm text-left`
- **Section Heading**: `text-base font-bold text-text-primary mb-4`
- **Section Action Button (Add education / Add role)**: `text-sm font-medium text-accent hover:text-accent-dark transition-colors flex items-center gap-1 cursor-pointer`
- **Field Label**: `text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5`
- **Input**: `w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors`
- **Read-only Input**: `w-full bg-surface-secondary border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-secondary cursor-not-allowed select-none`
- **Select Dropdown**: `w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors cursor-pointer pr-10`
- **Skill/Industry Tag**: `bg-surface-secondary border border-border rounded-lg px-3 py-1.5 text-xs font-medium text-text-primary inline-flex items-center gap-1.5`
- **Role / Education Card**: `border border-border rounded-xl p-4 sm:p-5 bg-surface space-y-4 relative`
- **Remove Card Action**: `absolute top-4 right-4 text-text-muted hover:text-error transition-colors p-1 cursor-pointer`
- **Save Profile Button**: `w-full py-3.5 bg-accent hover:bg-accent-dark text-accent-foreground font-semibold rounded-xl transition-all duration-200 shadow-sm text-base flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed`
- **Error Alert Banner**: `p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs sm:text-sm font-medium flex items-center gap-2.5`
- **Warning Alert Banner**: `p-3.5 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs sm:text-sm font-medium flex items-center gap-2.5`
- **Form State Snapshot & Revert Pattern**: Validating a section in review captures a deep snapshot of manual field entries. Unchecking restores the exact pre validation snapshot into form state immediately without database mutations.

### `ExtractedResumeReview`
- **File**: `components/profile/ExtractedResumeReview.tsx`
- **Card**: `w-full bg-surface rounded-2xl border-2 border-accent/40 bg-accent-muted/10 p-6 sm:p-7 shadow-sm transition-all text-left animate-in fade-in duration-300`
- **Extraction Source Badge**: `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/30`
- **Auto-fill & Validate All Action**: `bg-accent hover:bg-accent-dark disabled:opacity-60 text-accent-foreground font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed`
- **Section Validate Check (Active/Validated)**: `bg-success/15 text-success border border-success/30 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer`
- **Section Validate Check (Unvalidated)**: `bg-surface hover:bg-surface-secondary text-text-secondary border border-border inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer`
- **Section Inner Card**: `p-4 rounded-xl bg-surface border border-border flex flex-col justify-between gap-3 shadow-2xs`

### `ProfileContainer`
- **File**: `components/profile/ProfileContainer.tsx`
- **Container**: `flex flex-col gap-6`
- **Coordination**: Connects Server Component profile prefetch with live attention banner percentage recalculations, resume upload selection, AI extraction (`extractResumeProfile`), non-destructive form field merge, and `saveProfile` Server Action submission.
- **AI Extraction Success Alert**: `p-4 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-medium bg-accent/10 border-accent/30 text-text-primary transition-all`
- **AI Extraction Error Alert**: `p-4 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-medium bg-error/10 border-error/20 text-error transition-all`
### `SearchControls`
- **File**: `components/find-jobs/SearchControls.tsx`
- **Card**: `w-full bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-sm`
- **Inputs**: `w-full pl-10 pr-4 py-2.5 sm:py-3 bg-surface-secondary/70 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all`
- **Submit Button**: `bg-accent text-accent-foreground font-semibold px-6 py-2.5 sm:py-3 rounded-xl hover:bg-accent-dark transition-colors flex items-center justify-center gap-2 shadow-sm shrink-0 disabled:opacity-75 cursor-pointer text-sm`
- **Feedback Banner**: `mt-4 bg-success-lightest border border-success/30 text-success-dark font-medium rounded-xl p-3.5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200`

### `JobFilters`
- **File**: `components/find-jobs/JobFilters.tsx`
- **Card**: `w-full bg-surface rounded-2xl border border-border p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4`
- **Quick Text Filter Input**: `w-full pl-10 pr-9 py-2 bg-surface-secondary/60 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all`
- **Dropdown Selects**: `bg-surface-secondary/60 border border-border rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer transition-all`

### `JobsTable`
- **File**: `components/find-jobs/JobsTable.tsx`
- **Card**: `w-full bg-surface rounded-2xl border border-border shadow-sm overflow-hidden`
- **Table Head**: `border-b border-border bg-surface-secondary/40 text-[11px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider`
- **Table Row**: `hover:bg-surface-secondary/50 transition-colors group`
- **Company Initial Box**: `w-10 h-10 rounded-xl border border-border flex items-center justify-center font-bold text-sm shrink-0`
- **Role Title Link**: `font-medium text-text-primary hover:text-accent transition-colors text-sm flex items-center gap-1.5`
- **Match Score Bar Track**: `w-20 sm:w-28 h-2 bg-border-light rounded-full overflow-hidden shrink-0`
- **Match Score Fills**: `bg-success` (score 80+), `bg-info` (score 60 to 79), `bg-warning` (score below 60)
- **Empty State Card**: `w-full bg-surface rounded-2xl border border-border p-12 shadow-sm flex flex-col items-center justify-center text-center`

### `JobsPagination`
- **File**: `components/find-jobs/JobsPagination.tsx`
- **Bar Container**: `w-full bg-surface rounded-2xl border border-border px-5 py-3.5 sm:px-6 sm:py-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4`
- **Page Size Select**: `bg-surface-secondary/70 border border-border rounded-lg px-2 py-1 text-xs font-medium text-text-secondary hover:text-text-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer transition-all`
- **Navigation Buttons**: `px-3 py-1.5 rounded-xl border border-border text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer`
- **Active Page Number Button**: `w-8 h-8 rounded-xl flex items-center justify-center text-xs sm:text-sm border-2 border-accent text-accent bg-accent-muted font-bold shadow-xs`
- **Inactive Page Number Button**: `w-8 h-8 rounded-xl flex items-center justify-center text-xs sm:text-sm border border-border text-text-secondary hover:text-text-primary hover:bg-surface-secondary font-medium`

### `FindJobsContainer`
- **File**: `components/find-jobs/FindJobsContainer.tsx`
- **Layout Container**: `w-full space-y-6`
- **Load More Button**: `inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg text-text-primary bg-surface border border-border hover:bg-surface-hover hover:border-accent/40 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`
- **Coordination**: Connects `/api/agent/find` route handler, same search guard, on demand pagination from web, live database state synchronization with profile defaults, and client filtering across company, title, location, and skills.

### `JobDetailsHeader`
- **File**: `components/find-jobs/details/JobDetailsHeader.tsx`
- **Card**: `bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm`
- **Monogram Box**: `w-14 h-14 rounded-2xl bg-accent-muted border border-border flex items-center justify-center font-bold text-xl text-accent shrink-0 shadow-2xs`
- **Match Score Badge (High)**: `px-4 py-2 rounded-2xl border flex items-center gap-2 shadow-2xs bg-success-lightest border-success/30 text-success-dark`
- **Match Score Badge (Medium)**: `px-4 py-2 rounded-2xl border flex items-center gap-2 shadow-2xs bg-info-lightest border-info/30 text-info-dark`
- **Match Score Badge (Low)**: `px-4 py-2 rounded-2xl border flex items-center gap-2 shadow-2xs bg-warning-lightest border-warning/30 text-warning-dark`
- **Apply CTA Button**: `bg-accent text-accent-foreground font-semibold px-5 py-2.5 rounded-xl hover:bg-accent-dark active:scale-[0.99] transition-all flex items-center gap-2 shadow-sm text-sm shrink-0`

### `JobMetricsGrid`
- **File**: `components/find-jobs/details/JobMetricsGrid.tsx`
- **Card**: `bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-sm`
- **Grid Layout**: `grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6`
- **Metric Icon Box**: `w-10 h-10 rounded-xl bg-surface-secondary border border-border flex items-center justify-center text-text-secondary shrink-0`
- **Metric Label**: `text-[11px] sm:text-xs text-text-muted font-semibold uppercase tracking-wider block`
- **Metric Value**: `text-sm sm:text-base font-bold text-text-primary mt-0.5 block truncate`

### `JobMatchAnalysisCard`
- **File**: `components/find-jobs/details/JobMatchAnalysisCard.tsx`
- **Card**: `bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm`
- **Reason Container**: `p-4 sm:p-5 rounded-xl bg-surface-secondary/60 border border-border mb-6`
- **Matched Skill Pill**: `bg-success-lightest border border-success/30 text-success-dark text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-2xs`
- **Growth Area Skill Pill**: `bg-warning-lightest border border-warning/30 text-warning-dark text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-2xs`

### `JobDescriptionCard`
- **File**: `components/find-jobs/details/JobDescriptionCard.tsx`
- **Card**: `bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm space-y-8`
- **Checkmark Bullet Box**: `w-5 h-5 rounded-md bg-accent-muted flex items-center justify-center text-accent shrink-0 mt-0.5`
- **Bottom Call to Action Banner**: `p-6 rounded-2xl bg-hero-gradient border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`

### `CompanyResearchCard`
- **File**: `components/find-jobs/details/CompanyResearchCard.tsx`
- **Card**: `bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm relative overflow-hidden text-left space-y-8`
- **Active Research CTA Button**: `bg-accent hover:bg-accent-dark text-accent-foreground font-semibold px-5 py-2.5 rounded-xl text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer transition-all shrink-0 shadow-sm active:scale-[0.99]`
- **Refresh Research Action (Idle)**: `inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-surface hover:bg-surface-secondary text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary transition-all shadow-2xs cursor-pointer self-start sm:self-center shrink-0 active:scale-[0.99]`
- **Refresh Research Action (Confirming Re-run)**: `inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border bg-accent/15 border-accent text-accent font-semibold text-xs sm:text-sm transition-all shadow-2xs cursor-pointer self-start sm:self-center shrink-0 active:scale-[0.99]`
- **Error Banner**: `mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs sm:text-sm font-medium flex items-center justify-between gap-3 relative z-10 animate-in fade-in duration-200`
- **Retry Action Button**: `underline hover:opacity-80 cursor-pointer font-semibold text-error`
- **Verified Dossier Badge**: `bg-success-lightest border border-success/30 text-success-dark text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full`
- **Strategic Alignment Card**: `p-4 sm:p-5 rounded-xl bg-surface-secondary/70 border border-border flex items-start gap-3.5`
- **Candidate Edge Card**: `p-5 rounded-xl bg-success-lightest border border-success/30 flex flex-col justify-between`
- **Gap Strategy Card**: `p-5 rounded-xl bg-warning-lightest border border-warning/30 flex flex-col justify-between`
- **Tech Stack Badges**: `bg-surface-secondary border border-border text-text-primary text-xs font-medium px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-2xs`
- **Interview Prep Card**: `p-5 rounded-xl bg-surface-secondary/50 border border-border flex flex-col justify-between`
- **Smart Questions Card**: `p-5 rounded-xl bg-surface-secondary/50 border border-border flex flex-col justify-between`
- **Sources Consulted Footer**: `pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-text-muted`
- **Loading State Box**: `bg-surface rounded-2xl border border-border p-8 sm:p-10 shadow-sm relative overflow-hidden text-left`
- **Loading Spinner Box**: `w-16 h-16 rounded-2xl bg-accent-muted border border-border flex items-center justify-center text-accent mb-6 shadow-sm`

### `StickyApplyBar`
- **File**: `components/find-jobs/details/StickyApplyBar.tsx`
- **Bar Container**: `fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border py-3.5 px-4 sm:px-8 shadow-2xl transition-all duration-300 ease-in-out`
- **Apply Action**: `bg-accent text-accent-foreground font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:bg-accent-dark active:scale-[0.99] transition-all flex items-center gap-2 shadow-sm text-xs sm:text-sm shrink-0`

### `StatsBar`
- **File**: `components/dashboard/StatsBar.tsx`
- **Container**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6`
- **Card**: `bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-sm hover:border-accent/40 transition-colors`
- **Title**: `text-xs sm:text-sm font-medium text-text-muted`
- **Value**: `text-2xl sm:text-3xl font-bold tracking-tight text-text-primary`
- **Positive Trend Badge**: `inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-success-lightest text-success-dark border border-success/30`
- **Subtitle**: `text-xs text-text-muted`

### `RecentActivity`
- **File**: `components/dashboard/RecentActivity.tsx`
- **Card**: `bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between h-full`
- **Header**: `flex items-center justify-between pb-4 border-b border-border`
- **Title**: `text-base sm:text-lg font-bold text-text-primary tracking-tight`
- **View All Action**: `text-xs sm:text-sm font-semibold text-accent hover:text-accent-dark transition-colors inline-flex items-center gap-1`
- **Timeline List**: `space-y-4 pt-2`
- **Indicator Dot**: `w-2.5 h-2.5 rounded-full ring-4 ring-offset-2 ring-offset-surface`
- **Connector Line**: `w-0.5 bg-border`
- **Item Title**: `text-sm font-semibold text-text-primary leading-tight`
- **Item Detail**: `text-xs text-text-secondary leading-snug`
- **Timestamp**: `text-[11px] font-medium text-text-muted shrink-0 pt-0.5`

### `CompanyResearchChart`
- **File**: `components/dashboard/CompanyResearchChart.tsx`
- **Card**: `bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between h-full`
- **Header**: `text-base sm:text-lg font-bold text-text-primary tracking-tight`
- **Subtitle**: `text-xs text-text-muted mt-0.5`
- **Grid Lines**: `stroke-border stroke-dasharray="3 3"`
- **Daily Bars**: `fill-[#61A8FF] rx-1.5`
- **Axis Text**: `text-[11px] fill-text-muted`

### `JobsFoundChart`
- **File**: `components/dashboard/JobsFoundChart.tsx`
- **Card**: `bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between h-full`
- **Header**: `text-base sm:text-lg font-bold text-text-primary tracking-tight`
- **Subtitle**: `text-xs text-text-muted mt-0.5`
- **Curve Path**: `stroke-[#7C5CFC] stroke-[2.5]`
- **Gradient Fill**: `url(#jobsFoundGradient)`
- **Data Marker**: `fill-[#7C5CFC] stroke-surface stroke-2`
- **Grid Lines**: `stroke-border stroke-dasharray="3 3"`

### `MatchScoreDistributionChart`
- **File**: `components/dashboard/MatchScoreDistributionChart.tsx`
- **Card**: `bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between h-full`
- **Header**: `text-base sm:text-lg font-bold text-text-primary tracking-tight`
- **Subtitle**: `text-xs text-text-muted mt-0.5`
- **Distribution Bars**: `fill-[#10B981] rx-2`
- **Grid Lines**: `stroke-border stroke-dasharray="3 3"`
- **Axis Text**: `text-[11px] fill-text-muted`

### `DashboardContainer`
- **File**: `components/dashboard/DashboardContainer.tsx`
- **Props**: `initialData?: DashboardData`, `initialStats?: StatMetric[]`, `initialActivity?: ActivityEvent[]`
- **Wrapper**: `w-full space-y-6`
- **Middle Row Grid**: `grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch`
- **Bottom Row Grid**: `grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch`
- **Wide Chart Column**: `lg:col-span-7 xl:col-span-8`
- **Distribution Chart Column**: `lg:col-span-5 xl:col-span-4`

