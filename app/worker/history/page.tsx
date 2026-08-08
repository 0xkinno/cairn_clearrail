import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/Button";

import { createAdminClient } from "@/lib/supabase/admin";

const RISK_BADGE: Record<string, "safe" | "warning" | "critical" | "info"> = {
  safe: "safe",
  low: "safe",
  elevated: "warning",
  high: "critical",
  critical: "critical",
};

export default async function CheckInHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: worker } = await admin.from("workers").select("id").eq("user_id", user.id).maybeSingle();
  if (!worker) redirect("/onboarding");

  const { data: checkins } = await admin
    .from("checkins")
    .select("id, overall_risk, hazards_count, zone, created_at")
    .eq("worker_id", worker.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="px-6 md:px-10 py-12 max-w-2xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-display-md">Check-in history</h1>
        <Link href="/worker/checkin">
          <Button>New check-in</Button>
        </Link>
      </div>

      {!checkins || checkins.length === 0 ? (
        <EmptyState
          title="No check-ins yet"
          description="Complete your first daily check-in to start building your safety record."
          action={
            <Link href="/worker/checkin">
              <Button>Start check-in</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {checkins.map((c) => (
            <Link
              key={c.id}
              href={`/worker/checkin/${c.id}`}
              className="flex items-center justify-between bg-[var(--color-bg-secondary)] p-5"
            >
              <div>
                <p className="text-body-md">{new Date(c.created_at).toLocaleString()}</p>
                <p className="text-body-sm text-[var(--color-text-tertiary)]">
                  {c.zone || "No zone specified"} · {c.hazards_count} hazard{c.hazards_count === 1 ? "" : "s"}
                </p>
              </div>
              <Badge status={RISK_BADGE[c.overall_risk] || "info"}>{c.overall_risk}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
