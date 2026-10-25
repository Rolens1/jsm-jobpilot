import { UnifiedJob } from "./types";
import { JobType } from "@/types/database";

export async function searchAdzuna(
  jobTitle: string,
  location: string,
  page: number = 1
): Promise<UnifiedJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    throw new Error("ADZUNA_APP_ID or ADZUNA_APP_KEY is not configured in environment");
  }

  // Support Canada as primary market, fallback to US if specified
  const country = location.toLowerCase().includes("us") || location.toLowerCase().includes("united states") ? "us" : "ca";

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: jobTitle,
    category: "it-jobs",
    results_per_page: "10",
    "content-type": "application/json",
  });

  if (location) {
    params.set("where", location);
  }

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Adzuna API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawJobs = Array.isArray(data?.results) ? data.results : [];

  return rawJobs.map((raw: any): UnifiedJob => {
    let salaryStr: string | null = null;
    if (raw.salary_min && raw.salary_max) {
      salaryStr = `$${Math.round(raw.salary_min / 1000)}k - $${Math.round(raw.salary_max / 1000)}k`;
    } else if (raw.salary_min) {
      salaryStr = `From $${Math.round(raw.salary_min / 1000)}k`;
    }

    const jobType: JobType = raw.contract_type === "contract" ? "contract" : "fulltime";

    return {
      id: raw.id ? `adzuna-${raw.id}` : `adzuna-${Math.random().toString(36).substring(2, 9)}`,
      provider: "adzuna",
      title: raw.title || "Untitled Role",
      company: raw.company?.display_name || "Unknown Employer",
      location: raw.location?.display_name || location || "Canada",
      salary: salaryStr,
      jobType,
      aboutRole: raw.description || "No description provided.",
      sourceUrl: raw.redirect_url || `https://adzuna.com/job/${raw.id || Math.random().toString(36).substring(2, 9)}`,
      externalApplyUrl: raw.redirect_url || null,
      employerLogo: null,
      postedAt: raw.created || null,
    };
  });
}
