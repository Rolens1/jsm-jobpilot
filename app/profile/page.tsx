import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createInsforgeServer } from "@/lib/insforge-server";
import { PostHogUserIdentity, SignOutButton } from "@/components/auth/SignOutButton";
import { ProfileCompleteTracker } from "@/components/profile/ProfileCompleteTracker";
import { User, LayoutDashboard, Home, Sparkles, Loader2, Mail, ShieldCheck } from "lucide-react";

async function ProfileContent() {
  await connection();
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();

  if (!data?.user) {
    redirect("/login?next=/profile");
  }

  const user = data.user;
  const userEmail = user.email ?? "Authenticated User";
  const userId = user.id ?? "N/A";
  const providers = user.providers?.join(", ") || "OAuth";

  return (
    <>
      <PostHogUserIdentity userId={user.id} email={user.email} />
      {/* Top Navbar */}
      <header className="h-16 w-full bg-surface border-b border-border sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto h-full px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Image
              src="/logo.png"
              alt="JobPilot"
              width={140}
              height={36}
              className="h-9 w-auto object-contain"
              style={{ width: "auto" }}
              priority
            />
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-xs sm:text-sm font-medium text-text-secondary hover:text-accent transition-colors"
            >
              Dashboard
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Profile Area */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 flex flex-col items-center">
        <div className="w-full bg-surface rounded-2xl border border-border p-8 sm:p-12 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-5">
            <User className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Account</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            User Profile
          </h1>

          <p className="text-sm text-text-secondary mt-1 max-w-md">
            Manage your personal profile and job hunting preferences
          </p>

          {/* User Details Box */}
          <div className="w-full max-w-md mt-6 p-5 rounded-xl bg-surface-secondary border border-border text-left space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-text-secondary flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-text-muted" />
                Email
              </span>
              <span className="font-medium text-text-primary truncate max-w-[220px]">
                {userEmail}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm border-t border-border pt-3">
              <span className="text-text-secondary">Provider</span>
              <span className="font-medium text-text-primary capitalize">{providers}</span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm border-t border-border pt-3">
              <span className="text-text-secondary">User ID</span>
              <span className="font-mono text-xs text-text-secondary truncate max-w-[180px]">
                {userId}
              </span>
            </div>
          </div>

          <ProfileCompleteTracker userId={user.id} />

          <div className="mt-6 p-4 rounded-xl bg-surface-muted border border-border-light text-xs text-text-secondary max-w-md text-left">
            <p className="font-semibold text-text-primary mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Phase 2 Preview:
            </p>
            <p>
              The full Profile UI with resume upload, AI profile extraction, skills, and target criteria will be built in Phase 2.
            </p>
          </div>

          {/* Navigation Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-text-darkest text-surface text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to Dashboard</span>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface border border-border text-text-primary text-sm font-medium hover:bg-surface-secondary transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Homepage</span>
            </Link>

            <SignOutButton className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface border border-border text-text-secondary hover:text-error text-sm font-medium hover:bg-surface-secondary transition-colors cursor-pointer" />
          </div>
        </div>
      </main>
    </>
  );
}

function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[420px] bg-surface rounded-2xl border border-border p-8 shadow-sm text-center flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm font-medium text-text-primary">Loading your profile...</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Suspense fallback={<ProfileLoading />}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}
