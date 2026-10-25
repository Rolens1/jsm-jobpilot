import React from "react";
import { Job } from "@/types/database";
import { formatRelativeTime } from "@/lib/date-utils";
import { Banknote, Briefcase, Calendar, Globe } from "lucide-react";

interface JobMetricsGridProps {
  job: Job;
}

export function JobMetricsGrid({ job }: JobMetricsGridProps) {
  const formattedJobType =
    job.job_type === "fulltime"
      ? "Full-time"
      : job.job_type === "parttime"
      ? "Part-time"
      : job.job_type === "contract"
      ? "Contract"
      : job.job_type || "Full-time";

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-sm">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Salary Estimate */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-border flex items-center justify-center text-text-secondary shrink-0">
            <Banknote className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-[11px] sm:text-xs text-text-muted font-semibold uppercase tracking-wider block">
              Salary Estimate
            </span>
            <span className="text-sm sm:text-base font-bold text-text-primary mt-0.5 block truncate">
              {job.salary || "Not disclosed"}
            </span>
          </div>
        </div>

        {/* Metric 2: Job Type */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-border flex items-center justify-center text-text-secondary shrink-0">
            <Briefcase className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-[11px] sm:text-xs text-text-muted font-semibold uppercase tracking-wider block">
              Employment Type
            </span>
            <span className="text-sm sm:text-base font-bold text-text-primary mt-0.5 block">
              {formattedJobType}
            </span>
          </div>
        </div>

        {/* Metric 3: Date Found */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-border flex items-center justify-center text-text-secondary shrink-0">
            <Calendar className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-[11px] sm:text-xs text-text-muted font-semibold uppercase tracking-wider block">
              Discovered
            </span>
            <span className="text-sm sm:text-base font-bold text-text-primary mt-0.5 block">
              {formatRelativeTime(job.found_at)}
            </span>
          </div>
        </div>

        {/* Metric 4: Source Platform */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-border flex items-center justify-center text-text-secondary shrink-0">
            <Globe className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-[11px] sm:text-xs text-text-muted font-semibold uppercase tracking-wider block">
              Source Listing
            </span>
            <span className="text-sm sm:text-base font-bold text-text-primary mt-0.5 block uppercase">
              {job.source || "Search"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
