import { UnifiedJob } from "./types";
import { JobType } from "@/types/database";

export async function searchJSearch(
  jobTitle: string,
  location: string,
  page: number = 1
): Promise<UnifiedJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error("RAPIDAPI_KEY is not configured in environment");
  }

  const query = location ? `${jobTitle} in ${location}` : jobTitle;
  const params = new URLSearchParams({
    query,
    page: String(page),
    num_pages: "1",
    country: "ca",
    date_posted: "month",
  });

  const host = process.env.RAPIDAPI_HOST || "jsearch.p.rapidapi.com";
  
  // Try /search-v2 first (active RapidAPI endpoint), fallback to /search
  let response = await fetch(`https://${host}/search-v2?${params.toString()}`, {
    method: "GET",
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": host,
    },
    // Prevent caching for fresh paginated fetches
    cache: "no-store",
  });

  if (!response.ok && response.status === 404) {
    response = await fetch(`https://${host}/search?${params.toString()}`, {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": host,
      },
      cache: "no-store",
    });
  }

  if (!response.ok) {
    throw new Error(`JSearch API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawJobs = Array.isArray(data?.data?.jobs)
    ? data.data.jobs
    : Array.isArray(data?.data)
    ? data.data
    : [];

  return rawJobs.map((raw: any): UnifiedJob => {
    let jobType: JobType = "fulltime";
    const rawType = (raw.job_employment_type || "").toLowerCase();
    if (rawType.includes("contract") || rawType.includes("freelance")) {
      jobType = "contract";
    } else if (rawType.includes("part")) {
      jobType = "parttime";
    }

    let locationStr: string | null = null;
    if (raw.job_city && raw.job_state) {
      locationStr = `${raw.job_city}, ${raw.job_state}`;
    } else if (raw.job_city) {
      locationStr = raw.job_city;
    } else if (raw.job_location) {
      locationStr = raw.job_location;
    } else if (raw.job_country) {
      locationStr = raw.job_country;
    }

    let salaryStr: string | null = null;
    if (raw.job_salary_string) {
      salaryStr = raw.job_salary_string;
    } else if (raw.job_min_salary && raw.job_max_salary) {
      salaryStr = `$${Math.round(raw.job_min_salary / 1000)}k - $${Math.round(raw.job_max_salary / 1000)}k`;
    } else if (raw.job_min_salary) {
      salaryStr = `From $${Math.round(raw.job_min_salary / 1000)}k`;
    }

    return {
      id: raw.job_id || `jsearch-${Math.random().toString(36).substring(2, 9)}`,
      provider: "jsearch",
      title: raw.job_title || "Untitled Role",
      company: raw.employer_name || "Unknown Employer",
      location: locationStr,
      salary: salaryStr,
      jobType,
      aboutRole: raw.job_description || "No description provided.",
      sourceUrl: raw.job_google_link || raw.job_apply_link || "https://google.com",
      externalApplyUrl: raw.job_apply_link || null,
      employerLogo: raw.employer_logo || null,
      postedAt: raw.job_posted_at_datetime_utc || null,
    };
  });
}
