"use client";

import React from "react";
import { Job } from "@/types/database";
import { FileText, Check, ExternalLink, ArrowRight } from "lucide-react";
import { useTranslation } from "@/components/providers/LanguageProvider";

interface JobDescriptionCardProps {
  job: Job;
}

export function JobDescriptionCard({ job }: JobDescriptionCardProps) {
  const { dict } = useTranslation();
  const applyUrl = job.external_apply_url || job.source_url;
  const responsibilities = Array.isArray(job.responsibilities) ? job.responsibilities : [];
  const requirements = Array.isArray(job.requirements) ? job.requirements : [];
  const niceToHave = Array.isArray(job.nice_to_have) ? job.nice_to_have : [];
  const benefits = Array.isArray(job.benefits) ? job.benefits : [];

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm space-y-8">
      {/* Overview Section */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center text-accent">
            <FileText className="w-4 h-4" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
            {dict.jobDetails.roleOverview}
          </h2>
        </div>
        <div className="text-sm sm:text-base text-text-secondary leading-relaxed whitespace-pre-line space-y-4">
          {job.about_role || dict.jobDetails.noOverviewProvided}
        </div>
      </div>

      {/* Key Responsibilities */}
      {responsibilities.length > 0 && (
        <div className="pt-6 border-t border-border">
          <h3 className="text-sm sm:text-base font-bold text-text-primary uppercase tracking-wider mb-4">
            {dict.jobDetails.keyResponsibilities}
          </h3>
          <ul className="space-y-3">
            {responsibilities.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-text-secondary">
                <span className="w-5 h-5 rounded-md bg-accent-muted flex items-center justify-center text-accent shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Requirements */}
      {requirements.length > 0 && (
        <div className="pt-6 border-t border-border">
          <h3 className="text-sm sm:text-base font-bold text-text-primary uppercase tracking-wider mb-4">
            {dict.jobDetails.qualificationsRequirements}
          </h3>
          <ul className="space-y-3">
            {requirements.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-text-secondary">
                <span className="w-5 h-5 rounded-md bg-surface-secondary border border-border flex items-center justify-center text-text-secondary shrink-0 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Nice to Have & Benefits */}
      {(niceToHave.length > 0 || benefits.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
          {niceToHave.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
                {dict.jobDetails.bonusNiceToHave}
              </h4>
              <ul className="space-y-2">
                {niceToHave.map((item, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-text-secondary flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/60 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {benefits.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
                {dict.jobDetails.perksBenefits}
              </h4>
              <ul className="space-y-2">
                {benefits.map((item, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-text-secondary flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Bottom Apply Card Banner */}
      {applyUrl && (
        <div className="pt-6 border-t border-border">
          <div className="p-6 rounded-2xl bg-hero-gradient border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-text-primary">
                Interested in this role at {job.company}?
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Apply directly on the employer or source portal to submit your candidacy.
              </p>
            </div>
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent text-accent-foreground font-semibold px-6 py-3 rounded-xl hover:bg-accent-dark active:scale-[0.99] transition-all flex items-center gap-2 shadow-sm text-sm shrink-0"
            >
              <span>{dict.jobDetails.applyNow}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
