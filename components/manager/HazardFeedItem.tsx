import { Badge } from "@/components/ui/Badge";
import type { HazardFlagRow } from "@/lib/supabase/types";

const SEVERITY_BADGE: Record<string, "safe" | "warning" | "critical" | "info"> = {
  low: "info",
  medium: "warning",
  high: "critical",
  critical: "critical",
};

export function HazardFeedItem({ hazard }: { hazard: HazardFlagRow }) {
  return (
    <div className="bg-[var(--color-bg-secondary)] p-5 flex items-start justify-between gap-4">
      <div>
        <p className="text-mono-sm text-[var(--color-text-tertiary)] mb-1">
          {hazard.hazard_type.replace(/_/g, " ")}
          {hazard.zone && ` · ${hazard.zone}`}
        </p>
        <p className="text-body-md">{hazard.description}</p>
        <p className="text-mono-sm text-[var(--color-text-tertiary)] mt-2">
          {new Date(hazard.created_at).toLocaleString()} · {Math.round(hazard.confidence * 100)}% confidence
        </p>
      </div>
      <Badge status={SEVERITY_BADGE[hazard.severity] || "info"}>{hazard.severity}</Badge>
    </div>
  );
}
