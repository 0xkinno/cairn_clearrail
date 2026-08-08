import { Badge } from "@/components/ui/Badge";
import type { HazardAnalysis } from "@/lib/supabase/types";

interface AIAnalysisResultProps {
  analysis: HazardAnalysis;
}

const RISK_BADGE: Record<string, "safe" | "warning" | "critical" | "info"> = {
  safe: "safe",
  low: "safe",
  elevated: "warning",
  high: "critical",
  critical: "critical",
};

const SEVERITY_BADGE: Record<string, "safe" | "warning" | "critical" | "info"> = {
  low: "info",
  medium: "warning",
  high: "critical",
  critical: "critical",
};

export function AIAnalysisResult({ analysis }: AIAnalysisResultProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Badge status={RISK_BADGE[analysis.overall_risk_level] || "info"}>
          {analysis.overall_risk_level.replace("_", " ")} risk
        </Badge>
        {analysis.immediate_action_required && <Badge status="critical">Immediate action required</Badge>}
      </div>

      <p className="text-body-md">{analysis.summary}</p>

      {analysis.hazards_detected.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-mono-md text-[var(--color-text-tertiary)]">
            Hazards detected ({analysis.hazards_detected.length})
          </p>
          {analysis.hazards_detected.map((hazard, i) => (
            <div key={i} className="bg-[var(--color-bg-secondary)] p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-heading-sm">{hazard.item}</p>
                <Badge status={SEVERITY_BADGE[hazard.severity] || "info"}>{hazard.severity}</Badge>
              </div>
              <p className="text-body-sm text-[var(--color-text-secondary)]">{hazard.recommended_action}</p>
              <p className="text-mono-sm text-[var(--color-text-tertiary)]">
                {hazard.location_in_image} · {Math.round(hazard.confidence * 100)}% confidence
              </p>
            </div>
          ))}
        </div>
      )}

      {analysis.positive_observations.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-mono-md text-[var(--color-text-tertiary)]">Positive observations</p>
          <ul className="flex flex-col gap-1">
            {analysis.positive_observations.map((obs, i) => (
              <li key={i} className="text-body-sm text-[var(--color-status-safe)]">
                • {obs}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
