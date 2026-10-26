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

  // Fetch candidate profile and jobs in parallel
  const [profileResult, jobsResult] = await Promise.all([
    insforge.database
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle(),
    insforge.database
      .from("jobs")
      .select("id, match_score, company_research, found_at, created_at")
      .eq("user_id", user.id),
  ]);

  const profile = profileResult.data as Profile | null;
  const jobs = (jobsResult.data ?? []) as JobStatRecord[];

  const completion = calculateProfileCompletion(profile, profile?.resume_pdf_url);
  const stats = calculateDashboardStats(jobs);

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
        <DashboardContainer initialStats={stats} />

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
