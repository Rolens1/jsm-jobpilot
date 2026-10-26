import { createInsforgeServer } from "./insforge-server";
import { headers } from "next/headers";

export type RateLimitEndpoint =
  | "job_search"
  | "company_research"
  | "resume_extract"
  | "resume_generate";

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  remaining: number;
  resetSeconds: number;
  retryAfter: number;
  limit: number;
  message?: string;
}

interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
  name: string;
}

// Calibrated portfolio showcase limits:
// 2 to 3 requests per 10 minutes so recruiters and evaluators can test each feature
// multiple times and easily experience the rate limit guard in action.
export const ENDPOINT_CONFIGS: Record<RateLimitEndpoint, RateLimitConfig> = {
  job_search: { limit: 3, windowSeconds: 600, name: "Job discovery search" },
  company_research: { limit: 3, windowSeconds: 600, name: "Company research agent" },
  resume_extract: { limit: 2, windowSeconds: 600, name: "Resume AI extraction" },
  resume_generate: { limit: 3, windowSeconds: 600, name: "Resume PDF generation" },
};

/**
 * Checks and increments the rate limit for a specific endpoint.
 *
 * @param endpoint The action being rate limited
 * @param userId Optional authenticated user ID. If not provided, falls back to client IP.
 */
export async function checkRateLimit(
  endpoint: RateLimitEndpoint,
  userId?: string | null
): Promise<RateLimitResult> {
  const config = ENDPOINT_CONFIGS[endpoint];

  try {
    let clientIp = "127.0.0.1";
    try {
      const headerList = await headers();
      const forwardedFor = headerList.get("x-forwarded-for");
      const realIp = headerList.get("x-real-ip");
      if (forwardedFor) {
        clientIp = forwardedFor.split(",")[0].trim();
      } else if (realIp) {
        clientIp = realIp.trim();
      }
    } catch {
      // In background context or without request headers
    }

    const identifier = userId ? `user:${userId}` : `ip:${clientIp}`;
    const insforge = await createInsforgeServer();

    // Call atomic PostgreSQL function
    const { data, error } = await insforge.database.rpc("check_rate_limit", {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_limit: config.limit,
      p_window_seconds: config.windowSeconds,
    });

    if (error || !data || data.length === 0) {
      console.warn("⚠️ Rate limit check failed, failing open:", error?.message);
      return {
        allowed: true,
        current: 1,
        remaining: config.limit,
        resetSeconds: config.windowSeconds,
        retryAfter: 0,
        limit: config.limit,
      };
    }

    const result = data[0];
    const allowed = Boolean(result.allowed);
    const current = Number(result.current_count);
    const remaining = Math.max(0, Number(result.remaining));
    const resetSeconds = Math.max(0, Number(result.reset_seconds));

    let message: string | undefined;
    if (!allowed) {
      const minutesRemaining = Math.max(1, Math.ceil(resetSeconds / 60));
      const requestWord = config.limit === 1 ? "request" : "requests";
      const minuteWord = minutesRemaining > 1 ? "minutes" : "minute";
      message = `Demo rate limit reached: ${config.name} is capped at ${config.limit} ${requestWord} per 10 minutes to protect external API quotas and demonstrate production rate limiting. Limit resets in ${minutesRemaining} ${minuteWord}.`;
    }

    return {
      allowed,
      current,
      remaining,
      resetSeconds,
      retryAfter: resetSeconds,
      limit: config.limit,
      message,
    };
  } catch (err) {
    console.warn("⚠️ Rate limiter encountered exception, failing open:", err);
    return {
      allowed: true,
      current: 1,
      remaining: config.limit,
      resetSeconds: config.windowSeconds,
      retryAfter: 0,
      limit: config.limit,
    };
  }
}

/**
 * Maintenance helper: Purges expired rate limit records older than retention period.
 *
 * @param retentionHours Hours of inactivity before records are deleted (defaults to 24)
 */
export async function cleanupExpiredRateLimits(retentionHours = 24): Promise<number> {
  try {
    const insforge = await createInsforgeServer();
    const { data, error } = await insforge.database.rpc("cleanup_expired_rate_limits", {
      p_retention_hours: retentionHours,
    });

    if (error) {
      console.warn("⚠️ Failed to purge expired rate limits:", error.message);
      return 0;
    }

    return Number(data) || 0;
  } catch (err) {
    console.warn("⚠️ Rate limit cleanup encountered exception:", err);
    return 0;
  }
}
