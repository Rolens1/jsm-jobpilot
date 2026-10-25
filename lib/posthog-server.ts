import { PostHog } from "posthog-node";
import type { PostHogEvents } from "./posthog-client";

const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ||
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ||
  "";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

/**
 * Creates a server-side PostHog client with immediate delivery settings.
 */
export const createPostHogServer = (): PostHog =>
  new PostHog(POSTHOG_KEY, {
    host: POSTHOG_HOST,
    flushAt: 1, // send immediately
    flushInterval: 0, // no batching — Next.js functions are short-lived
  });

/**
 * Helper to capture server-side events and guarantee clean shutdown.
 */
export async function captureServerEvent<K extends keyof PostHogEvents>(
  distinctId: string,
  event: K,
  properties: PostHogEvents[K],
): Promise<void> {
  const posthog = createPostHogServer();
  try {
    posthog.capture({
      distinctId,
      event,
      properties: {
        ...properties,
      },
    });
  } catch (error) {
    console.error(`[PostHogServer] failed to capture event '${event}':`, error);
  } finally {
    await posthog.shutdown();
  }
}
