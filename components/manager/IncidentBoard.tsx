import { IncidentCard } from "./IncidentCard";
import type { IncidentRow } from "@/lib/supabase/types";

const COLUMNS: { status: string; label: string }[] = [
  { status: "open", label: "Open" },
  { status: "investigating", label: "Investigating" },
  { status: "resolved", label: "Resolved" },
];

export function IncidentBoard({ incidents }: { incidents: IncidentRow[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {COLUMNS.map((col) => {
        const items = incidents.filter((i) => i.status === col.status);
        return (
          <div key={col.status} className="flex flex-col gap-3">
            <p className="text-mono-md text-[var(--color-text-tertiary)]">
              {col.label} ({items.length})
            </p>
            {items.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
