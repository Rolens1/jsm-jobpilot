import type { DailyCountPoint } from "@/lib/dashboard-mock-data";

interface Props {
  data: DailyCountPoint[];
}

export function CompanyResearchChart({ data }: Props) {
  // Chart dimensions
  const svgWidth = 520;
  const svgHeight = 220;
  const marginLeft = 35;
  const marginRight = 20;
  const marginTop = 20;
  const marginBottom = 30;

  const plotWidth = svgWidth - marginLeft - marginRight;
  const plotHeight = svgHeight - marginTop - marginBottom;

  const maxCount = Math.max(0, ...(data || []).map((d) => d.count));
  const maxY = Math.max(12, Math.ceil(maxCount / 3) * 3);
  const step = maxY / 4;
  const yTicks = [maxY, Math.round(step * 3), Math.round(step * 2), Math.round(step), 0];

  const stepX = plotWidth / (data?.length || 1);
  const barWidth = 28;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      {/* Card Header */}
      <div>
        <h2 className="text-base font-semibold text-text-primary">
          Company Research Activity
        </h2>
      </div>

      {/* Responsive SVG Chart */}
      <div className="mt-4 w-full aspect-[520/220] min-h-[200px]">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          role="img"
          aria-label="Company Research Activity Bar Chart"
        >
          {/* Horizontal dashed grid lines and Y-axis labels */}
          {yTicks.map((tick) => {
            const y = marginTop + ((maxY - tick) / maxY) * plotHeight;
            return (
              <g key={tick}>
                <text
                  x={marginLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-text-muted text-[12px] font-normal"
                >
                  {tick}
                </text>
                <line
                  x1={marginLeft}
                  y1={y}
                  x2={svgWidth - marginRight}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              </g>
            );
          })}

          {/* Daily Bars */}
          {data.map((item, index) => {
            const centerX = marginLeft + (index + 0.5) * stepX;
            const barX = centerX - barWidth / 2;
            const barHeight = Math.max((item.count / maxY) * plotHeight, 2);
            const barY = marginTop + plotHeight - barHeight;

            return (
              <g key={item.day} className="group cursor-pointer">
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  className="fill-info hover:fill-info-medium transition-colors"
                >
                  <title>{`${item.day}: ${item.count} companies researched`}</title>
                </rect>

                {/* X-axis day label */}
                <text
                  x={centerX}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  className="fill-text-muted text-[12px] font-normal"
                >
                  {item.day}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
