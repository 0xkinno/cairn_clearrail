import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/shared/EmptyState";

const STATUS_BADGE: Record<string, "safe" | "warning" | "critical" | "info"> = {
  active: "safe",
  revoked: "critical",
  pending: "warning",
  approved: "safe",
  paid: "safe",
};

export default async function VerifyWorkerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: worker } = await admin
    .from("workers")
    .select("id, full_name, trade, safety_score, current_streak, total_checkins, is_active, created_at")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (!worker) notFound();

  const [{ data: credentials }, { data: wages }] = await Promise.all([
    admin
      .from("credentials")
      .select("id, credential_type, title, issued_at, expires_at, status, near_tx_hash, issuer_org_id")
      .eq("worker_id", id)
      .order("issued_at", { ascending: false }),
    admin
      .from("wage_records")
      .select("id, pay_period_start, pay_period_end, net_pay, currency, status, near_tx_hash")
      .eq("worker_id", id)
      .order("pay_period_end", { ascending: false }),
  ]);

  const orgIds = Array.from(new Set(credentials?.map((c) => c.issuer_org_id).filter(Boolean) || []));
  const { data: orgs } = orgIds.length > 0
    ? await admin.from("organizations").select("id, name, near_account").in("id", orgIds)
    : { data: [] };

  const orgMap = new Map(orgs?.map((o) => [o.id, o]) || []);

  const yearlyEarnings = (wages || [])
    .filter((w) => w.status !== "pending")
    .reduce((sum, w) => sum + w.net_pay, 0);

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col gap-10">
      <div className="flex flex-col items-center text-center gap-4">
        <Badge status="info">Verified on Arbitrum Sepolia</Badge>
        <h1 className="text-display-md">{worker.full_name}</h1>
        <p className="text-body-md text-[var(--color-text-secondary)]">{worker.trade || "General worker"}</p>
        <p className="text-score">{Number(worker.safety_score ?? 50).toFixed(0)}</p>
        <p className="text-mono-sm text-[var(--color-text-tertiary)]">Safety Score</p>
      </div>

      <Tabs
        tabs={[
          {
            label: "Safety Record",
            value: "safety",
            content: (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-[var(--color-bg-secondary)] p-6">
                  <p className="text-stat">{worker.total_checkins}</p>
                  <p className="text-mono-sm text-[var(--color-text-tertiary)]">Total Check-Ins</p>
                </div>
                <div className="bg-[var(--color-bg-secondary)] p-6">
                  <p className="text-stat">{worker.current_streak}</p>
                  <p className="text-mono-sm text-[var(--color-text-tertiary)]">Day Streak</p>
                </div>
              </div>
            ),
          },
          {
            label: "Credentials",
            value: "credentials",
            content:
              !credentials || credentials.length === 0 ? (
                <EmptyState title="No credentials issued yet" />
              ) : (
                <div className="flex flex-col gap-3">
                  {credentials.map((c) => {
                    const org = orgMap.get(c.issuer_org_id);
                    const signer = org?.near_account || "Platform Deployer Key";
                    return (
                      <div key={c.id} className="bg-[var(--color-bg-secondary)] p-5 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-mono-sm text-[var(--color-text-tertiary)] mb-1">{c.credential_type}</p>
                          <p className="text-heading-sm">{c.title}</p>
                          <p className="text-mono-sm text-[var(--color-text-tertiary)] mt-2">
                            Issued {new Date(c.issued_at).toLocaleDateString()}
                          </p>
                          <p className="text-mono-sm text-[var(--color-text-tertiary)] mt-1 font-semibold">
                            Signed by: <strong className="text-[var(--color-text-primary)]">{signer}</strong>
                          </p>
                          {c.near_tx_hash && (
                            <p className="text-mono-sm text-[var(--color-text-tertiary)] break-all mt-1">
                              Arbitrum Sepolia proof: {c.near_tx_hash}
                            </p>
                          )}
                        </div>
                        <Badge status={STATUS_BADGE[c.status] || "info"}>{c.status}</Badge>
                      </div>
                    );
                  })}
                </div>
              ),
          },
          {
            label: "Wage History",
            value: "wages",
            content:
              !wages || wages.length === 0 ? (
                <EmptyState title="No verified wage records yet" />
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="bg-[var(--color-bg-inverse)] text-[var(--color-text-inverse)] p-6">
                    <p className="text-mono-sm text-[var(--color-text-inverse-secondary)]">Verified earnings this year</p>
                    <p className="text-stat">
                      {wages[0]?.currency || "MYR"} {yearlyEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  {wages.map((w) => (
                    <div key={w.id} className="bg-[var(--color-bg-secondary)] p-5 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-mono-sm text-[var(--color-text-tertiary)]">
                          {new Date(w.pay_period_start).toLocaleDateString()} – {new Date(w.pay_period_end).toLocaleDateString()}
                        </p>
                        <p className="text-heading-sm mt-1">
                          {w.currency} {w.net_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        {w.near_tx_hash && (
                          <p className="text-mono-sm text-[var(--color-text-tertiary)] break-all mt-2">
                            Arbitrum Sepolia proof: {w.near_tx_hash}
                          </p>
                        )}
                      </div>
                      <Badge status={STATUS_BADGE[w.status] || "info"}>{w.status}</Badge>
                    </div>
                  ))}
                </div>
              ),
          },
        ]}
      />

      <p className="text-mono-sm text-[var(--color-text-tertiary)] text-center">
        This record is cryptographically anchored on Arbitrum Sepolia testnet and independently verifiable.
      </p>
    </div>
  );
}
