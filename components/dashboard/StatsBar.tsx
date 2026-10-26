"use client";

import React from "react";
import type { StatMetric } from "@/lib/dashboard-mock-data";
import { useTranslation } from "@/components/providers/LanguageProvider";

interface Props {
  metrics: StatMetric[];
}

export function StatsBar({ metrics }: Props) {
  const { dict } = useTranslation();

  const getMetricLabels = (metric: StatMetric) => {
    switch (metric.id) {
      case "total-jobs":
        return {
          label: dict.dashboard.statsTotalJobs,
          defaultSub: dict.dashboard.statsTotalJobsSub,
        };
      case "avg-match-rate":
        return {
          label: dict.dashboard.statsAvgMatch,
          defaultSub: dict.dashboard.statsAvgMatchSub,
        };
      case "companies-researched":
        return {
          label: dict.dashboard.statsResearched,
          defaultSub: dict.dashboard.statsResearchedSub,
        };
      case "jobs-this-week":
        return {
          label: dict.dashboard.statsThisWeek,
          defaultSub: dict.dashboard.statsThisWeekSub,
        };
      default:
        return {
          label: metric.label,
          defaultSub: metric.subtitle,
        };
    }
  };

  return (
    <section aria-label="Key Performance Metrics" className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {metrics.map((metric) => {
          const { label, defaultSub } = getMetricLabels(metric);
          return (
            <div
              key={metric.id}
              className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  {label}
                </p>
                <p className="text-3xl font-bold text-text-primary tracking-tight mt-1">
                  {metric.value}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2">
                {metric.trend ? (
                  <>
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-sm bg-success-lightest text-success-darker text-xs font-medium">
                      {metric.trend.value}
                    </span>
                    <span className="text-xs text-text-muted">
                      {metric.trend.label}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-text-muted">
                    {defaultSub || metric.subtitle}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
