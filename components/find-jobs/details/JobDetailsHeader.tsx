"use client";

import React from "react";
import { Job } from "@/types/database";
import { MapPin, ExternalLink, Sparkles, Building2 } from "lucide-react";
import { useTranslation } from "@/components/providers/LanguageProvider";

interface JobDetailsHeaderProps {
  job: Job;
}

export function JobDetailsHeader({ job }: JobDetailsHeaderProps) {
  const { dict } = useTranslation();
  const isHighMatch = job.match_score >= 80;
  const isMedMatch = job.match_score >= 60 && job.match_score < 80;

  const applyUrl = job.external_apply_url || job.source_url;
  const companyInitial = job.company ? job.company.charAt(0).toUpperCase() : "J";

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        {/* Left: Monogram and Role Title */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent-muted border border-border flex items-center justify-center font-bold text-xl text-accent shrink-0 shadow-2xs">
            {companyInitial}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                {job.title}
              </h1>
              {job.source && (
                <span className="bg-surface-secondary border border-border text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md text-text-secondary">
                  {job.source}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-text-muted" />
                {job.company}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 text-text-secondary">
                <MapPin className="w-3.5 h-3.5 text-text-muted" />
                {job.location || "Location not specified"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Match Score Badge and Apply CTA */}
        <div className="flex items-center gap-3 sm:gap-4 self-start sm:self-center">
          <div
            className={`px-4 py-2 rounded-2xl border flex items-center gap-2 shadow-2xs ${
              isHighMatch
                ? "bg-success-lightest border-success/30 text-success-dark"
                : isMedMatch
                ? "bg-info-lightest border-info/30 text-info-dark"
                : "bg-warning-lightest border-warning/30 text-warning-dark"
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="text-sm font-bold tracking-tight">
              {job.match_score}% {dict.jobDetails.matchScoreLabel}
            </span>
          </div>

          {applyUrl && (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent text-accent-foreground font-semibold px-5 py-2.5 rounded-xl hover:bg-accent-dark active:scale-[0.99] transition-all flex items-center gap-2 shadow-sm text-sm shrink-0"
            >
              <span>{dict.jobDetails.applyNow}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
