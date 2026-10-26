import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createInsforgeServer } from "@/lib/insforge-server";
import { calculateProfileCompletion } from "@/lib/profile-utils";
import { PostHogUserIdentity } from "@/components/auth/SignOutButton";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileAttentionBanner } from "@/components/profile/ProfileAttentionBanner";
import { DashboardContainer } from "@/components/dashboard/DashboardContainer";
import { EventTrackingCard } from "@/components/dashboard/EventTrackingCard";
import { Loader2 } from "lucide-react";
import { calculateDashboardStats, type JobStatRecord } from "@/lib/dashboard-stats";
import {
  formatRecentActivities,
  type AgentRunRecord,
  type ResearchedJobRecord,
} from "@/lib/dashboard-activity";
import type { Profile } from "@/types/database";

async function DashboardContent() {
  await connection();
  const insforge = await createInsforgeServer();
  const { data: authData } = await insforge.auth.getCurrentUser();

  if (!authData?.user) {
    redirect("/login?next=/dashboard");
  }

  const user = authData.user;
  const userEmail = user.email ?? "Authenticated User";

  // Fetch candidate profile, jobs, and recent agent runs in parallel
  const [profileResult, jobsResult, agentRunsResult] = await Promise.all([
    insforge.database
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle(),
    insforge.database
      .from("jobs")
      .select("id, company, title, match_score, company_research, found_at, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    insforge.database
      .from("agent_runs")
      .select("id, job_title_searched, location_searched, jobs_found, status, started_at, completed_at")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  const profile = profileResult.data as Profile | null;
  const rawJobs = jobsResult.data ?? [];
  const statJobs = rawJobs as unknown as JobStatRecord[];
  const researchedJobs = rawJobs as unknown as ResearchedJobRecord[];
  const agentRuns = (agentRunsResult.data ?? []) as AgentRunRecord[];

  const completion = calculateProfileCompletion(profile, profile?.resume_pdf_url);
  const stats = calculateDashboardStats(statJobs);
  const activities = formatRecentActivities(agentRuns, researchedJobs, 5);

  return (
    <>
      <PostHogUserIdentity userId={user.id} email={user.email} />

      {/* Top Navigation */}
      <Navbar activePath="/dashboard" userEmail={userEmail} />

      {/* Main Dashboard Layout Container */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Incomplete Profile Banner: displayed only when profile needs attention */}
        {!completion.isComplete && (
          <ProfileAttentionBanner
            percentage={completion.percentage}
            missingFields={completion.missingFields}
          />
        )}

        {/* Dashboard Core: Stats, Recent Activity Feed, and Analytics Charts */}
        <DashboardContainer initialStats={stats} initialActivity={activities} />

        {/* Developer Diagnostics & PostHog Event Verification Tool */}
        <div className="pt-4">
          <EventTrackingCard userId={user.id} />
        </div>
      </main>
    </>
  );
}

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[420px] bg-surface rounded-2xl border border-border p-8 shadow-sm text-center flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm font-medium text-text-primary">Loading your dashboard...</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Suspense fallback={<DashboardLoading />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
