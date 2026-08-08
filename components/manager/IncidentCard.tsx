import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { IncidentRow } from "@/lib/supabase/types";

const SEVERITY_BADGE: Record<string, "safe" | "warning" | "critical" | "info"> = {
  near_miss: "info",
  first_aid: "warning",
  medical_treatment: "warning",
  lost_time: "critical",
  serious: "critical",
  fatality: "critical",
};

export function IncidentCard({ incident }: { incident: IncidentRow }) {
  return (
    <Link
      href={`/manager/incidents/${incident.id}`}
      className="block bg-[var(--color-bg-secondary)] p-5 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-heading-sm">{incident.title}</p>
        <Badge status={SEVERITY_BADGE[incident.severity] || "info"}>{incident.severity.replace(/_/g, " ")}</Badge>
      </div>
      {incident.description && (
        <p className="text-body-sm text-[var(--color-text-secondary)] line-clamp-2">{incident.description}</p>
      )}
      <p className="text-mono-sm text-[var(--color-text-tertiary)]">
        {new Date(incident.created_at).toLocaleDateString()}
        {incident.zone && ` · ${incident.zone}`}
      </p>
    </Link>
  );
}
