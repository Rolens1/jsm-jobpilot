import { Suspense } from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createInsforgeServer } from "@/lib/insforge-server";
import { Navbar } from "@/components/layout/Navbar";
import { FindJobsContainer } from "@/components/find-jobs/FindJobsContainer";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Find Jobs | JobPilot",
  description: "Search across developer roles and discover tailored career matches.",
};

async function FindJobsContent() {
  await connection();
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();

  if (!data?.user) {
    redirect("/login?next=/find-jobs");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <Navbar activePath="/find-jobs" />

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 md:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Find Jobs
          </h1>
          <p className="text-sm sm:text-base text-text-secondary mt-1">
            Search across developer roles and find your best matches.
          </p>
        </div>

        <FindJobsContainer />
      </main>
    </div>
  );
}

export default function FindJobsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 text-text-secondary">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <span className="text-sm font-medium">Loading Find Jobs...</span>
          </div>
        </div>
      }
    >
      <FindJobsContent />
    </Suspense>
  );
}
