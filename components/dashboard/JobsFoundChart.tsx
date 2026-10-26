import type { DailyCountPoint } from "@/lib/dashboard-mock-data";

interface Props {
  data: DailyCountPoint[];
}

export function JobsFoundChart({ data }: Props) {
  // Chart dimensions
  const svgWidth = 650;
  const svgHeight = 220;
  const marginLeft = 35;
  const marginRight = 20;
  const marginTop = 20;
  const marginBottom = 30;

  const plotWidth = svgWidth - marginLeft - marginRight;
  const plotHeight = svgHeight - marginTop - marginBottom;

  const yTicks = [100, 75, 50, 25, 0];
  const maxY = 100;
  const baselineY = marginTop + plotHeight;

  // Compute coordinate points
  const points = data.map((item, index) => {
    const x = marginLeft + (index / (data.length - 1)) * plotWidth;
    const y = marginTop + ((maxY - item.count) / maxY) * plotHeight;
    return { x, y, ...item };
  });

  // Calculate smooth cubic bezier path
  let pathD = "";
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      pathD += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
  }

  // Close area path down to baseline
  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
      : "";

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      {/* Card Header */}
      <div>
        <h2 className="text-base font-semibold text-text-primary">
          Jobs Found Over Time
        </h2>
      </div>

      {/* Responsive SVG Smooth Spline Chart */}
      <div className="mt-4 w-full aspect-[650/220] min-h-[200px]">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          role="img"
          aria-label="Jobs Found Over Time Area Chart"
        >
          <defs>
            <linearGradient id="purpleSplineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C5CFC" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#7C5CFC" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal dashed grid lines and Y-axis labels */}
          {yTicks.map((tick) => {
            const y = marginTop + ((maxY - tick) / maxY) * plotHeight;
            return (
              <g key={tick}>
                <text
                  x={marginLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#9CA3AF] text-[12px] font-normal"
                >
                  {tick}
                </text>
                <line
                  x1={marginLeft}
                  y1={y}
                  x2={svgWidth - marginRight}
                  y2={y}
                  stroke="#E7EAF3"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              </g>
            );
          })}

          {/* Gradient Area Fill */}
          {areaD && (
            <path
              d={areaD}
              fill="url(#purpleSplineGradient)"
              className="pointer-events-none"
            />
          )}

          {/* Smooth Curve Line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#7C5CFC"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points and X-axis Labels */}
          {points.map((pt) => (
            <g key={pt.day} className="group cursor-pointer">
              {/* Invisible touch/hover target */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={10}
                className="fill-transparent"
              >
                <title>{`${pt.day}: ${pt.count} jobs found`}</title>
              </circle>

              {/* Data Point Dot */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={4}
                className="fill-surface stroke-[#7C5CFC] stroke-[2] opacity-0 group-hover:opacity-100 transition-opacity"
              />

              {/* Day Label */}
              <text
                x={pt.x}
                y={svgHeight - 8}
                textAnchor="middle"
                className="fill-[#9CA3AF] text-[12px] font-normal"
              >
                {pt.day}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
