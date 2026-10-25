import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createInsforgeServer } from "@/lib/insforge-server";
import { Navbar } from "@/components/layout/Navbar";
import { MOCK_JOBS } from "@/lib/mock-jobs";
import { formatRelativeTime } from "@/lib/date-utils";
import {
  ArrowLeft,
  MapPin,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = MOCK_JOBS.find((j) => j.id === id);

  if (!job) {
    return {
      title: "Job Details | JobPilot",
    };
  }

  return {
    title: `${job.title} at ${job.company} | JobPilot`,
    description: `Match Score ${job.match_score}% - ${job.match_reason}`,
  };
}

async function JobDetailsContent({ params }: Props) {
  await connection();
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();

  if (!data?.user) {
    redirect(`/login?next=/find-jobs`);
  }

  const { id } = await params;
  const job = MOCK_JOBS.find((j) => j.id === id);

  if (!job) {
    notFound();
  }

  const isHighMatch = job.match_score >= 80;
  const isMedMatch = job.match_score >= 60 && job.match_score < 80;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar activePath="/find-jobs" />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8 py-8">
        {/* Back Link */}
        <Link
          href="/find-jobs"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-accent transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Find Jobs</span>
        </Link>

        {/* Header Card */}
        <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-accent-muted border border-border flex items-center justify-center font-bold text-xl text-accent shrink-0">
                {job.company.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-text-secondary">
                  <span className="font-semibold text-text-dark">{job.company}</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-text-muted" />
                    {job.location || "Location not specified"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 self-start sm:self-center">
              {/* Match Score Badge */}
              <div
                className={`px-4 py-2 rounded-2xl border flex items-center gap-2 ${
                  isHighMatch
                    ? "bg-success-lightest border-success/30 text-success-dark"
                    : isMedMatch
                    ? "bg-info-lightest border-info/30 text-info-dark"
                    : "bg-surface-secondary border-border text-text-secondary"
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="text-sm font-bold">{job.match_score}% Match</span>
              </div>

              {job.external_apply_url && (
                <a
                  href={job.external_apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-accent text-accent-foreground font-semibold px-5 py-2.5 rounded-xl hover:bg-accent-dark transition-colors flex items-center gap-2 shadow-sm text-sm"
                >
                  <span>Apply Now</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border">
            <div>
              <span className="text-xs text-text-muted font-medium block uppercase tracking-wider">
                Salary Estimate
              </span>
              <span className="text-sm font-semibold text-text-primary mt-1 block">
                {job.salary || "Not disclosed"}
              </span>
            </div>
            <div>
              <span className="text-xs text-text-muted font-medium block uppercase tracking-wider">
                Job Type
              </span>
              <span className="text-sm font-semibold text-text-primary mt-1 block capitalize">
                {job.job_type}
              </span>
            </div>
            <div>
              <span className="text-xs text-text-muted font-medium block uppercase tracking-wider">
                Found Date
              </span>
              <span className="text-sm font-semibold text-text-primary mt-1 block">
                {formatRelativeTime(job.found_at)}
              </span>
            </div>
            <div>
              <span className="text-xs text-text-muted font-medium block uppercase tracking-wider">
                Source
              </span>
              <span className="text-sm font-semibold text-text-primary mt-1 block uppercase">
                {job.source}
              </span>
            </div>
          </div>
        </div>

        {/* AI Match Breakdown Card */}
        <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center text-accent">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">AI Match Analysis</h2>
          </div>

          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-6">
            {job.match_reason}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
            {/* Matched Skills */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <h3 className="text-xs font-bold text-text-dark uppercase tracking-wider">
                  Matched Skills ({job.matched_skills.length})
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.matched_skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-success-lightest border border-success/20 text-success-foreground text-xs font-semibold px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing / Gap Skills */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-warning" />
                <h3 className="text-xs font-bold text-text-dark uppercase tracking-wider">
                  Growth Areas / Missing ({job.missing_skills.length})
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.missing_skills.length > 0 ? (
                  job.missing_skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-accent-muted border border-border text-accent text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-text-muted">
                    No significant skill gaps identified.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Role Overview and Responsibilities */}
        <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-text-primary mb-4">About the Role</h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-6">
            {job.about_role}
          </p>

          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                Key Responsibilities
              </h3>
              <ul className="space-y-2">
                {job.responsibilities.map((resp, i) => (
                  <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                Requirements
              </h3>
              <ul className="space-y-2">
                {job.requirements.map((req, i) => (
                  <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
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
