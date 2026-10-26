import type { StatMetric } from "@/lib/dashboard-mock-data";

export interface JobStatRecord {
  id: string;
  match_score: number | null;
  company_research: unknown | null;
  found_at: string | null;
  created_at: string;
}

/**
 * Computes the 4 key dashboard metrics from real database job records.
 * Supports zero-state candidates, single-period data, and multi-week trends.
 */
export function calculateDashboardStats(
  jobs: JobStatRecord[],
  referenceDate: Date = new Date()
): StatMetric[] {
  const totalJobs = jobs.length;

  if (totalJobs === 0) {
    return [
      {
        id: "total-jobs",
        label: "Total Jobs Found",
        value: "0",
        subtitle: "No jobs yet",
      },
      {
        id: "avg-match-rate",
        label: "Avg. Match Rate",
        value: "0%",
        subtitle: "No matches yet",
      },
      {
        id: "companies-researched",
        label: "Companies Researched",
        value: "0",
        subtitle: "Total researched",
      },
      {
        id: "jobs-this-week",
        label: "Jobs This Week",
        value: "0",
        subtitle: "New this week",
      },
    ];
  }

  const nowMs = referenceDate.getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

  // Partition jobs into this week (0-7 days ago) and prior week (7-14 days ago)
  const thisWeekJobs: JobStatRecord[] = [];
  const priorWeekJobs: JobStatRecord[] = [];

  for (const job of jobs) {
    const dateStr = job.found_at || job.created_at;
    const dateMs = new Date(dateStr).getTime();
    const diffMs = nowMs - dateMs;

    if (diffMs >= -60000 && diffMs <= sevenDaysMs) {
      thisWeekJobs.push(job);
    } else if (diffMs > sevenDaysMs && diffMs <= fourteenDaysMs) {
      priorWeekJobs.push(job);
    }
  }

  // 1. Total Jobs Found metric
  const thisWeekCount = thisWeekJobs.length;
  const priorWeekCount = priorWeekJobs.length;

  let totalJobsTrend: StatMetric["trend"] = undefined;
  let totalJobsSubtitle: string | undefined = undefined;

  if (priorWeekCount > 0) {
    const pctChange = Math.round(
      ((thisWeekCount - priorWeekCount) / priorWeekCount) * 100
    );
    totalJobsTrend = {
      value: `${pctChange >= 0 ? "+" : ""}${pctChange}%`,
      label: "vs last week",
      direction: pctChange >= 0 ? "up" : "down",
    };
  } else if (thisWeekCount > 0) {
    totalJobsTrend = {
      value: `+${thisWeekCount}`,
      label: "new this week",
      direction: "up",
    };
  } else {
    totalJobsSubtitle = "All time total";
  }

  // 2. Avg. Match Rate metric
  const validScores = jobs
    .map((j) => (j.match_score !== null ? Number(j.match_score) : NaN))
    .filter((s) => !isNaN(s) && s >= 0);

  const avgScore =
    validScores.length > 0
      ? Math.round(
          validScores.reduce((sum, s) => sum + s, 0) / validScores.length
        )
      : 0;

  let avgRateTrend: StatMetric["trend"] = undefined;
  let avgRateSubtitle: string | undefined = undefined;

  const thisWeekScores = thisWeekJobs
    .map((j) => (j.match_score !== null ? Number(j.match_score) : NaN))
    .filter((s) => !isNaN(s) && s >= 0);

  const priorWeekScores = priorWeekJobs
    .map((j) => (j.match_score !== null ? Number(j.match_score) : NaN))
    .filter((s) => !isNaN(s) && s >= 0);

  if (thisWeekScores.length > 0 && priorWeekScores.length > 0) {
    const thisAvg = Math.round(
      thisWeekScores.reduce((sum, s) => sum + s, 0) / thisWeekScores.length
    );
    const priorAvg = Math.round(
      priorWeekScores.reduce((sum, s) => sum + s, 0) / priorWeekScores.length
    );
    const diff = thisAvg - priorAvg;
    avgRateTrend = {
      value: `${diff >= 0 ? "+" : ""}${diff}%`,
      label: "vs last week",
      direction: diff >= 0 ? "up" : "down",
    };
  } else {
    avgRateSubtitle = "Overall average";
  }

  // 3. Companies Researched metric
  const researchedCount = jobs.filter(
    (j) => j.company_research !== null && j.company_research !== undefined
  ).length;

  // 4. Jobs This Week metric
  const jobsThisWeekCount = thisWeekJobs.length;

  return [
    {
      id: "total-jobs",
      label: "Total Jobs Found",
      value: String(totalJobs),
      trend: totalJobsTrend,
      subtitle: totalJobsSubtitle,
    },
    {
      id: "avg-match-rate",
      label: "Avg. Match Rate",
      value: `${avgScore}%`,
      trend: avgRateTrend,
      subtitle: avgRateSubtitle,
    },
    {
      id: "companies-researched",
      label: "Companies Researched",
      value: String(researchedCount),
      subtitle: "Total researched",
    },
    {
      id: "jobs-this-week",
      label: "Jobs This Week",
      value: String(jobsThisWeekCount),
      subtitle: "New this week",
    },
  ];
}
