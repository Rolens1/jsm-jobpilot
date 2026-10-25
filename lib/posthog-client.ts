import posthog from "posthog-js";

const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ||
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let isInitialized = false;

/**
 * Initializes PostHog in the browser.
 */
export function initPostHog(): void {
  if (typeof window === "undefined" || isInitialized) {
    return;
  }

  if (!POSTHOG_KEY) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[PostHog] NEXT_PUBLIC_POSTHOG_KEY or NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is missing. Event tracking is paused.",
      );
    }
    return;
  }

  const host =
    POSTHOG_HOST === "https://us.i.posthog.com" ? "/ingest" : POSTHOG_HOST;

  posthog.init(POSTHOG_KEY, {
    api_host: host,
    ui_host: "https://us.posthog.com",
    capture_pageview: false, // manual pageview tracking as required by project spec
    disable_session_recording: true,
    person_profiles: "identified_only",
    debug: process.env.NODE_ENV === "development",
  });

  isInitialized = true;
}

/**
 * Identifies the user in PostHog.
 */
export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  initPostHog();
  posthog.identify(userId, properties);
}

/**
 * Resets the current user session on logout.
 */
export function resetUser(): void {
  if (typeof window === "undefined") return;
  posthog.reset();
}

/**
 * Type-safe PostHog project events as defined in code-standards.md
 */
export type PostHogEvents = {
  job_search_started: {
    userId: string;
    jobTitle: string;
    location: string;
  };
  job_found: {
    userId: string;
    source: string;
    matchScore: number;
  };
  profile_completed: {
    userId: string;
  };
  company_researched: {
    userId: string;
    jobId: string;
    company: string;
  };
};

/**
 * Client-side event tracking helpers strictly matching project specifications.
 */
export function trackJobSearchStarted(
  props: PostHogEvents["job_search_started"],
): void {
  if (typeof window === "undefined") return;
  initPostHog();
  posthog.capture("job_search_started", props);
}

export function trackJobFound(props: PostHogEvents["job_found"]): void {
  if (typeof window === "undefined") return;
  initPostHog();
  posthog.capture("job_found", props);
}

export function trackProfileCompleted(
  props: PostHogEvents["profile_completed"],
): void {
  if (typeof window === "undefined") return;
  initPostHog();
  posthog.capture("profile_completed", props);
}

export function trackCompanyResearched(
  props: PostHogEvents["company_researched"],
): void {
  if (typeof window === "undefined") return;
  initPostHog();
  posthog.capture("company_researched", props);
}

export default posthog;
