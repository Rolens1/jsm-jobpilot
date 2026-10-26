"use client";

import { DASHBOARD_MOCK_DATA, type DashboardData, type StatMetric } from "@/lib/dashboard-mock-data";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { CompanyResearchChart } from "@/components/dashboard/CompanyResearchChart";
import { JobsFoundChart } from "@/components/dashboard/JobsFoundChart";
import { MatchScoreDistributionChart } from "@/components/dashboard/MatchScoreDistributionChart";

interface Props {
  initialData?: DashboardData;
  initialStats?: StatMetric[];
}

export function DashboardContainer({
  initialData = DASHBOARD_MOCK_DATA,
  initialStats,
}: Props) {
  const stats = initialStats ?? initialData.stats;

  return (
    <div className="w-full space-y-6">
      {/* 1. Top Performance Metrics Grid */}
      <StatsBar metrics={stats} />

      {/* 2. Middle Row: Recent Activity & Company Research Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <RecentActivity activities={initialData.recentActivity} />
        <CompanyResearchChart data={initialData.companyResearchActivity} />
      </div>

      {/* 3. Bottom Row: Jobs Found Over Time (wide) & Match Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 xl:col-span-8">
          <JobsFoundChart data={initialData.jobsFoundTimeline} />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <MatchScoreDistributionChart data={initialData.matchScoreDistribution} />
        </div>
      </div>
    </div>
  );
}
