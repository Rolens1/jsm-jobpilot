import type { ActivityEvent } from "@/lib/dashboard-mock-data";

interface Props {
  activities: ActivityEvent[];
}

export function RecentActivity({ activities }: Props) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      {/* Card Header */}
      <div className="pb-4 border-b border-border">
        <h2 className="text-base font-semibold text-text-primary">
          Recent Activity
        </h2>
      </div>

      {/* Activity Timeline List */}
      <div className="mt-6 relative flex-1">
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
      </div>
    </div>
  );
}
