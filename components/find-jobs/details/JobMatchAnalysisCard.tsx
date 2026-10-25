import React from "react";
import { Job } from "@/types/database";
import { Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

interface JobMatchAnalysisCardProps {
  job: Job;
}

export function JobMatchAnalysisCard({ job }: JobMatchAnalysisCardProps) {
  const matchedSkills = Array.isArray(job.matched_skills) ? job.matched_skills : [];
  const missingSkills = Array.isArray(job.missing_skills) ? job.missing_skills : [];

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-muted border border-border flex items-center justify-center text-accent shrink-0 shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
              AI Recruiter Fit Breakdown
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Calibrated against your profile, real work history, and demonstrated skills
            </p>
          </div>
        </div>
      </div>

      {/* Narrative Explanation */}
      {job.match_reason && (
        <div className="p-4 sm:p-5 rounded-xl bg-surface-secondary/60 border border-border mb-6">
          <p className="text-sm sm:text-base text-text-primary leading-relaxed">
            {job.match_reason}
          </p>
        </div>
      )}

      {/* Skills Comparison Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Matched Skills */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Matched Skills ({matchedSkills.length})
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {matchedSkills.length > 0 ? (
              matchedSkills.map((skill) => (
                <span
                  key={skill}
                  className="bg-success-lightest border border-success/30 text-success-dark text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  <span>{skill}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-text-muted">
                No direct keyword matches extracted.
              </span>
            )}
          </div>
        </div>

        {/* Growth Areas and Missing Skills */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-warning-dark shrink-0" />
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Missing Skills / Growth Areas ({missingSkills.length})
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {missingSkills.length > 0 ? (
              missingSkills.map((skill) => (
                <span
                  key={skill}
                  className="bg-warning-lightest border border-warning/30 text-warning-dark text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                  <span>{skill}</span>
                </span>
              ))
            ) : (
              <div className="p-3 rounded-lg bg-surface-secondary/40 border border-border text-xs text-text-secondary">
                No critical skill gaps identified. Your technical background covers core requirements.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
