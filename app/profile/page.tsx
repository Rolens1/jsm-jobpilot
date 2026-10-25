import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createInsforgeServer } from "@/lib/insforge-server";
import { PostHogUserIdentity } from "@/components/auth/SignOutButton";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileContainer } from "@/components/profile/ProfileContainer";
import { calculateProfileCompletion } from "@/lib/profile-utils";
import type { Profile } from "@/types/database";
import { Loader2 } from "lucide-react";

async function ProfileContent() {
  await connection();
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();

  if (!data?.user) {
    redirect("/login?next=/profile");
  }

  const user = data.user;
  const userEmail = user.email ?? "faizan@jsmastery.pro";

  // Fetch real candidate profile record from InsForge database
  const { data: profileData } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileData as Profile | null;

  // Calculate completion and missing fields for initial render
  const initialCompletion = calculateProfileCompletion(
    profile,
    profile?.resume_pdf_url
  );

  return (
    <>
      <PostHogUserIdentity userId={user.id} email={user.email} />
      <Navbar activePath="/profile" />

      {/* Main Profile Page Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">
        <ProfileContainer
          initialProfile={profile}
          userEmail={userEmail}
          initialCompletion={initialCompletion}
        />
      </main>
    </>
  );
}

function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[420px] bg-surface rounded-2xl border border-border p-8 shadow-sm text-center flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm font-medium text-text-primary">
          Loading your profile...
        </p>
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

