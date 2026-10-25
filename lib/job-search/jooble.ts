import { UnifiedJob } from "./types";
import { JobType } from "@/types/database";

function stripHtml(text: string): string {
  if (!text) return "";
  return text.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

export async function searchJooble(
  jobTitle: string,
  location: string,
  page: number = 1
): Promise<UnifiedJob[]> {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) {
    throw new Error("JOOBLE_API_KEY is not configured in environment");
  }

  const url = `https://jooble.org/api/${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      keywords: jobTitle,
      location: location || "Canada",
      page,
      ResultOnPage: 10,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Jooble API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawJobs = Array.isArray(data?.jobs) ? data.jobs : [];

  return rawJobs.map((raw: any): UnifiedJob => {
    const cleanTitle = stripHtml(raw.title || "Untitled Role");
    const cleanSnippet = stripHtml(raw.snippet || "No description provided.");

    return {
      id: raw.id ? `jooble-${raw.id}` : `jooble-${Math.random().toString(36).substring(2, 9)}`,
      provider: "jooble",
      title: cleanTitle,
      company: raw.company || "Unknown Employer",
      location: raw.location || location || "Canada",
      salary: raw.salary ? raw.salary.trim() : null,
      jobType: "fulltime",
      aboutRole: cleanSnippet,
      sourceUrl: raw.link || `https://jooble.org/job/${raw.id || Math.random().toString(36).substring(2, 9)}`,
      externalApplyUrl: raw.link || null,
      employerLogo: null,
      postedAt: raw.updated || null,
    };
  });
}
