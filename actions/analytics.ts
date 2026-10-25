"use server";

import { captureServerEvent } from "@/lib/posthog-server";
import { createInsforgeServer } from "@/lib/insforge-server";
import type { PostHogEvents } from "@/lib/posthog-client";

export async function trackServerAnalyticsEvent<K extends keyof PostHogEvents>(
  event: K,
  properties: PostHogEvents[K],
): Promise<{ success: boolean; error?: string }> {
  try {
    const insforge = await createInsforgeServer();
    const { data } = await insforge.auth.getCurrentUser();
    const userId = data?.user?.id || properties.userId || "anonymous_user";

    await captureServerEvent(userId, event, {
      ...properties,
      userId,
    });

    return { success: true };
  } catch (error) {
    console.error(`[actions/analytics] failed to track '${event}':`, error);
    return { success: false, error: "Failed to capture server event" };
  }
}
