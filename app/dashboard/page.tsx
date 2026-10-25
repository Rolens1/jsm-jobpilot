import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createInsforgeServer } from "@/lib/insforge-server";
import { PostHogUserIdentity, SignOutButton } from "@/components/auth/SignOutButton";
import { EventTrackingCard } from "@/components/dashboard/EventTrackingCard";
import { Navbar } from "@/components/layout/Navbar";
import { CheckCircle2, Home, Sparkles, Loader2, Search } from "lucide-react";

async function DashboardContent() {
  await connection();
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();

  if (!data?.user) {
    redirect("/login?next=/dashboard");
  }

  const userEmail = data.user.email ?? "Authenticated User";

  return (
    <>
      <PostHogUserIdentity userId={data.user.id} email={data.user.email} />
      {/* Top Navbar */}
      <Navbar activePath="/dashboard" userEmail={userEmail} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col items-center justify-center text-center">
        <div className="w-full bg-surface rounded-2xl border border-border p-8 sm:p-12 shadow-sm flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mb-6">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Authenticated Session Active</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Welcome to your Dashboard
          </h1>

          <p className="text-sm sm:text-base text-text-secondary mt-2 max-w-md">
            Logged in as <strong className="text-text-primary font-medium">{userEmail}</strong>. You have successfully authenticated with JobPilot.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-surface-secondary border border-border text-xs text-text-secondary max-w-md text-left">
            <p className="font-semibold text-text-primary mb-1">Phase 1 Status:</p>
            <p>
              The full Dashboard UI (stats bar, application tracking, and analytics) will be built in Phase 5 according to the build plan.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/find-jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent-dark transition-colors shadow-sm"
            >
              <Search className="w-4 h-4" />
              <span>Find Jobs</span>
            </Link>

            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-text-darkest text-surface text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <span>Go to Profile</span>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface border border-border text-text-primary text-sm font-medium hover:bg-surface-secondary transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Homepage</span>
            </Link>
          </div>
        </div>

        <EventTrackingCard userId={data.user.id} />
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
