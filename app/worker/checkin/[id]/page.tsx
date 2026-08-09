import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AIAnalysisResult } from "@/components/worker/AIAnalysisResult";
import { Badge } from "@/components/ui/Badge";
import type { HazardAnalysis } from "@/lib/supabase/types";

const RISK_BADGE: Record<string, "safe" | "warning" | "critical" | "info"> = {
  safe: "safe",
  low: "safe",
  elevated: "warning",
  high: "critical",
  critical: "critical",
};

export default async function CheckInDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: checkin } = await admin
    .from("checkins")
    .select("id, worker_id, photo_url, text_note, voice_transcript, overall_risk, hazards_count, ai_analysis, zone, created_at, near_attestation_hash")
    .eq("id", id)
    .maybeSingle();

  if (!checkin) notFound();

  const { data: worker } = await admin
    .from("workers")
    .select("near_account")
    .eq("id", checkin.worker_id)
    .maybeSingle();

  const analysis = checkin.ai_analysis as HazardAnalysis | null;

  return (
    <div className="px-6 md:px-10 py-12 max-w-2xl mx-auto flex flex-col gap-8">
      <div>
        <p className="text-mono-md text-[var(--color-text-tertiary)] mb-1">
          {new Date(checkin.created_at).toLocaleString()}
          {checkin.zone && ` · ${checkin.zone}`}
        </p>
        <div className="flex items-center gap-3">
          <h1 className="text-display-md">Check-in result</h1>
          <Badge status={RISK_BADGE[checkin.overall_risk] || "info"}>{checkin.overall_risk} risk</Badge>
        </div>
      </div>

      {checkin.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={checkin.photo_url} alt="Check-in photo" className="w-full aspect-video object-cover" />
      )}

      {checkin.text_note && <p className="text-body-md">{checkin.text_note}</p>}
      {checkin.voice_transcript && (
        <p className="text-body-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] p-4">
          {checkin.voice_transcript}
        </p>
      )}

      {analysis && <AIAnalysisResult analysis={analysis} />}

      {checkin.near_attestation_hash && (
        <div className="bg-[var(--color-bg-secondary)] p-5 rounded-2xl border border-[var(--color-border-subtle)] flex flex-col gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-status-safe)] animate-pulse" />
            <span className="text-mono-sm text-[var(--color-text-primary)] font-semibold">Attestation anchored on Arbitrum Sepolia</span>
          </div>
          <p className="text-mono-sm text-[var(--color-text-tertiary)] break-all select-all text-xs">Tx Hash: {checkin.near_attestation_hash}</p>
          <a
            href={`https://testnet.nearblocks.io/txns/${checkin.near_attestation_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-mono-sm text-[var(--color-accent)] font-semibold hover:underline mt-1 text-xs"
          >
            View on Arbitrum Sepolia Explorer →
          </a>
        </div>
      )}

      {worker && worker.near_account ? (
        <div className="bg-[rgba(16,185,129,0.06)] p-4 rounded-xl border border-[rgba(16,185,129,0.25)] flex items-start gap-3">
          <span className="text-lg">✅</span>
          <div className="flex flex-col gap-1 text-left">
            <p className="text-body-sm text-[var(--color-text-primary)] font-medium">Signed by your wallet</p>
            <p className="text-body-sm text-[var(--color-text-secondary)] leading-relaxed">
              This daily check-in was signed using your connected Arbitrum Sepolia wallet: <strong className="text-[var(--color-text-primary)]">{worker.near_account}</strong>.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[rgba(212,148,10,0.06)] p-4 rounded-xl border border-[rgba(212,148,10,0.25)] flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <div className="flex flex-col gap-1 text-left">
            <p className="text-body-sm text-[var(--color-text-primary)] font-medium">Server Fallback Signing Used</p>
            <p className="text-body-sm text-[var(--color-text-secondary)] leading-relaxed">
              This daily check-in was signed using the server-side fallback key. Connect your Arbitrum Sepolia wallet in <a href="/worker/settings" className="text-[var(--color-accent)] font-semibold hover:underline">Settings</a> to sign check-ins yourself.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
