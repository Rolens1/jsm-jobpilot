export type Locale = "en" | "fr";

export const LOCALE_COOKIE = "NEXT_LOCALE";
export const PROMPTED_COOKIE = "JOBPILOT_LANG_PROMPTED";
export const DEFAULT_LOCALE: Locale = "en";

export function isValidLocale(value: unknown): value is Locale {
  return value === "en" || value === "fr";
}

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
    close: string;
    retry: string;
  };
  nav: {
    dashboard: string;
    findJobs: string;
    profile: string;
    signOut: string;
    signIn: string;
    startFree: string;
    appName: string;
  };
  onboarding: {
    title: string;
    description: string;
    selectEnglish: string;
    selectFrench: string;
    englishSubtitle: string;
    frenchSubtitle: string;
    dismiss: string;
    confirm: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    statsTotalJobs: string;
    statsAvgMatch: string;
    statsResearched: string;
    statsThisWeek: string;
    recentActivityTitle: string;
    chartsSectionTitle: string;
  };
  findJobs: {
    title: string;
    subtitle: string;
    searchTitleLabel: string;
    searchLocationLabel: string;
    searchButton: string;
    filterAll: string;
    filterHigh: string;
    filterLow: string;
  };
  profile: {
    title: string;
    subtitle: string;
    saveButton: string;
    personalInfo: string;
    professionalInfo: string;
    resumeUpload: string;
  };
  jobDetails: {
    backToJobs: string;
    applyNow: string;
    companyResearch: string;
    matchReasoning: string;
    requiredSkills: string;
  };
}
