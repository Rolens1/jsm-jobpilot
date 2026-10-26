"use client";

import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import type { ActivityEvent } from "@/lib/dashboard-mock-data";
import { useTranslation } from "@/components/providers/LanguageProvider";

interface Props {
  activities: ActivityEvent[];
}

export function RecentActivity({ activities }: Props) {
  const { dict } = useTranslation();
  const hasActivities = activities && activities.length > 0;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <h2 className="text-base font-semibold text-text-primary">
          {dict.dashboard.recentActivityTitle}
        </h2>
        {hasActivities && (
          <Link
            href="/find-jobs"
            className="text-xs font-semibold text-accent hover:text-accent-dark transition-colors inline-flex items-center gap-0.5"
          >
            {dict.dashboard.viewAll} <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Activity Timeline or Empty State */}
      <div className="mt-6 relative flex-1">
        {!hasActivities ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-border flex items-center justify-center text-text-muted mb-3 shadow-2xs">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-text-primary">
              {dict.dashboard.noActivityTitle}
            </p>
            <p className="text-xs text-text-muted max-w-xs mt-1">
              {dict.dashboard.noActivitySubtitle}
            </p>
            <Link
              href="/find-jobs"
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-secondary border border-border text-xs font-medium text-text-primary transition-colors cursor-pointer"
            >
              {dict.dashboard.startSearchCta} <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
            </Link>
          </div>
        ) : (
          <>
            {/* Continuous vertical timeline connector line */}
            <div
              aria-hidden="true"
              className="absolute left-[7px] top-3 bottom-3 w-[2px] bg-border-light"
            />

            <div className="space-y-6 relative">
              {activities.map((item) => {
                const outerDotClasses =
                  item.dotColor === "accent"
                    ? "bg-accent-light"
                    : item.dotColor === "info"
                    ? "bg-info-light"
                    : "bg-success-light";

                const innerDotClasses =
                  item.dotColor === "accent"
                    ? "bg-accent"
                    : item.dotColor === "info"
                    ? "bg-info"
                    : "bg-success-alt";

                return (
                  <div key={item.id} className="flex items-start gap-3.5 group">
                    {/* Double ring indicator dot */}
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 z-10 ${outerDotClasses}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${innerDotClasses}`} />
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0 -mt-0.5">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {item.timestamp}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

