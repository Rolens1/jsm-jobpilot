"use client";

import React from "react";
import type { ScoreDistributionBucket } from "@/lib/dashboard-mock-data";
import { useTranslation } from "@/components/providers/LanguageProvider";

interface Props {
  data: ScoreDistributionBucket[];
}

export function MatchScoreDistributionChart({ data }: Props) {
  const { dict } = useTranslation();
  // Chart dimensions
  const svgWidth = 380;
  const svgHeight = 220;
  const marginLeft = 35;
  const marginRight = 15;
  const marginTop = 20;
  const marginBottom = 30;

  const plotWidth = svgWidth - marginLeft - marginRight;
  const plotHeight = svgHeight - marginTop - marginBottom;

  const maxCount = Math.max(0, ...(data || []).map((d) => d.count));
  const maxY =
    maxCount === 0
      ? 100
      : maxCount <= 10
      ? 10
      : maxCount <= 25
      ? 25
      : maxCount <= 50
      ? 50
      : Math.max(100, Math.ceil(maxCount / 25) * 25);

  const yTicks =
    maxY === 10
      ? [10, 8, 6, 4, 2, 0]
      : maxY === 25
      ? [25, 20, 15, 10, 5, 0]
      : [maxY, Math.round((maxY / 4) * 3), Math.round((maxY / 4) * 2), Math.round(maxY / 4), 0];

  const stepX = plotWidth / (data?.length || 1);
  const barWidth = 26;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      {/* Card Header */}
      <div>
        <h2 className="text-base font-semibold text-text-primary">
          {dict.dashboard.chartMatchTitle}
        </h2>
      </div>

      {/* Responsive SVG Distribution Bar Chart */}
      <div className="mt-4 w-full aspect-[380/220] min-h-[200px]">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          role="img"
          aria-label={dict.dashboard.chartMatchTitle}
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

          {/* Distribution Bars */}
          {data.map((item, index) => {
            const centerX = marginLeft + (index + 0.5) * stepX;
            const barX = centerX - barWidth / 2;
            const barHeight = Math.max((item.count / maxY) * plotHeight, 3);
            const barY = marginTop + plotHeight - barHeight;

            return (
              <g key={item.range} className="group cursor-pointer">
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  className="fill-success hover:fill-success-alt transition-colors"
                >
                  <title>{`${item.range}: ${item.count} jobs`}</title>
                </rect>

                {/* X-axis range bucket label */}
                <text
                  x={centerX}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  className="fill-text-muted text-[11px] sm:text-[12px] font-normal"
                >
                  {item.range}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
