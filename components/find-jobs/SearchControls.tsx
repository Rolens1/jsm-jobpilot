"use client";

import React from "react";
import { Search, MapPin, Loader2, CheckCircle2, X, Sparkles } from "lucide-react";

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
            placeholder="Job title, keywords, or skills"
            aria-label="Job title"
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
            placeholder="Location, city, or Remote"
            aria-label="Location"
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
              <span>Finding Jobs...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Find Jobs</span>
            </>
          )}
        </button>
      </form>

      {/* Success Notification Banner */}
      {showBanner && (
        <div
          role="status"
          className="mt-4 bg-success-lightest border border-success/30 text-success-dark font-medium rounded-xl p-3.5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            <span className="text-sm font-medium">{bannerMessage}</span>
          </div>
          {onDismissBanner && (
            <button
              type="button"
              onClick={onDismissBanner}
              aria-label="Dismiss notification"
              className="text-success-dark/70 hover:text-success-dark p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
