"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingPage } from "@/components/shared/LoadingPage";

interface Checkin {
  id: string;
  created_at: string;
  photo_url: string;
  notes?: string;
  worker_id: string;
  near_attestation_hash?: string;
  workers: {
    full_name: string;
    trade: string | null;
    near_account: string | null;
    safety_score: number;
  };
  hazard_flags: Array<{
    id: string;
    hazard_type: string;
    severity: string;
    recommended_action: string;
    iso_clause?: string;
  }>;
}

export default function WorkProofPage() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const res = await fetch("/api/checkins");
      const data = await res.json();
      setCheckins(data.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingPage />;

  return (
    <div className="px-6 md:px-10 py-12 flex flex-col gap-10 max-w-6xl mx-auto text-left">
      {/* Editorial Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
          <span className="text-mono-sm text-[var(--color-accent)] font-semibold tracking-wider uppercase">
            WORKPROOF CORE MOAT
          </span>
        </div>
        <h1 className="text-display-md text-[var(--color-text-primary)] font-serif leading-tight">
          Verified Field WorkProof & AI Hazard Audit
        </h1>
        <p className="text-body-md text-[var(--color-text-secondary)] max-w-3xl leading-relaxed">
          ClearRail does not begin with financial assets — it begins by establishing whether the underlying work, worker identity, site compliance, and obligation are credible. Daily photo check-ins are analyzed by Gemini multimodal AI to compute ISO 45001 hazard scores and attested on Arbitrum Sepolia.
        </p>
      </div>

      {/* Narrative Architecture Banner */}
      <div className="glowing-badge-frame !w-full p-6 !rounded-3xl bg-gradient-to-r from-[rgba(255,255,253,0.95)] via-[rgba(253,246,231,0.9)] to-[rgba(255,255,253,0.95)] border border-[rgba(212,148,10,0.3)] shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-mono-sm">
          <div className="flex items-center gap-2 font-bold text-[var(--color-text-primary)]">
            <span>WORK</span>
            <span className="text-[var(--color-accent)]">→</span>
            <span>CREDENTIAL</span>
            <span className="text-[var(--color-accent)]">→</span>
            <span>COMPLIANCE</span>
            <span className="text-[var(--color-accent)]">→</span>
            <span>OBLIGATION</span>
            <span className="text-[var(--color-accent)]">→</span>
            <span>ESCROW</span>
            <span className="text-[var(--color-accent)]">→</span>
            <span>SETTLEMENT</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-[var(--color-status-safe-bg)] text-[var(--color-status-safe)] font-semibold text-[11px]">
            ARBITRUM SEPOLIA ANCHORED
          </span>
        </div>
      </div>

      {/* Checkins Feed */}
      <div className="flex flex-col gap-6">
        <h2 className="text-heading-md font-serif text-[var(--color-text-primary)]">Verified Check-in WorkProofs</h2>
        
        {checkins.length === 0 ? (
          <div className="border border-[var(--color-border)] rounded-2xl p-8 bg-white/70 text-center text-body-md text-[var(--color-text-tertiary)]">
            No check-in records found. Workers submit check-ins via photo upload from their job site.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {checkins.map((c) => (
              <div
                key={c.id}
                className="border border-[var(--color-border)] rounded-3xl p-6 bg-white/80 backdrop-blur-md shadow-sm flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-heading-sm font-semibold text-[var(--color-text-primary)]">
                      {c.workers?.full_name || "Unknown Worker"}
                    </h3>
                    <p className="text-mono-sm text-[var(--color-text-tertiary)]">
                      {c.workers?.trade || "Industrial Specialist"} • Score: {c.workers?.safety_score || 100}/100
                    </p>
                  </div>
                  <Badge status={c.hazard_flags?.length > 0 ? "warning" : "safe"}>
                    {c.hazard_flags?.length > 0 ? `${c.hazard_flags.length} Hazards Flagged` : "ISO Compliant"}
                  </Badge>
                </div>

                {c.photo_url && (
                  <div className="relative rounded-2xl overflow-hidden h-48 bg-gray-100 border border-[var(--color-border-subtle)]">
                    <img src={c.photo_url} alt="Checkin verification" className="object-cover w-full h-full" />
                  </div>
                )}

                {c.notes && (
                  <p className="text-body-sm text-[var(--color-text-secondary)] italic">
                    "{c.notes}"
                  </p>
                )}

                {/* Hazard List */}
                {c.hazard_flags && c.hazard_flags.length > 0 && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
                    <span className="text-[10px] text-mono-md font-bold text-[var(--color-text-tertiary)] uppercase">
                      Gemini Vision AI Hazard Analysis:
                    </span>
                    {c.hazard_flags.map((h) => (
                      <div key={h.id} className="p-2.5 rounded-xl bg-[var(--color-status-warning-bg)] border border-[rgba(196,135,10,0.2)] text-mono-sm">
                        <div className="flex justify-between font-bold text-[var(--color-status-warning)]">
                          <span>{h.hazard_type.replace(/_/g, " ")}</span>
                          <span>Severity: {h.severity}</span>
                        </div>
                        <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">{h.recommended_action}</p>
                        {h.iso_clause && (
                          <span className="text-[10px] text-[var(--color-text-tertiary)] block mt-1">
                            Clause: {h.iso_clause}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* On-Chain Attestation Footer */}
                <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-3 text-mono-sm text-[11px]">
                  <span className="text-[var(--color-text-tertiary)]">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                  {c.near_attestation_hash ? (
                    <a
                      href={`${process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_EXPLORER_URL || "https://sepolia.arbiscan.io"}/tx/${c.near_attestation_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-accent)] hover:underline font-mono truncate max-w-[180px]"
                    >
                      Tx: {c.near_attestation_hash}
                    </a>
                  ) : (
                    <span className="text-[var(--color-status-safe)] font-semibold">Attested on Arbitrum</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
