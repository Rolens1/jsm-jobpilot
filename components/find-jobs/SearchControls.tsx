"use client";

import React from "react";
import { Search, MapPin, Loader2, CheckCircle2, X, Sparkles, ShieldAlert, AlertTriangle, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/components/providers/LanguageProvider";

type Props = {
  jobTitle: string;
  onJobTitleChange: (val: string) => void;
  location: string;
  onLocationChange: (val: string) => void;
  onSearch: (e?: React.FormEvent) => void;
  isSearching: boolean;
  showBanner: boolean;
  bannerMessage?: string;
  onDismissBanner?: () => void;
};

export function SearchControls({
  jobTitle,
  onJobTitleChange,
  location,
  onLocationChange,
  onSearch,
  isSearching,
  showBanner,
  bannerMessage = "Found 8 jobs and saved 4 strong matches.",
  onDismissBanner,
}: Props) {
  const { dict } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(e);
  };

  return (
    <div className="w-full bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center">
        {/* Job Title Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => onJobTitleChange(e.target.value)}
            placeholder={dict.findJobs.searchTitlePlaceholder}
            aria-label={dict.findJobs.searchTitleLabel}
            className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-surface-secondary/70 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
          />
        </div>

        {/* Location Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
            <MapPin className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder={dict.findJobs.searchLocationPlaceholder}
            aria-label={dict.findJobs.searchLocationLabel}
            className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-surface-secondary/70 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSearching}
          className="bg-accent text-accent-foreground font-semibold px-6 py-2.5 sm:py-3 rounded-xl hover:bg-accent-dark transition-colors flex items-center justify-center gap-2 shadow-sm shrink-0 disabled:opacity-75 cursor-pointer text-sm"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{dict.findJobs.searching}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{dict.findJobs.searchButton}</span>
            </>
          )}
        </button>
      </form>
      <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-2.5">
        <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" />
        <span>Demo Quota: 3 job searches per 10 minutes to protect live API quotas.</span>
      </div>

      {/* Feedback Banner */}
      {showBanner && (() => {
        const isRateLimited = bannerMessage.toLowerCase().includes("rate limit");
        const isError = bannerMessage.toLowerCase().includes("failed") || bannerMessage.toLowerCase().includes("error");

        return (
          <div
            role="status"
            className={`mt-4 rounded-xl p-3.5 sm:p-4 flex items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200 ${
              isRateLimited
                ? "bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200"
                : isError
                ? "bg-error/10 border border-error/20 text-error"
                : "bg-success-lightest border border-success/30 text-success-dark font-medium"
            }`}
          >
            <div className="flex items-start sm:items-center gap-2.5">
              {isRateLimited ? (
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              ) : isError ? (
                <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5 sm:mt-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5 sm:mt-0" />
              )}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                {isRateLimited && (
                  <span className="inline-block self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    Demo Quota Guard
                  </span>
                )}
                <span className="text-xs sm:text-sm font-medium">{bannerMessage}</span>
              </div>
            </div>
            {onDismissBanner && (
              <button
                type="button"
                onClick={onDismissBanner}
                aria-label="Dismiss notification"
                className="opacity-70 hover:opacity-100 p-1 rounded-lg transition-opacity cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })()}
    </div>
  );
}
