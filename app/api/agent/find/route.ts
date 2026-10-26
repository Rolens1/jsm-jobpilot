import { NextRequest, NextResponse } from "next/server";
import { createInsforgeServer } from "@/lib/insforge-server";
import { executeJobSearch } from "@/lib/job-search/orchestrator";
import { captureServerEvent } from "@/lib/posthog-server";
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
    const { jobTitle, location = "", page = 1, forceRefresh = false } = body;

    if (!jobTitle || typeof jobTitle !== "string" || !jobTitle.trim()) {
      return NextResponse.json(
        { success: false, error: "Job title is required." },
        { status: 400 }
      );
    }

    const userId = authData.user.id;
    const cleanTitle = jobTitle.trim();
    const cleanLocation = typeof location === "string" ? location.trim() : "";
    const activeLocale = await getLocale();

    // Track search start
    await captureServerEvent(userId, "job_search_started", {
      userId,
      jobTitle: cleanTitle,
      location: cleanLocation || "Anywhere",
    });

    const result = await executeJobSearch({
      userId,
      jobTitle: cleanTitle,
      location: cleanLocation,
      page: Number(page) || 1,
      forceRefresh: Boolean(forceRefresh),
      locale: activeLocale,
    });

    // Track job found events for newly saved jobs
    if (result.jobsSaved > 0) {
      const topSaved = result.jobs.slice(0, Math.min(result.jobsSaved, 3));
      for (const job of topSaved) {
        await captureServerEvent(userId, "job_found", {
          userId,
          source: job.source || "search",
          matchScore: job.match_score || 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[api/agent/find] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error during job search." },
      { status: 500 }
    );
  }
}
