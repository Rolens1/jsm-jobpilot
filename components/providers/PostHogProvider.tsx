"use client";

import { useEffect } from "react";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import posthog, { initPostHog } from "@/lib/posthog-client";

type PostHogProviderProps = {
  children: React.ReactNode;
};

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    initPostHog();
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
