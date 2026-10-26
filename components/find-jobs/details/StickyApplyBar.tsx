"use client";

import React, { useEffect, useState } from "react";
import { Job } from "@/types/database";
import { ExternalLink, Sparkles } from "lucide-react";
import { useTranslation } from "@/components/providers/LanguageProvider";

interface StickyApplyBarProps {
  job: Job;
}

export function StickyApplyBar({ job }: StickyApplyBarProps) {
  const { dict } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar once user scrolls past 240px
      if (window.scrollY > 240) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Check initial scroll in case user reloads mid-page
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const applyUrl = job.external_apply_url || job.source_url;
  if (!applyUrl) return null;

  const isHighMatch = job.match_score >= 80;
  const isMedMatch = job.match_score >= 60 && job.match_score < 80;
  const companyInitial = job.company ? job.company.charAt(0).toUpperCase() : "J";

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border py-3.5 px-4 sm:px-8 shadow-2xl transition-all duration-300 ease-in-out ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Job Summary */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-accent-muted border border-border flex items-center justify-center font-bold text-sm text-accent shrink-0 shadow-2xs">
            {companyInitial}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-text-primary truncate">
              {job.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-text-secondary truncate mt-0.5">
              <span className="font-medium text-text-primary truncate">{job.company}</span>
              {job.location && (
                <>
                  <span>&bull;</span>
                  <span className="truncate">{job.location}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Score Pill & Apply CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs ${
              isHighMatch
                ? "bg-success-lightest border-success/30 text-success-dark"
                : isMedMatch
                ? "bg-info-lightest border-info/30 text-info-dark"
                : "bg-warning-lightest border-warning/30 text-warning-dark"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{job.match_score}% {dict.jobDetails.matchScoreLabel}</span>
          </div>

          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-accent-foreground font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:bg-accent-dark active:scale-[0.99] transition-all flex items-center gap-2 shadow-sm text-xs sm:text-sm shrink-0"
          >
            <span>{dict.jobDetails.applyNow}</span>
            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
