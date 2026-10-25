import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createInsforgeServer } from "@/lib/insforge-server";
import { Navbar } from "@/components/layout/Navbar";
import { MOCK_JOBS } from "@/lib/mock-jobs";
import { Job } from "@/types/database";
import { ArrowLeft, Loader2 } from "lucide-react";
import { JobDetailsHeader } from "@/components/find-jobs/details/JobDetailsHeader";
import { JobMetricsGrid } from "@/components/find-jobs/details/JobMetricsGrid";
import { JobMatchAnalysisCard } from "@/components/find-jobs/details/JobMatchAnalysisCard";
import { JobDescriptionCard } from "@/components/find-jobs/details/JobDescriptionCard";
import { CompanyResearchCard } from "@/components/find-jobs/details/CompanyResearchCard";
import { StickyApplyBar } from "@/components/find-jobs/details/StickyApplyBar";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const insforge = await createInsforgeServer();
    const { data: dbJob } = await insforge.database
      .from("jobs")
      .select("title, company, match_score, match_reason")
      .eq("id", id)
      .single();

    const job = dbJob || MOCK_JOBS.find((j) => j.id === id);

    if (!job) {
      return {
        title: "Job Details | JobPilot",
      };
    }

    return {
      title: `${job.title} at ${job.company} | JobPilot`,
      description: `Match Score ${job.match_score}% - ${
        job.match_reason || "Role overview and requirements"
      }`,
    };
  } catch {
    const mockJob = MOCK_JOBS.find((j) => j.id === id);
    if (mockJob) {
      return {
        title: `${mockJob.title} at ${mockJob.company} | JobPilot`,
        description: `Match Score ${mockJob.match_score}% - ${mockJob.match_reason}`,
      };
    }
    return {
      title: "Job Details | JobPilot",
    };
  }
}

async function JobDetailsContent({ params }: Props) {
  await connection();
  const insforge = await createInsforgeServer();
  const { data: authData } = await insforge.auth.getCurrentUser();

  const { id } = await params;

  if (!authData?.user) {
    redirect(`/login?next=/find-jobs/${id}`);
  }

  // 1. Query database for saved job under current user
  let job: Job | null = null;
  try {
    const { data: dbJob } = await insforge.database
      .from("jobs")
      .select("*")
      .eq("id", id)
      .eq("user_id", authData.user.id)
      .single();

    if (dbJob) {
      job = dbJob as Job;
    }
  } catch (err) {
    console.warn("[JobDetails] Error querying job from database:", err);
  }

  // 2. Fallback to mock jobs if not in DB (for development preview)
  if (!job) {
    const mockMatch = MOCK_JOBS.find((j) => j.id === id);
    if (mockMatch) {
      job = mockMatch;
    }
  }

  // 3. If neither exists, trigger 404
  if (!job) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative pb-28">
      {/* Top Navigation */}
      <Navbar activePath="/find-jobs" userEmail={authData.user.email} />

      {/* Main Container */}
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8 py-8 space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href="/find-jobs"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-text-secondary hover:text-accent transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Find Jobs</span>
          </Link>
        </div>

        {/* Section 1: Header Card */}
        <JobDetailsHeader job={job} />

        {/* Section 2: Metrics Grid */}
        <JobMetricsGrid job={job} />

        {/* Section 3: AI Recruiter Match Analysis */}
        <JobMatchAnalysisCard job={job} />

        {/* Section 4: Detailed Role Description */}
        <JobDescriptionCard job={job} />

        {/* Section 5: Company Intelligence Dossier (Feature 13 Preview) */}
        <CompanyResearchCard job={job} />
      </main>

      {/* Persistent Floating Bottom Bar */}
      <StickyApplyBar job={job} />
    </div>
  );
}

export default function JobDetailsPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 text-text-secondary">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <span className="text-sm font-medium">Loading Job Details...</span>
          </div>
        </div>
      }
    >
      <JobDetailsContent {...props} />
    </Suspense>
  );
}
