"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
};

export function JobsPagination({
  currentPage,
  totalPages,
  totalResults,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Props) {
  if (totalResults === 0) return null;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalResults);

  // Generate page numbers
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="w-full bg-surface rounded-2xl border border-border px-5 py-3.5 sm:px-6 sm:py-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
      {/* Slice Counter and Page Size Selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs sm:text-sm text-text-secondary">
          Showing{" "}
          <span className="font-semibold text-text-primary">{startIdx}</span> to{" "}
          <span className="font-semibold text-text-primary">{endIdx}</span> of{" "}
          <span className="font-semibold text-text-primary">{totalResults}</span> results
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Results per page"
            className="bg-surface-secondary/70 border border-border rounded-lg px-2 py-1 text-xs font-medium text-text-secondary hover:text-text-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer transition-all"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
          </select>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          className="px-3 py-1.5 rounded-xl border border-border text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1">
          {pages.map((page) => {
            const isActive = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Page ${page}`}
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs sm:text-sm transition-all cursor-pointer ${
                  isActive
                    ? "border-2 border-accent text-accent bg-accent-muted font-bold shadow-xs"
                    : "border border-border text-text-secondary hover:text-text-primary hover:bg-surface-secondary font-medium"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className="px-3 py-1.5 rounded-xl border border-border text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
