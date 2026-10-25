"use client";

import React, { useState, useMemo } from "react";
import { MOCK_JOBS } from "@/lib/mock-jobs";
import { Job } from "@/types/database";
import { SearchControls } from "@/components/find-jobs/SearchControls";
import { JobFilters, type ScoreThreshold, type SortOption } from "@/components/find-jobs/JobFilters";
import { JobsTable } from "@/components/find-jobs/JobsTable";
import { JobsPagination } from "@/components/find-jobs/JobsPagination";
import { CloudDownload, Loader2 } from "lucide-react";

const PAGE_SIZE = 6;

interface FindJobsContainerProps {
  initialJobs?: Job[];
  defaultJobTitle?: string;
  defaultLocation?: string;
}

export function FindJobsContainer({
  initialJobs = [],
  defaultJobTitle = "Frontend Engineer",
  defaultLocation = "Montreal, QC",
}: FindJobsContainerProps) {
  // Use DB jobs if present, fallback to MOCK_JOBS for initial preview
  const [jobs, setJobs] = useState<Job[]>(
    initialJobs.length > 0 ? initialJobs : MOCK_JOBS
  );

  // Search state
  const [jobTitle, setJobTitle] = useState(defaultJobTitle);
  const [location, setLocation] = useState(defaultLocation);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showBanner, setShowBanner] = useState(initialJobs.length > 0);
  const [bannerMessage, setBannerMessage] = useState(
    initialJobs.length > 0
      ? `Loaded ${initialJobs.length} saved jobs from your profile database.`
      : "Found 8 jobs and saved 4 strong matches."
  );

  // Search caching and pagination tracking
  const [lastSearch, setLastSearch] = useState<{ title: string; location: string } | null>(
    initialJobs.length > 0 ? { title: defaultJobTitle, location: defaultLocation } : null
  );
  const [searchPage, setSearchPage] = useState(1);

  // Filter and pagination state
  const [filterText, setFilterText] = useState("");
  const [threshold, setThreshold] = useState<ScoreThreshold>("all");
  const [sortBy, setSortBy] = useState<SortOption>("match_score");
  const [currentPage, setCurrentPage] = useState(1);

  // Search Handler
  const handleSearch = async () => {
    const cleanTitle = jobTitle.trim();
    const cleanLocation = location.trim();

    if (!cleanTitle) return;

    // Same search guard: if unchanged, avoid external API calls
    if (
      lastSearch &&
      lastSearch.title.toLowerCase() === cleanTitle.toLowerCase() &&
      lastSearch.location.toLowerCase() === cleanLocation.toLowerCase()
    ) {
      setShowBanner(true);
      setBannerMessage("Showing existing saved jobs for this query. Use 'Load 10 More from Web' below to find new listings.");
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch("/api/agent/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: cleanTitle,
          location: cleanLocation,
          page: 1,
          forceRefresh: false,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to search for jobs.");
      }

      if (data.jobs && data.jobs.length > 0) {
        setJobs(data.jobs);
      }

      setLastSearch({ title: cleanTitle, location: cleanLocation });
      setSearchPage(1);
      setShowBanner(true);

      if (data.fromCache) {
        setBannerMessage(`Loaded ${data.jobsFound} saved jobs from the database matching '${cleanTitle}'.`);
      } else {
        setBannerMessage(`Found ${data.jobsFound} jobs via ${data.providerUsed} and saved ${data.jobsSaved} strong matches.`);
      }

      setCurrentPage(1);
    } catch (err: any) {
      console.error("Search error:", err);
      setShowBanner(true);
      setBannerMessage(err?.message || "Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Load More from Web Handler (On Demand Pagination)
  const handleLoadMoreWeb = async () => {
    const cleanTitle = jobTitle.trim();
    const cleanLocation = location.trim();
    if (!cleanTitle || isLoadingMore) return;

    setIsLoadingMore(true);
    const nextPage = searchPage + 1;

    try {
      const res = await fetch("/api/agent/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: cleanTitle,
          location: cleanLocation,
          page: nextPage,
          forceRefresh: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load more jobs.");
      }

      if (data.jobs && data.jobs.length > 0) {
        setJobs(data.jobs);
      }

      setSearchPage(nextPage);
      setShowBanner(true);
      setBannerMessage(`Loaded ${data.jobsFound} additional listings from web. Saved ${data.jobsSaved} new unique matches.`);
    } catch (err: any) {
      console.error("Load more error:", err);
      setShowBanner(true);
      setBannerMessage(err?.message || "Could not fetch additional listings.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Filter & sort logic
  const filteredAndSortedJobs = useMemo(() => {
    let result = [...jobs];

    // Text filtering
    if (filterText.trim()) {
      const q = filterText.toLowerCase().trim();
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          (job.location ? job.location.toLowerCase().includes(q) : false) ||
          (Array.isArray(job.matched_skills) && job.matched_skills.some((s) => s.toLowerCase().includes(q)))
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
  }, [jobs, filterText, threshold, sortBy]);

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
      {/* Search Controls Card with Feedback Banner */}
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

      {/* Pagination Bar with On-Demand Load More from Web */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          onClick={handleLoadMoreWeb}
          disabled={isLoadingMore || isSearching}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg text-text-primary bg-surface border border-border hover:bg-surface-hover hover:border-accent/40 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isLoadingMore ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              <span>Fetching from web...</span>
            </>
          ) : (
            <>
              <CloudDownload className="w-4 h-4 text-accent" />
              <span>Load 10 More from Web</span>
            </>
          )}
        </button>

        <JobsPagination
          currentPage={activePage}
          totalPages={totalPages}
          totalResults={totalResults}
          pageSize={PAGE_SIZE}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </div>
    </div>
  );
}
