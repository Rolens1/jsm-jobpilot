import type { ActivityEvent } from "@/lib/dashboard-mock-data";
import { formatRelativeTime } from "@/lib/date-utils";
import type { Dictionary } from "@/types/i18n";

export interface AgentRunRecord {
  id: string;
  job_title_searched: string;
  location_searched?: string | null;
  jobs_found: number;
  status: string;
  started_at: string;
  completed_at?: string | null;
}

export interface ResearchedJobRecord {
  id: string;
  company: string;
  title?: string;
  company_research?: unknown;
  updated_at?: string;
  created_at?: string;
}

interface RawActivityItem {
  id: string;
  title: string;
  type: "job_search" | "company_research";
  dotColor: "accent" | "info" | "success";
  timestampMs: number;
  companyKey?: string;
}

/**
 * Transforms agent runs and researched job records into unified, deduplicated
 * chronological timeline events for the candidate dashboard.
 */
export function formatRecentActivities(
  agentRuns: AgentRunRecord[] = [],
  researchedJobs: ResearchedJobRecord[] = [],
  maxItems: number = 5,
  dict?: Dictionary
): ActivityEvent[] {
  const rawItems: RawActivityItem[] = [];

  const researchedPrefix = dict?.dashboard.activityResearchedPrefix || "Researched";
  const foundPrefix = dict?.dashboard.activityFoundPrefix || "Found";

  // 1. Process agent runs
  let searchColorToggle = false;
  for (const run of agentRuns) {
    const timeStr = run.completed_at || run.started_at;
    const timestampMs = new Date(timeStr).getTime();
    if (isNaN(timestampMs)) continue;

    const searchedTitle = (run.job_title_searched || "").trim();

    // Check if this agent run was for company research (e.g., "Research: Acme")
    if (/^Research:\s*/i.test(searchedTitle)) {
      const companyName = searchedTitle.replace(/^Research:\s*/i, "").trim();
      rawItems.push({
        id: `run-${run.id}`,
        title: `${researchedPrefix} ${companyName}`,
        type: "company_research",
        dotColor: "info",
        timestampMs,
        companyKey: companyName.toLowerCase(),
      });
    } else {
      // Normal job search run
      const count = run.jobs_found ?? 0;
      const title =
        count > 0
          ? `${foundPrefix} ${count} ${count === 1 ? "job" : "jobs"} ${searchedTitle ? `for ${searchedTitle}` : ""}`.trim()
          : `${searchedTitle ? `Search: ${searchedTitle}` : "Job search"}`;

      // Alternate accent and success colors to match visual rhythm in dashboard.png
      const dotColor = searchColorToggle ? "success" : "accent";
      searchColorToggle = !searchColorToggle;

      rawItems.push({
        id: `run-${run.id}`,
        title,
        type: "job_search",
        dotColor,
        timestampMs,
      });
    }
  }

  // 2. Process jobs with completed company research
  for (const job of researchedJobs) {
    if (!job.company_research) continue;
    const timeStr = job.updated_at || job.created_at;
    if (!timeStr) continue;

    const timestampMs = new Date(timeStr).getTime();
    if (isNaN(timestampMs)) continue;

    const companyName = (job.company || "Company").trim();
    rawItems.push({
      id: `job-research-${job.id}`,
      title: `${researchedPrefix} ${companyName}`,
      type: "company_research",
      dotColor: "info",
      timestampMs,
      companyKey: companyName.toLowerCase(),
    });
  }

  // 3. Sort by recency (newest first)
  rawItems.sort((a, b) => b.timestampMs - a.timestampMs);

  // 4. Deduplicate research events for the same company within 10 minutes
  const deduplicated: RawActivityItem[] = [];
  const seenResearch = new Map<string, number>();

  for (const item of rawItems) {
    if (item.type === "company_research" && item.companyKey) {
      const lastSeenTime = seenResearch.get(item.companyKey);
      if (lastSeenTime !== undefined && Math.abs(lastSeenTime - item.timestampMs) < 10 * 60 * 1000) {
        // Skip duplicate research event within 10 minutes
        continue;
      }
      seenResearch.set(item.companyKey, item.timestampMs);
    }
    deduplicated.push(item);
  }

  // 5. Slice and map to final ActivityEvent shape
  return deduplicated.slice(0, maxItems).map((item) => ({
    id: item.id,
    title: item.title,
    timestamp: formatRelativeTime(new Date(item.timestampMs)),
    type: item.type,
    dotColor: item.dotColor,
  }));
}
