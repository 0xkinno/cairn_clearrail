import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertManagerCanAccessWorker } from "@/lib/supabase/manager-guard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/shared/EmptyState";

const RISK_BADGE: Record<string, "safe" | "warning" | "critical" | "info"> = {
  safe: "safe",
  low: "safe",
  elevated: "warning",
  high: "critical",
  critical: "critical",
};

export default async function ManagerWorkerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await assertManagerCanAccessWorker(id);
  if (result.error) notFound();
  const { admin } = result;

  const [{ data: worker }, { data: checkins }, { data: credentials }] = await Promise.all([
    admin.from("workers").select("*").eq("id", id).maybeSingle(),
    admin
      .from("checkins")
      .select("id, overall_risk, hazards_count, zone, created_at")
      .eq("worker_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    admin.from("credentials").select("id, title, status").eq("worker_id", id).limit(10),
  ]);

  if (!worker) notFound();

  return (
    <div className="px-6 md:px-10 py-12 max-w-2xl mx-auto flex flex-col gap-10">
      <div>
        <p className="text-mono-md text-[var(--color-text-tertiary)] mb-1">{worker.trade || "General worker"}</p>
        <h1 className="text-display-md">{worker.full_name}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-[var(--color-bg-secondary)] p-6">
          <p className="text-stat">{Number(worker.safety_score ?? 50).toFixed(0)}</p>
          <p className="text-mono-sm text-[var(--color-text-tertiary)]">Safety Score</p>
        </div>
        <div className="bg-[var(--color-bg-secondary)] p-6">
          <p className="text-stat">{worker.current_streak}</p>
          <p className="text-mono-sm text-[var(--color-text-tertiary)]">Day Streak</p>
        </div>
        <div className="bg-[var(--color-bg-secondary)] p-6">
          <p className="text-stat">{worker.total_checkins}</p>
          <p className="text-mono-sm text-[var(--color-text-tertiary)]">Check-ins</p>
        </div>
        <div className="bg-[var(--color-bg-secondary)] p-6">
          <p className="text-stat">{credentials?.length || 0}</p>
          <p className="text-mono-sm text-[var(--color-text-tertiary)]">Credentials</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-heading-sm">Recent check-ins</p>
        {!checkins || checkins.length === 0 ? (
          <EmptyState title="No check-ins yet" />
        ) : (
          <div className="flex flex-col gap-3">
            {checkins.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-[var(--color-bg-secondary)] p-5">
                <div>
                  <p className="text-body-md">{new Date(c.created_at).toLocaleString()}</p>
                  <p className="text-body-sm text-[var(--color-text-tertiary)]">
                    {c.zone || "No zone"} · {c.hazards_count} hazard{c.hazards_count === 1 ? "" : "s"}
                  </p>
                </div>
                <Badge status={RISK_BADGE[c.overall_risk] || "info"}>{c.overall_risk}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
