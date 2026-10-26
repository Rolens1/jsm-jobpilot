import type { DailyCountPoint, ScoreDistributionBucket } from "@/lib/dashboard-mock-data";

export interface JobChartRecord {
  id: string;
  company?: string;
  match_score: number | null;
  company_research?: unknown | null;
  found_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AgentRunChartRecord {
  id: string;
  job_title_searched: string;
  jobs_found: number;
  status: string;
  started_at: string;
  completed_at?: string | null;
}

export interface DashboardChartsData {
  companyResearchActivity: DailyCountPoint[];
  jobsFoundTimeline: DailyCountPoint[];
  matchScoreDistribution: ScoreDistributionBucket[];
}

const DAYS_OF_WEEK: Array<"Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"> = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

/**
 * Maps JS getDay() (0=Sun, 1=Mon, ..., 6=Sat) to standard Mon-Sun index (0=Mon, ..., 6=Sun)
 */
function getDayIndex(dayNum: number): number {
  return dayNum === 0 ? 6 : dayNum - 1;
}

/**
 * Computes analytics chart data from candidate database records.
 * Supports zero-state candidates, multi-period distribution, and weekly activity.
 */
export function calculateDashboardCharts(
  jobs: JobChartRecord[] = [],
  agentRuns: AgentRunChartRecord[] = [],
  referenceDate: Date = new Date()
): DashboardChartsData {
  const nowMs = referenceDate.getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  // Initialize empty daily counts for Monday through Sunday
  const researchCountsByDay: Record<string, number> = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };

  const jobsCountsByDay: Record<string, number> = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };

  // 1. Process Jobs Found by Day of Week
  for (const job of jobs) {
    const timeStr = job.found_at || job.created_at;
    if (!timeStr) continue;

    const date = new Date(timeStr);
    const dateMs = date.getTime();
    if (isNaN(dateMs)) continue;

    const diffMs = nowMs - dateMs;
    // Consider jobs discovered within the past 7 days (with 1-minute clock skew tolerance)
    if (diffMs >= -60000 && diffMs <= sevenDaysMs) {
      const dayIdx = getDayIndex(date.getDay());
      const dayName = DAYS_OF_WEEK[dayIdx];
      jobsCountsByDay[dayName] = (jobsCountsByDay[dayName] || 0) + 1;
    }
  }

  // 2. Process Company Research Activity by Day of Week
  // Collect raw research events from both jobs and agent_runs, then deduplicate
  // overlapping events for the same company within a 10-minute window
  interface RawResearchEvent {
    timestampMs: number;
    companyKey: string;
  }

  const rawResearchEvents: RawResearchEvent[] = [];

  // A. From jobs with company_research
  for (const job of jobs) {
    if (!job.company_research) continue;
    const timeStr = job.updated_at || job.created_at;
    if (!timeStr) continue;

    const date = new Date(timeStr);
    const dateMs = date.getTime();
    if (isNaN(dateMs)) continue;

    const companyKey = (job.company || "").trim().toLowerCase();
    rawResearchEvents.push({ timestampMs: dateMs, companyKey });
  }

  // B. From agent_runs where job_title_searched starts with "Research:"
  for (const run of agentRuns) {
    if (!/^Research:\s*/i.test(run.job_title_searched || "")) continue;
    const timeStr = run.completed_at || run.started_at;
    if (!timeStr) continue;

    const date = new Date(timeStr);
    const dateMs = date.getTime();
    if (isNaN(dateMs)) continue;

    const companyKey = run.job_title_searched.replace(/^Research:\s*/i, "").trim().toLowerCase();
    rawResearchEvents.push({ timestampMs: dateMs, companyKey });
  }

  // Sort by timestamp descending
  rawResearchEvents.sort((a, b) => b.timestampMs - a.timestampMs);

  // Deduplicate research events within 10 minutes
  const uniqueResearchEvents: RawResearchEvent[] = [];
  const seenTimestamps: { ms: number; companyKey: string }[] = [];

  for (const event of rawResearchEvents) {
    const isDuplicate = seenTimestamps.some(
      (seen) =>
        Math.abs(seen.ms - event.timestampMs) < 10 * 60 * 1000 &&
        (seen.companyKey === event.companyKey || !seen.companyKey || !event.companyKey)
    );
    if (!isDuplicate) {
      seenTimestamps.push({ ms: event.timestampMs, companyKey: event.companyKey });
      uniqueResearchEvents.push(event);
    }
  }

  // Aggregate unique research events into weekly day buckets
  for (const event of uniqueResearchEvents) {
    const diffMs = nowMs - event.timestampMs;
    if (diffMs >= -60000 && diffMs <= sevenDaysMs) {
      const eventDate = new Date(event.timestampMs);
      const dayIdx = getDayIndex(eventDate.getDay());
      const dayName = DAYS_OF_WEEK[dayIdx];
      researchCountsByDay[dayName] = (researchCountsByDay[dayName] || 0) + 1;
    }
  }

  // 3. Compute Match Score Distribution across the 5 canonical buckets
  const scoreBuckets: Record<string, number> = {
    "50-60%": 0,
    "60-70%": 0,
    "70-80%": 0,
    "80-90%": 0,
    "90-100%": 0,
  };

  for (const job of jobs) {
    if (job.match_score === null || job.match_score === undefined) continue;
    const score = Number(job.match_score);
    if (isNaN(score)) continue;

    if (score >= 90 && score <= 100) {
      scoreBuckets["90-100%"]++;
    } else if (score >= 80 && score < 90) {
      scoreBuckets["80-90%"]++;
    } else if (score >= 70 && score < 80) {
      scoreBuckets["70-80%"]++;
    } else if (score >= 60 && score < 70) {
      scoreBuckets["60-70%"]++;
    } else if (score >= 50 && score < 60) {
      scoreBuckets["50-60%"]++;
    }
  }

  // Format arrays matching typed interfaces
  const companyResearchActivity: DailyCountPoint[] = DAYS_OF_WEEK.map((day) => ({
    day,
    count: researchCountsByDay[day] || 0,
  }));

  const jobsFoundTimeline: DailyCountPoint[] = DAYS_OF_WEEK.map((day) => ({
    day,
    count: jobsCountsByDay[day] || 0,
  }));

  const matchScoreDistribution: ScoreDistributionBucket[] = [
    { range: "50-60%", count: scoreBuckets["50-60%"] },
    { range: "60-70%", count: scoreBuckets["60-70%"] },
    { range: "70-80%", count: scoreBuckets["70-80%"] },
    { range: "80-90%", count: scoreBuckets["80-90%"] },
    { range: "90-100%", count: scoreBuckets["90-100%"] },
  ];

  return {
    companyResearchActivity,
    jobsFoundTimeline,
    matchScoreDistribution,
  };
}
