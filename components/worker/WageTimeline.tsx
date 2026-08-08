import { Badge } from "@/components/ui/Badge";
import type { WageRecordRow } from "@/lib/supabase/types";

const STATUS_BADGE: Record<string, "safe" | "warning" | "critical" | "info"> = {
  pending: "warning",
  approved: "safe",
  paid: "safe",
};

export function WageTimeline({ records }: { records: WageRecordRow[] }) {
  const yearlyTotal = records
    .filter((r) => r.status !== "pending")
    .reduce((sum, r) => sum + r.net_pay, 0);
  const currency = records[0]?.currency || "MYR";

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[var(--color-bg-inverse)] text-[var(--color-text-inverse)] p-6">
        <p className="text-mono-sm text-[var(--color-text-inverse-secondary)]">Total earnings this year</p>
        <p className="text-stat">
          {currency} {yearlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {records.map((r) => (
          <div key={r.id} className="bg-[var(--color-bg-secondary)] p-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-mono-sm text-[var(--color-text-tertiary)]">
                {new Date(r.pay_period_start).toLocaleDateString()} – {new Date(r.pay_period_end).toLocaleDateString()}
              </p>
              <p className="text-heading-sm mt-1">
                {r.currency} {r.net_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-body-sm text-[var(--color-text-secondary)] mt-1">
                {r.shifts_worked} shifts · {r.hours_total}h
                {r.overtime_hours > 0 && ` (${r.overtime_hours}h overtime)`}
              </p>
              {r.near_tx_hash && (
                <p className="text-mono-sm text-[var(--color-text-tertiary)] break-all mt-2">
                  Verify on NEAR: {r.near_tx_hash}
                </p>
              )}
            </div>
            <Badge status={STATUS_BADGE[r.status] || "info"}>{r.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
