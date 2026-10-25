"use client";

import React from "react";
import Link from "next/link";
import { Job } from "@/types/database";
import { formatRelativeTime } from "@/lib/date-utils";
import { Building2, MapPin, SearchX, ArrowRight } from "lucide-react";

type Props = {
  jobs: Job[];
  onResetFilters?: () => void;
};

// Helper for company initial avatar color styling
function getCompanyInitialStyle(name: string): { bg: string; text: string } {
  const initial = name.charAt(0).toUpperCase();
  const charCode = initial.charCodeAt(0);

  if (charCode % 5 === 0) {
    return { bg: "bg-accent-light", text: "text-accent-dark" };
  } else if (charCode % 5 === 1) {
    return { bg: "bg-info-lightest", text: "text-info-dark" };
  } else if (charCode % 5 === 2) {
    return { bg: "bg-success-lightest", text: "text-success-dark" };
  } else if (charCode % 5 === 3) {
    return { bg: "bg-surface-secondary", text: "text-text-dark" };
  } else {
    return { bg: "bg-accent-muted", text: "text-accent" };
  }
}

// Helper for Match Score color classification
function getMatchScoreTheme(score: number): {
  barColor: string;
  textColor: string;
  bgLight: string;
} {
  if (score >= 80) {
    return {
      barColor: "bg-success",
      textColor: "text-success",
      bgLight: "bg-success-lightest",
    };
  } else if (score >= 60) {
    return {
      barColor: "bg-info",
      textColor: "text-info-foreground",
      bgLight: "bg-info-lightest",
    };
  } else {
    return {
      barColor: "bg-warning",
      textColor: "text-warning",
      bgLight: "bg-surface-secondary",
    };
  }
}

export function JobsTable({ jobs, onResetFilters }: Props) {
  if (jobs.length === 0) {
    return (
      <div className="w-full bg-surface rounded-2xl border border-border p-12 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-full bg-surface-secondary border border-border flex items-center justify-center text-text-muted mb-4">
          <SearchX className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-text-primary mb-1">
          No matching jobs found
        </h3>
        <p className="text-sm text-text-secondary max-w-md mb-6">
          We could not find any jobs matching your active search query or match score filter.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-xl text-sm font-medium hover:bg-accent-dark transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-secondary/40 text-[11px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <th scope="col" className="py-3.5 pl-6 pr-4">
                Company
              </th>
              <th scope="col" className="py-3.5 px-4">
                Role
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[150px]">
                Match Score
              </th>
              <th scope="col" className="py-3.5 px-4">
                Salary Est.
              </th>
              <th scope="col" className="py-3.5 pl-4 pr-6">
                Date Found
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jobs.map((job) => {
              const scoreTheme = getMatchScoreTheme(job.match_score);
              const initialStyle = getCompanyInitialStyle(job.company);

              return (
                <tr
                  key={job.id}
                  className="hover:bg-surface-secondary/50 transition-colors group"
                >
                  {/* Company Column */}
                  <td className="py-4 pl-6 pr-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl border border-border flex items-center justify-center font-bold text-sm shrink-0 ${initialStyle.bg} ${initialStyle.text}`}
                      >
                        {job.company.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-text-primary text-sm block truncate">
                          {job.company}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-text-secondary mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-text-muted shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role Column */}
                  <td className="py-4 px-4 align-middle">
                    <div className="min-w-0">
                      <Link
                        href={`/find-jobs/${job.id}`}
                        className="font-medium text-text-primary hover:text-accent transition-colors text-sm flex items-center gap-1.5 group/link"
                      >
                        <span className="truncate">{job.title}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-accent shrink-0 hidden sm:inline-block" />
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-medium text-text-secondary bg-surface-secondary px-2 py-0.5 rounded-full border border-border">
                          {job.job_type === "fulltime"
                            ? "Full-time"
                            : job.job_type === "contract"
                            ? "Contract"
                            : "Part-time"}
                        </span>
                        {job.source === "url" && (
                          <span className="text-[11px] font-medium text-linkedin bg-linkedin-light px-2 py-0.5 rounded-full">
                            Direct URL
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Match Score Column */}
                  <td className="py-4 px-4 align-middle">
                    <div className="flex items-center gap-3">
                      {/* Bar Track */}
                      <div className="w-20 sm:w-28 h-2 bg-border-light rounded-full overflow-hidden shrink-0">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${scoreTheme.barColor}`}
                          style={{ width: `${Math.min(100, Math.max(0, job.match_score))}%` }}
                        />
                      </div>
                      {/* Percentage Badge */}
                      <span
                        className={`text-xs sm:text-sm font-semibold shrink-0 ${scoreTheme.textColor}`}
                      >
                        {job.match_score}%
                      </span>
                    </div>
                  </td>

                  {/* Salary Column */}
                  <td className="py-4 px-4 align-middle whitespace-nowrap">
                    {job.salary ? (
                      <span className="text-sm font-medium text-text-primary">
                        {job.salary}
                      </span>
                    ) : (
                      <span className="text-sm text-text-muted">
                        Salary not disclosed
                      </span>
                    )}
                  </td>

                  {/* Date Found Column */}
                  <td className="py-4 pl-4 pr-6 align-middle whitespace-nowrap">
                    <span className="text-sm text-text-secondary">
                      {formatRelativeTime(job.found_at)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
