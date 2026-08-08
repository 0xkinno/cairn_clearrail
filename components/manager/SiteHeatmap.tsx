"use client";

import { useMemo } from "react";
import { scaleLinear } from "d3-scale";
import { EmptyState } from "@/components/shared/EmptyState";

interface ZoneHazardCount {
  zone: string;
  count: number;
}

export function SiteHeatmap({ data }: { data: ZoneHazardCount[] }) {
  const sorted = useMemo(() => [...data].sort((a, b) => b.count - a.count), [data]);
  const maxCount = Math.max(...sorted.map((d) => d.count), 1);

  const widthScale = scaleLinear().domain([0, maxCount]).range([4, 100]);
  const colorScale = scaleLinear<string>()
    .domain([0, maxCount * 0.5, maxCount])
    .range(["var(--color-status-safe)", "var(--color-status-warning)", "var(--color-status-critical)"]);

  if (sorted.length === 0) {
    return <EmptyState title="No zone data yet" description="Hazard density by site zone will appear here once check-ins include a zone." />;
  }

  return (
    <div className="flex flex-col gap-4">
      {sorted.map((d) => (
        <div key={d.zone} className="flex items-center gap-4">
          <p className="text-mono-sm text-[var(--color-text-tertiary)] w-32 shrink-0 truncate">{d.zone}</p>
          <div className="flex-1 bg-[var(--color-bg-tertiary)] h-6">
            <div
              className="h-6"
              style={{ width: `${widthScale(d.count)}%`, background: colorScale(d.count) }}
            />
          </div>
          <p className="text-mono-sm text-[var(--color-text-tertiary)] w-8 text-right">{d.count}</p>
        </div>
      ))}
    </div>
  );
}
