import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredRateLimits } from "@/lib/rate-limit";

/**
 * Scheduled maintenance cron handler.
 * Purges rate limiting records older than 24 hours.
 * Invoked by Vercel Cron (e.g. daily at 03:00 UTC) or administrative requests.
 */
export async function GET(req: NextRequest) {
  try {
    // Verify Vercel Cron Secret if configured in environment
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized cron invocation." },
        { status: 401 }
      );
    }

    const purged = await cleanupExpiredRateLimits(24);

    return NextResponse.json({
      success: true,
      message: `Successfully purged ${purged} expired rate limit record(s).`,
      purgedCount: purged,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    console.error("[api/cron/cleanup-rate-limits] Maintenance error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to purge expired rate limits.",
      },
      { status: 500 }
    );
  }
}
