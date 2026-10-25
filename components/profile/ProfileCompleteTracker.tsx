"use client";

import { useState } from "react";
import { trackProfileCompleted } from "@/lib/posthog-client";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

type Props = {
  userId: string;
};

export function ProfileCompleteTracker({ userId }: Props) {
  const [tracked, setTracked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTrack = () => {
    setLoading(true);
    trackProfileCompleted({ userId });
    setTracked(true);
    setLoading(false);
  };

  return (
    <div className="mt-6 w-full max-w-md p-4 rounded-xl border border-border bg-surface-secondary flex items-center justify-between text-xs text-left">
      <div>
        <span className="font-semibold text-text-primary flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          Test Profile Event
        </span>
        <span className="text-text-secondary text-[11px] mt-0.5 block">
          Dispatches &apos;profile_completed&apos; to PostHog
        </span>
      </div>
      <button
        type="button"
        onClick={handleTrack}
        disabled={loading || tracked}
        className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : tracked ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-success-light" />
            <span>Dispatched</span>
          </>
        ) : (
          <span>Trigger Event</span>
        )}
      </button>
    </div>
  );
}
