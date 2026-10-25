"use client";

import React, { useState, useMemo } from "react";
import { MOCK_JOBS } from "@/lib/mock-jobs";
import { SearchControls } from "@/components/find-jobs/SearchControls";
import { JobFilters, type ScoreThreshold, type SortOption } from "@/components/find-jobs/JobFilters";
import { JobsTable } from "@/components/find-jobs/JobsTable";
import { JobsPagination } from "@/components/find-jobs/JobsPagination";

const PAGE_SIZE = 6;

export function FindJobsContainer() {
  // Search state
  const [jobTitle, setJobTitle] = useState("Frontend Engineer");
  const [location, setLocation] = useState("Remote, San Francisco");
  const [isSearching, setIsSearching] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [bannerMessage, setBannerMessage] = useState(
    "Found 8 jobs and saved 4 strong matches."
  );

  // Filter and pagination state
  const [filterText, setFilterText] = useState("");
  const [threshold, setThreshold] = useState<ScoreThreshold>("all");
  const [sortBy, setSortBy] = useState<SortOption>("match_score");
  const [currentPage, setCurrentPage] = useState(1);

  // Simulated search handler
  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setShowBanner(true);
      setBannerMessage("Found 8 jobs and saved 4 strong matches.");
      setCurrentPage(1);
    }, 600);
  };

  // Filter & sort logic
  const filteredAndSortedJobs = useMemo(() => {
    let result = [...MOCK_JOBS];

    // Text filtering
    if (filterText.trim()) {
      const q = filterText.toLowerCase().trim();
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          (job.location ? job.location.toLowerCase().includes(q) : false) ||
          job.matched_skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    // Threshold filtering
    if (threshold === "high") {
      result = result.filter((job) => job.match_score >= 70);
    } else if (threshold === "low") {
      result = result.filter((job) => job.match_score < 70);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "match_score") {
        return b.match_score - a.match_score;
      } else if (sortBy === "newest") {
        return new Date(b.found_at).getTime() - new Date(a.found_at).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.found_at).getTime() - new Date(b.found_at).getTime();
      }
      return 0;
    });

    return result;
  }, [filterText, threshold, sortBy]);

  // Adjust page if filter text shrinks result count below currentPage
  const totalResults = filteredAndSortedJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);

  // Paginated slice
  const paginatedJobs = useMemo(() => {
    const startIdx = (activePage - 1) * PAGE_SIZE;
    return filteredAndSortedJobs.slice(startIdx, startIdx + PAGE_SIZE);
  }, [filteredAndSortedJobs, activePage]);

  // Reset filters
  const handleResetFilters = () => {
    setFilterText("");
    setThreshold("all");
    setSortBy("match_score");
    setCurrentPage(1);
  };

  return (
    <div className="w-full space-y-6">
      {/* Search Controls Card with Success Banner */}
      <SearchControls
        jobTitle={jobTitle}
        onJobTitleChange={setJobTitle}
        location={location}
        onLocationChange={setLocation}
        onSearch={handleSearch}
        isSearching={isSearching}
        showBanner={showBanner}
        bannerMessage={bannerMessage}
        onDismissBanner={() => setShowBanner(false)}
      />

      {/* Filter and Sort Toolbar */}
      <JobFilters
        filterText={filterText}
        onFilterTextChange={(val) => {
          setFilterText(val);
          setCurrentPage(1);
        }}
        threshold={threshold}
        onThresholdChange={(val) => {
          setThreshold(val);
          setCurrentPage(1);
        }}
        sortBy={sortBy}
        onSortByChange={(val) => {
          setSortBy(val);
          setCurrentPage(1);
        }}
      />

      {/* Results Table */}
      <JobsTable jobs={paginatedJobs} onResetFilters={handleResetFilters} />

      {/* Pagination Bar */}
      <JobsPagination
        currentPage={activePage}
        totalPages={totalPages}
        totalResults={totalResults}
        pageSize={PAGE_SIZE}
        onPageChange={(p) => setCurrentPage(p)}
      />
    </div>
  );
}
