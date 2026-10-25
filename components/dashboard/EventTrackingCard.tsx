"use client";

import { useState } from "react";
import {
  trackJobSearchStarted,
  trackJobFound,
  trackProfileCompleted,
  trackCompanyResearched,
  type PostHogEvents,
} from "@/lib/posthog-client";
import { trackServerAnalyticsEvent } from "@/actions/analytics";
import {
  Activity,
  Search,
  Briefcase,
  Building,
  CheckCircle2,
  Sparkles,
  Send,
  Server,
  Monitor,
  Loader2,
} from "lucide-react";

type Props = {
  userId: string;
};

type TrackedLog = {
  id: string;
  name: keyof PostHogEvents;
  channel: "client" | "server";
  timestamp: string;
  payload: Record<string, unknown>;
};

export function EventTrackingCard({ userId }: Props) {
  const [channel, setChannel] = useState<"client" | "server">("client");
  const [loadingEvent, setLoadingEvent] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [logs, setLogs] = useState<TrackedLog[]>([]);

  const addLog = (
    name: keyof PostHogEvents,
    ch: "client" | "server",
    payload: Record<string, unknown>,
  ) => {
    const newEntry: TrackedLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      channel: ch,
      timestamp: new Date().toLocaleTimeString(),
      payload,
    };
    setLogs((prev) => [newEntry, ...prev.slice(0, 9)]);
  };

  const handleTrackJobSearch = async () => {
    setLoadingEvent("job_search_started");
    const payload = {
      userId,
      jobTitle: "Senior Full Stack Engineer",
      location: "San Francisco, CA (Remote)",
    };

    try {
      if (channel === "client") {
        trackJobSearchStarted(payload);
      } else {
        await trackServerAnalyticsEvent("job_search_started", payload);
      }
      addLog("job_search_started", channel, payload);
      setStatusMessage(`Dispatched 'job_search_started' via ${channel}`);
    } catch (err) {
      console.error(err);
      setStatusMessage("Failed to dispatch event");
    } finally {
      setLoadingEvent(null);
    }
  };

  const handleTrackJobFound = async () => {
    setLoadingEvent("job_found");
    const payload = {
      userId,
      source: "search",
      matchScore: 94,
    };

    try {
      if (channel === "client") {
        trackJobFound(payload);
      } else {
        await trackServerAnalyticsEvent("job_found", payload);
      }
      addLog("job_found", channel, payload);
      setStatusMessage(`Dispatched 'job_found' (Score: 94) via ${channel}`);
    } catch (err) {
      console.error(err);
      setStatusMessage("Failed to dispatch event");
    } finally {
      setLoadingEvent(null);
    }
  };

  const handleTrackProfileCompleted = async () => {
    setLoadingEvent("profile_completed");
    const payload = { userId };

    try {
      if (channel === "client") {
        trackProfileCompleted(payload);
      } else {
        await trackServerAnalyticsEvent("profile_completed", payload);
      }
      addLog("profile_completed", channel, payload);
      setStatusMessage(`Dispatched 'profile_completed' via ${channel}`);
    } catch (err) {
      console.error(err);
      setStatusMessage("Failed to dispatch event");
    } finally {
      setLoadingEvent(null);
    }
  };

  const handleTrackCompanyResearched = async () => {
    setLoadingEvent("company_researched");
    const payload = {
      userId,
      jobId: "demo-job-101",
      company: "Stripe",
    };

    try {
      if (channel === "client") {
        trackCompanyResearched(payload);
      } else {
        await trackServerAnalyticsEvent("company_researched", payload);
      }
      addLog("company_researched", channel, payload);
      setStatusMessage(
        `Dispatched 'company_researched' (Stripe) via ${channel}`,
      );
    } catch (err) {
      console.error(err);
      setStatusMessage("Failed to dispatch event");
    } finally {
      setLoadingEvent(null);
    }
  };

  return (
    <div className="w-full bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm text-left mt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-light text-accent flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              PostHog Analytics Event Tracking
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Track canonical events for JobPilot dashboard charts and metrics
            </p>
          </div>
        </div>

        {/* Channel Switcher */}
        <div className="flex items-center bg-surface-secondary p-1 rounded-lg border border-border text-xs">
          <button
            type="button"
            onClick={() => setChannel("client")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              channel === "client"
                ? "bg-surface text-accent shadow-xs font-semibold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Browser Client</span>
          </button>
          <button
            type="button"
            onClick={() => setChannel("server")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              channel === "server"
                ? "bg-surface text-accent shadow-xs font-semibold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Server Action</span>
          </button>
        </div>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {/* Event 1 */}
        <button
          type="button"
          onClick={handleTrackJobSearch}
          disabled={Boolean(loadingEvent)}
          className="p-4 rounded-xl border border-border bg-surface hover:bg-surface-secondary transition-all text-left flex flex-col justify-between group cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-8 h-8 rounded-lg bg-info-lightest text-info-dark flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted bg-surface-secondary px-2 py-0.5 rounded">
              Search
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-text-primary block group-hover:text-accent transition-colors">
              job_search_started
            </span>
            <span className="text-[11px] text-text-secondary mt-0.5 block">
              Title, location & user ID
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-accent font-medium">
            <span>Send Event</span>
            {loadingEvent === "job_search_started" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            )}
          </div>
        </button>

        {/* Event 2 */}
        <button
          type="button"
          onClick={handleTrackJobFound}
          disabled={Boolean(loadingEvent)}
          className="p-4 rounded-xl border border-border bg-surface hover:bg-surface-secondary transition-all text-left flex flex-col justify-between group cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-8 h-8 rounded-lg bg-success-lightest text-success-dark flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-success-dark bg-success-lightest px-2 py-0.5 rounded">
              Charts
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-text-primary block group-hover:text-accent transition-colors">
              job_found
            </span>
            <span className="text-[11px] text-text-secondary mt-0.5 block">
              Powers match distribution
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-accent font-medium">
            <span>Send Event</span>
            {loadingEvent === "job_found" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            )}
          </div>
        </button>

        {/* Event 3 */}
        <button
          type="button"
          onClick={handleTrackCompanyResearched}
          disabled={Boolean(loadingEvent)}
          className="p-4 rounded-xl border border-border bg-surface hover:bg-surface-secondary transition-all text-left flex flex-col justify-between group cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-8 h-8 rounded-lg bg-accent-light text-accent flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-accent bg-accent-muted px-2 py-0.5 rounded">
              Research
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-text-primary block group-hover:text-accent transition-colors">
              company_researched
            </span>
            <span className="text-[11px] text-text-secondary mt-0.5 block">
              Powers research chart
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-accent font-medium">
            <span>Send Event</span>
            {loadingEvent === "company_researched" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            )}
          </div>
        </button>

        {/* Event 4 */}
        <button
          type="button"
          onClick={handleTrackProfileCompleted}
          disabled={Boolean(loadingEvent)}
          className="p-4 rounded-xl border border-border bg-surface hover:bg-surface-secondary transition-all text-left flex flex-col justify-between group cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-8 h-8 rounded-lg bg-success-lightest text-success flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted bg-surface-secondary px-2 py-0.5 rounded">
              Profile
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-text-primary block group-hover:text-accent transition-colors">
              profile_completed
            </span>
            <span className="text-[11px] text-text-secondary mt-0.5 block">
              Triggers onboarding milestone
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-accent font-medium">
            <span>Send Event</span>
            {loadingEvent === "profile_completed" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            )}
          </div>
        </button>
      </div>

      {/* Live Confirmation Status */}
      {statusMessage && (
        <div className="mt-4 p-3 rounded-lg bg-success-lightest border border-success-light flex items-center gap-2 text-xs text-success-dark">
          <Sparkles className="w-4 h-4 text-success shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tracked Activity Feed */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Recent Event Deliveries ({logs.length})
          </h3>
          <span className="text-[11px] text-text-muted">
            Host: https://us.i.posthog.com
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-4 rounded-xl bg-surface-secondary text-center text-xs text-text-muted">
            Click any button above to dispatch PostHog events from this session.
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg bg-surface-secondary border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-semibold text-accent">
                    {log.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      log.channel === "server"
                        ? "bg-accent-muted text-accent"
                        : "bg-info-lightest text-info-dark"
                    }`}
                  >
                    {log.channel === "server" ? "Server Node" : "Browser SDK"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-text-muted font-mono text-[11px]">
                  <span>{JSON.stringify(log.payload)}</span>
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
