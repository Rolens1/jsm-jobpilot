import { NextRequest, NextResponse } from "next/server";
import { createInsforgeServer } from "@/lib/insforge-server";
import { captureServerEvent } from "@/lib/posthog-server";
import { Job, Profile } from "@/types/database";
import {
  deriveCompanyDomain,
  extractCompanyWebFootprint,
  synthesizeCompanyDossier,
} from "@/lib/agent/research";
import { getLocale } from "@/lib/i18n";

export async function POST(req: NextRequest) {
  try {
    const insforge = await createInsforgeServer();
    const { data: authData, error: authError } = await insforge.auth.getCurrentUser();

    if (authError || !authData?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { jobId } = body;

    if (!jobId || typeof jobId !== "string" || !jobId.trim()) {
      return NextResponse.json(
        { success: false, error: "A valid jobId is required." },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // 1. Retrieve target job from database
    let job: Job | null = null;
    try {
      const { data: dbJob } = await insforge.database
        .from("jobs")
        .select("*")
        .eq("id", jobId.trim())
        .eq("user_id", userId)
        .single();

      if (dbJob) {
        job = dbJob as Job;
      }
    } catch (err) {
      console.warn("[CompanyResearch] Error loading job from database:", err);
    }

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job opportunity not found." },
        { status: 404 }
      );
    }

    // 2. Retrieve candidate profile from database
    let profile: Profile | null = null;
    try {
      const { data: dbProfile } = await insforge.database
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (dbProfile) {
        profile = dbProfile as Profile;
      }
    } catch (err) {
      console.warn("[CompanyResearch] Error loading candidate profile:", err);
    }

    // Fallback baseline profile if incomplete
    if (!profile) {
      profile = {
        id: userId,
        full_name: authData.user.email?.split("@")[0] || "Candidate",
        email: authData.user.email || "",
        phone: null,
        location: null,
        current_title: "Software Engineer",
        experience_level: "mid",
        years_experience: 3,
        skills: job.matched_skills || ["TypeScript", "React"],
        industries: ["Technology"],
        work_experience: [],
        education: [],
        job_titles_seeking: [job.title],
        remote_preference: "any",
        preferred_locations: [],
        salary_expectation: null,
        cover_letter_tone: "enthusiastic",
        linkedin_url: null,
        portfolio_url: null,
        work_authorization: "citizen",
        resume_pdf_url: null,
        is_complete: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // 3. Derive genuine company domain and extract web footprint
    const domainUrl = await deriveCompanyDomain(
      job.company,
      job.external_apply_url,
      job.source_url
    );

    const { text: webFootprint, sources } = await extractCompanyWebFootprint(domainUrl);

    // 4. Synthesize comprehensive 9-field dossier respecting candidate language
    const currentLocale = await getLocale();
    const candidateLocale = (profile.preferred_language === "fr" || currentLocale === "fr" ? "fr" : "en") as "en" | "fr";
    const dossier = await synthesizeCompanyDossier({
      job,
      profile,
      webFootprint,
      sources,
      locale: candidateLocale,
    });

    // 5. Persist dossier into jobs.company_research in PostgreSQL
    try {
      await insforge.database
        .from("jobs")
        .update({
          company_research: dossier,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id)
        .eq("user_id", userId);
    } catch (saveErr) {
      console.warn("[CompanyResearch] Failed to update jobs table:", saveErr);
    }

    // 6. Record agent run and agent log
    try {
      const { data: runData } = await insforge.database
        .from("agent_runs")
        .insert([
          {
            user_id: userId,
            status: "completed",
            job_title_searched: `Research: ${job.company}`,
            location_searched: job.location || "Online",
            jobs_found: 1,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          },
        ])
        .select("id")
        .single();

      const runId = runData?.id;
      if (runId) {
        await insforge.database.from("agent_logs").insert([
          {
            run_id: runId,
            user_id: userId,
            message: `Synthesized company research dossier for ${job.company} (${job.title})`,
            level: "success",
            job_id: job.id,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (auditErr) {
      console.warn("[CompanyResearch] Audit log insert skipped:", auditErr);
    }

    // 7. Track PostHog telemetry event
    await captureServerEvent(userId, "company_researched", {
      userId,
      jobId: job.id,
      company: job.company,
    });

    return NextResponse.json({
      success: true,
      dossier,
    });
  } catch (error) {
    console.error("[CompanyResearch] Unexpected agent failure:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal research agent error.",
      },
      { status: 500 }
    );
  }
}
