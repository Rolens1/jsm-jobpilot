import { createInsforgeServer } from "@/lib/insforge-server";
import { UnifiedJob, SearchOrchestratorOptions, SearchOrchestratorResult } from "./types";
import { searchJSearch } from "./jsearch";
import { searchJooble } from "./jooble";
import { searchAdzuna } from "./adzuna";
import { batchScoreJobs } from "./scorer";
import { Profile, Job } from "@/types/database";

function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

export async function executeJobSearch(
  options: SearchOrchestratorOptions
): Promise<SearchOrchestratorResult> {
  const { userId, jobTitle, location, page = 1, forceRefresh = false } = options;
  const insforge = await createInsforgeServer();
  const runId = crypto.randomUUID();
  const startTime = new Date().toISOString();

  // 1. Same Search Guard: Check for existing saved jobs in DB if not force-refreshing page 1
  if (!forceRefresh && page === 1) {
    const { data: existingJobs } = await insforge.database
      .from("jobs")
      .select("*")
      .eq("user_id", userId)
      .order("found_at", { ascending: false });

    if (existingJobs && existingJobs.length > 0) {
      const qTitle = normalizeString(jobTitle);
      const qLoc = location ? normalizeString(location) : "";

      const cachedMatches = existingJobs.filter((j: Job) => {
        const titleNorm = normalizeString(j.title);
        const locNorm = j.location ? normalizeString(j.location) : "";
        const titleMatches = titleNorm.includes(qTitle) || qTitle.includes(titleNorm);
        const locMatches = !qLoc || locNorm.includes(qLoc) || qLoc.includes(locNorm);
        return titleMatches && locMatches;
      });

      // If we have existing results in the database, return them immediately
      if (cachedMatches.length >= 4) {
        return {
          runId,
          jobsFound: cachedMatches.length,
          jobsSaved: cachedMatches.length,
          fromCache: true,
          providerUsed: "database",
          jobs: cachedMatches,
        };
      }
    }
  }

  // 2. Multi-Provider Cascade with Coverage Augmentation
  let rawJobs: UnifiedJob[] = [];
  let providerUsed: "jsearch" | "jooble" | "adzuna" = "jsearch";
  const errors: string[] = [];
  const seenUrls = new Set<string>();

  const addUniqueRawJobs = (newJobs: UnifiedJob[], provider: "jsearch" | "jooble" | "adzuna") => {
    let addedCount = 0;
    for (const job of newJobs) {
      const urlKey = job.sourceUrl || job.externalApplyUrl || `${job.company}:${job.title}`;
      if (!seenUrls.has(urlKey)) {
        seenUrls.add(urlKey);
        rawJobs.push(job);
        addedCount++;
      }
    }
    if (addedCount > 0 && rawJobs.length === addedCount) {
      providerUsed = provider;
    }
  };

  // Try JSearch (Primary)
  try {
    const jsearchJobs = await searchJSearch(jobTitle, location, page);
    if (jsearchJobs.length > 0) {
      addUniqueRawJobs(jsearchJobs, "jsearch");
    }
  } catch (err: any) {
    errors.push(`JSearch error: ${err?.message || err}`);
  }

  // If low coverage (< 5 jobs), try Jooble
  if (rawJobs.length < 5) {
    try {
      const joobleJobs = await searchJooble(jobTitle, location, page);
      if (joobleJobs.length > 0) {
        addUniqueRawJobs(joobleJobs, "jooble");
      }
    } catch (joobleErr: any) {
      errors.push(`Jooble error: ${joobleErr?.message || joobleErr}`);
    }
  }

  // If still low coverage (< 5 jobs), augment with Adzuna
  if (rawJobs.length < 5) {
    try {
      const adzunaJobs = await searchAdzuna(jobTitle, location, page);
      if (adzunaJobs.length > 0) {
        addUniqueRawJobs(adzunaJobs, "adzuna");
      }
    } catch (adzunaErr: any) {
      errors.push(`Adzuna error: ${adzunaErr?.message || adzunaErr}`);
    }
  }

  // If all providers failed or returned 0 jobs, fallback to database existing jobs
  if (rawJobs.length === 0) {
    const { data: fallbackDbJobs } = await insforge.database
      .from("jobs")
      .select("*")
      .eq("user_id", userId)
      .order("found_at", { ascending: false });

    return {
      runId,
      jobsFound: 0,
      jobsSaved: 0,
      fromCache: true,
      providerUsed: "database",
      jobs: fallbackDbJobs || [],
    };
  }

  // 3. Deduplication against existing user jobs
  const { data: existingUserJobs } = await insforge.database
    .from("jobs")
    .select("source_url, external_apply_url, title, company")
    .eq("user_id", userId);

  const existingFingerprints = new Set<string>();
  const existingUrls = new Set<string>();

  (existingUserJobs || []).forEach((j: any) => {
    if (j.source_url) existingUrls.add(j.source_url);
    if (j.external_apply_url) existingUrls.add(j.external_apply_url);
    const fp = `${normalizeString(j.company)}:${normalizeString(j.title)}`;
    existingFingerprints.add(fp);
  });

  const uniqueJobsToSave: UnifiedJob[] = [];
  for (const job of rawJobs) {
    const isUrlDup = (job.sourceUrl && existingUrls.has(job.sourceUrl)) ||
      (job.externalApplyUrl && existingUrls.has(job.externalApplyUrl));
    const fp = `${normalizeString(job.company)}:${normalizeString(job.title)}`;
    const isFpDup = existingFingerprints.has(fp);

    if (!isUrlDup && !isFpDup) {
      uniqueJobsToSave.push(job);
      existingFingerprints.add(fp);
      if (job.sourceUrl) existingUrls.add(job.sourceUrl);
    }
  }

  // 4. Load Profile for AI Scoring
  const { data: profileData } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const userProfile: Profile = profileData || {
    id: userId,
    full_name: "Candidate",
    email: "",
    phone: null,
    location: location || "Montreal, QC",
    current_title: jobTitle,
    experience_level: "mid",
    years_experience: 3,
    skills: ["JavaScript", "TypeScript", "React", "Next.js"],
    industries: ["Technology", "Software"],
    work_experience: [],
    education: [],
    job_titles_seeking: [jobTitle],
    remote_preference: "any",
    preferred_locations: [location],
    salary_expectation: null,
    cover_letter_tone: "enthusiastic",
    linkedin_url: null,
    portfolio_url: null,
    work_authorization: "citizen",
    resume_pdf_url: null,
    is_complete: true,
    created_at: startTime,
    updated_at: startTime,
  };

  // 5. Score only new unique jobs in a single batch
  const scoredMatches = await batchScoreJobs(uniqueJobsToSave, userProfile);

  // 6. Persist to InsForge DB
  if (scoredMatches.length > 0) {
    const recordsToInsert = scoredMatches.map((item) => ({
      user_id: userId,
      run_id: runId,
      source: "search" as const,
      source_url: item.job.sourceUrl,
      external_apply_url: item.job.externalApplyUrl,
      title: item.job.title,
      company: item.job.company,
      location: item.job.location,
      salary: item.job.salary,
      job_type: item.job.jobType,
      about_role: item.job.aboutRole,
      about_company: null,
      match_score: item.matchScore,
      match_reason: item.matchReason,
      matched_skills: item.matchedSkills,
      missing_skills: item.missingSkills,
      company_research: null,
      found_at: new Date().toISOString(),
    }));

    // Ensure initial agent_runs row exists to satisfy foreign key constraint
    const { data: existingRun } = await insforge.database
      .from("agent_runs")
      .select("id")
      .eq("id", runId)
      .single();

    if (!existingRun) {
      await insforge.database.from("agent_runs").insert([
        {
          id: runId,
          user_id: userId,
          status: "running",
          job_title_searched: jobTitle,
          location_searched: location || null,
          jobs_found: rawJobs.length,
          started_at: startTime,
        },
      ]);
    }

    const { error: insertError } = await insforge.database
      .from("jobs")
      .upsert(recordsToInsert, { onConflict: "user_id,source_url" });

    if (insertError) {
      console.warn("[Orchestrator] Batch upsert warning, retrying individually:", insertError);
      for (const rec of recordsToInsert) {
        try {
          await insforge.database
            .from("jobs")
            .upsert([rec], { onConflict: "user_id,source_url" });
        } catch (singleErr) {
          console.warn("[Orchestrator] Single job insert skipped:", singleErr);
        }
      }
    }
  }

  // Update or insert agent_run
  await insforge.database
    .from("agent_runs")
    .upsert([
      {
        id: runId,
        user_id: userId,
        status: "completed",
        job_title_searched: jobTitle,
        location_searched: location || null,
        jobs_found: rawJobs.length,
        started_at: startTime,
        completed_at: new Date().toISOString(),
      },
    ]);

  // Record audit log
  await insforge.database.from("agent_logs").insert([
    {
      run_id: runId,
      user_id: userId,
      message: `Discovered ${rawJobs.length} jobs via ${providerUsed}, saved ${scoredMatches.length} new matches.`,
      level: "success",
      created_at: new Date().toISOString(),
    },
  ]);

  // Return all user jobs from database ordered by newest found
  const { data: updatedJobs } = await insforge.database
    .from("jobs")
    .select("*")
    .eq("user_id", userId)
    .order("found_at", { ascending: false });

  return {
    runId,
    jobsFound: rawJobs.length,
    jobsSaved: scoredMatches.length,
    fromCache: false,
    providerUsed,
    jobs: updatedJobs || [],
  };
}
