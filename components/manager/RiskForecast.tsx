"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/shared/ErrorState";

interface Intelligence {
  risk_forecast: {
    overall_trend: string;
    risk_level: string;
    confidence: number;
    summary: string;
  };
  patterns_detected: {
    pattern: string;
    frequency: string;
    affected_zones: string[];
    severity: string;
    recommendation: string;
  }[];
  top_risks: { risk: string; probability: string; impact: string; mitigation: string }[];
  weekly_brief: string;
  positive_trends: string[];
}

const TREND_BADGE: Record<string, "safe" | "warning" | "critical" | "info"> = {
  improving: "safe",
  stable: "info",
  deteriorating: "critical",
};

export function RiskForecast({ orgId }: { orgId: string }) {
  const [data, setData] = useState<Intelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ai/intelligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId }),
    })
      .then((r) => r.json())
      .then((body) => {
        if (body.intelligence) setData(body.intelligence);
        else setError(body.error || "Could not generate forecast.");
      })
      .catch(() => setError("Could not generate forecast."))
      .finally(() => setLoading(false));
  }, [orgId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error || !data) return <ErrorState message={error || "No forecast available."} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[var(--color-bg-secondary)] p-6">
        <div className="flex items-center gap-3 mb-3">
          <Badge status={TREND_BADGE[data.risk_forecast.overall_trend] || "info"}>
            {data.risk_forecast.overall_trend}
          </Badge>
          <span className="text-mono-sm text-[var(--color-text-tertiary)]">
            {Math.round(data.risk_forecast.confidence * 100)}% confidence
          </span>
        </div>
        <p className="text-body-md">{data.weekly_brief}</p>
      </div>

      {data.top_risks.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-mono-md text-[var(--color-text-tertiary)]">Top risks</p>
          {data.top_risks.map((r, i) => (
            <div key={i} className="bg-[var(--color-bg-secondary)] p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-body-md">{r.risk}</p>
                <Badge status={r.impact === "critical" || r.impact === "high" ? "critical" : "warning"}>
                  {r.impact} impact
                </Badge>
              </div>
              <p className="text-body-sm text-[var(--color-text-secondary)]">{r.mitigation}</p>
            </div>
          ))}
        </div>
      )}

      {data.positive_trends.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-mono-md text-[var(--color-text-tertiary)]">Positive trends</p>
          <ul className="flex flex-col gap-1">
            {data.positive_trends.map((t, i) => (
              <li key={i} className="text-body-sm text-[var(--color-status-safe)]">
                • {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
