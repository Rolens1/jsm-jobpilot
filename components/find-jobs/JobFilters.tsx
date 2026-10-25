"use client";

import React from "react";
import { Search, X, SlidersHorizontal, ArrowUpDown } from "lucide-react";

export type ScoreThreshold = "all" | "high" | "low";
export type SortOption = "match_score" | "newest" | "oldest";

type Props = {
  filterText: string;
  onFilterTextChange: (val: string) => void;
  threshold: ScoreThreshold;
  onThresholdChange: (val: ScoreThreshold) => void;
  sortBy: SortOption;
  onSortByChange: (val: SortOption) => void;
};

export function JobFilters({
  filterText,
  onFilterTextChange,
  threshold,
  onThresholdChange,
  sortBy,
  onSortByChange,
}: Props) {
  return (
    <div className="w-full bg-surface rounded-2xl border border-border p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
      {/* Quick Text Filter */}
      <div className="relative flex-1 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={filterText}
          onChange={(e) => onFilterTextChange(e.target.value)}
          placeholder="Filter by company or role..."
          aria-label="Filter by company or role"
          className="w-full pl-10 pr-9 py-2 bg-surface-secondary/60 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
        />
        {filterText && (
          <button
            type="button"
            onClick={() => onFilterTextChange("")}
            aria-label="Clear filter"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Select Controls on Right */}
      <div className="flex items-center gap-3 self-end md:self-auto w-full md:w-auto justify-between md:justify-end">
        {/* Match Score Threshold Select */}
        <div className="relative flex items-center">
          <div className="hidden sm:flex items-center mr-2 text-text-secondary text-xs font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1 text-text-muted" />
            <span>Match:</span>
          </div>
          <select
            value={threshold}
            onChange={(e) => onThresholdChange(e.target.value as ScoreThreshold)}
            aria-label="Match score threshold filter"
            className="bg-surface-secondary/60 border border-border rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer transition-all"
          >
            <option value="all">All Matches</option>
            <option value="high">High Match (&ge; 70%)</option>
            <option value="low">Low Match (&lt; 70%)</option>
          </select>
        </div>

        {/* Sort Select */}
        <div className="relative flex items-center">
          <div className="hidden sm:flex items-center mr-2 text-text-secondary text-xs font-medium">
            <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-text-muted" />
            <span>Sort:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SortOption)}
            aria-label="Sort jobs by"
            className="bg-surface-secondary/60 border border-border rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer transition-all"
          >
            <option value="match_score">Match Score</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>
    </div>
  );
}
