import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

interface RosterWorker {
  id: string;
  full_name: string;
  trade: string | null;
  safety_score: number;
  current_streak: number;
  total_checkins: number;
  near_account: string | null;
}

function scoreBadgeStatus(score: number): "safe" | "warning" | "critical" {
  if (score >= 75) return "safe";
  if (score >= 50) return "warning";
  return "critical";
}

export function WorkerRoster({ workers }: { workers: RosterWorker[] }) {
  return (
    <div className="flex flex-col gap-3">
      {workers.map((w) => (
        <Link
          key={w.id}
          href={`/manager/workers/${w.id}`}
          className="flex items-center justify-between bg-[var(--color-bg-secondary)] p-5"
        >
          <div>
            <p className="text-heading-sm">{w.full_name}</p>
            <p className="text-body-sm text-[var(--color-text-tertiary)]">
              {w.trade || "General worker"} · {w.total_checkins} check-ins · {w.current_streak} day streak
              {w.near_account && " · On-chain"}
            </p>
          </div>
          <Badge status={scoreBadgeStatus(Number(w.safety_score ?? 50))}>{Number(w.safety_score ?? 50).toFixed(0)}</Badge>
        </Link>
      ))}
    </div>
  );
}
