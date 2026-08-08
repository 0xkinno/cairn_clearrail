import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DashboardWalletControl } from "@/components/worker/DashboardWalletControl";

const RISK_BADGE: Record<string, "safe" | "warning" | "critical" | "info"> = {
  safe: "safe",
  low: "safe",
  elevated: "warning",
  high: "critical",
  critical: "critical",
};

export default async function WorkerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: worker } = await admin
    .from("workers")
    .select("id, full_name, safety_score, current_streak, total_checkins")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!worker) redirect("/onboarding");

  const { data: recentCheckins } = await admin
    .from("checkins")
    .select("id, overall_risk, hazards_count, zone, created_at")
    .eq("worker_id", worker.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="premium-bg min-h-screen relative overflow-hidden pb-16">
      {/* Grid Pattern */}
      <div className="absolute inset-0 grid-pattern opacity-[0.25] pointer-events-none" />
      
      <div className="relative z-10 px-6 md:px-10 py-10 max-w-5xl mx-auto flex flex-col gap-8">
        <DashboardWalletControl />
        
        {/* Editorial Cover Banner */}
        <div className="relative h-60 w-full overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/worker_banner.jpg"
            alt="Safety Dashboard Banner"
            className="w-full h-full object-cover select-none filter saturate-[0.8] brightness-[0.9]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,18,16,0.55)] to-transparent pointer-events-none" />
          
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
            <div className="text-left">
              <p className="text-mono-sm text-[rgba(255,255,255,0.75)] tracking-widest font-semibold uppercase mb-1">Worker Account</p>
              <h1 className="text-display-md font-serif font-bold text-white leading-tight">{worker.full_name}</h1>
            </div>
            <Link href="/worker/checkin" className="relative z-20">
              <Button className="!bg-[var(--color-accent)] !border-[var(--color-accent)] !text-[var(--color-text-inverse)] hover:!bg-[var(--color-accent-hover)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md">
                New check-in
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="premium-panel p-6 flex flex-col justify-between hover:scale-[1.02] duration-300">
            <div>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] inline-block mr-2" />
              <span className="text-mono-sm text-[var(--color-text-tertiary)] uppercase tracking-wider font-semibold">Safety Score</span>
            </div>
            <p className="text-stat text-[var(--color-text-primary)] font-serif font-bold mt-4 leading-none">
              {Number(worker.safety_score ?? 50).toFixed(0)}
            </p>
          </div>

          <div className="premium-panel p-6 flex flex-col justify-between hover:scale-[1.02] duration-300">
            <div>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] inline-block mr-2" />
              <span className="text-mono-sm text-[var(--color-text-tertiary)] uppercase tracking-wider font-semibold">Day Streak</span>
            </div>
            <p className="text-stat text-[var(--color-text-primary)] font-serif font-bold mt-4 leading-none">
              {worker.current_streak}
            </p>
          </div>

          <div className="premium-panel p-6 flex flex-col justify-between hover:scale-[1.02] duration-300">
            <div>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] inline-block mr-2" />
              <span className="text-mono-sm text-[var(--color-text-tertiary)] uppercase tracking-wider font-semibold">Total Check-Ins</span>
            </div>
            <p className="text-stat text-[var(--color-text-primary)] font-serif font-bold mt-4 leading-none">
              {worker.total_checkins}
            </p>
          </div>
        </div>

        {/* Recent Check-ins */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-mono-lg font-bold text-[var(--color-accent)] tracking-widest text-xs md:text-sm uppercase">Recent check-ins</span>
          </div>

          {!recentCheckins || recentCheckins.length === 0 ? (
            <div className="premium-panel p-8 text-center bg-[rgba(255,255,253,0.7)] backdrop-blur-md border border-[var(--color-border)] rounded-2xl">
              <EmptyState
                title="No check-ins yet"
                description="Complete your first daily check-in to start building your safety record."
                action={
                  <Link href="/worker/checkin">
                    <Button>Start check-in</Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentCheckins.map((c) => (
                <Link
                  key={c.id}
                  href={`/worker/checkin/${c.id}`}
                  className="group premium-panel flex items-center justify-between p-5 hover:-translate-y-0.5 hover:shadow-md bg-[rgba(255,255,253,0.75)] hover:border-[rgba(212,148,10,0.3)] duration-200"
                >
                  <div className="text-left">
                    <p className="text-body-md font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                      {new Date(c.created_at).toLocaleString()}
                    </p>
                    <p className="text-body-sm text-[var(--color-text-tertiary)] mt-1.5">
                      {c.zone || "No zone specified"} &middot; {c.hazards_count} hazard{c.hazards_count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Badge status={RISK_BADGE[c.overall_risk] || "info"}>{c.overall_risk}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
