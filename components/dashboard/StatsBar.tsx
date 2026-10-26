import type { StatMetric } from "@/lib/dashboard-mock-data";

interface Props {
  metrics: StatMetric[];
}

export function StatsBar({ metrics }: Props) {
  return (
    <section aria-label="Key Performance Metrics" className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <p className="text-sm font-medium text-text-secondary">
                {metric.label}
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
              ) : metric.subtitle ? (
                <span className="text-xs text-text-muted">
                  {metric.subtitle}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
