"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingPage } from "@/components/shared/LoadingPage";
import { ErrorState } from "@/components/shared/ErrorState";
import type { IncidentRow } from "@/lib/supabase/types";
import { useNearWallet } from "@/lib/blockchain/wallet-context";

const SEVERITY_BADGE: Record<string, "safe" | "warning" | "critical" | "info"> = {
  near_miss: "info",
  first_aid: "warning",
  medical_treatment: "warning",
  lost_time: "critical",
  serious: "critical",
  fatality: "critical",
};

export default function ManagerIncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [incident, setIncident] = useState<IncidentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { accountId } = useNearWallet();

  async function load() {
    const res = await fetch(`/api/incidents/${id}`);
    const body = await res.json();
    if (res.ok) setIncident(body.data);
    else setError(body.error);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleResolve() {
    setResolving(true);
    setError(null);
    try {
      // Step 1: Update incident status in Supabase FIRST using a direct API call
      // The backend route will handle the database update and write to Arbitrum Sepolia on-chain
      const res = await fetch(`/api/incidents/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'resolved', 
          resolved_at: new Date().toISOString(),
          resolution_notes: 'Resolved by site manager' 
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update incident');
      }
      
      // Step 2: Hard redirect using window.location (not router.push)
      window.location.href = '/manager/incidents';
      
    } catch (err: any) {
      console.error('Resolve failed:', err);
      setError(err.message || "Failed to resolve incident");
    } finally {
      setResolving(false);
    }
  }

  if (loading) return <LoadingPage />;
  if (error || !incident) return <ErrorState message={error || "Incident not found"} />;

  const classification = incident.ai_classification;

  return (
    <div className="px-6 md:px-10 py-12 max-w-2xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-mono-md text-[var(--color-text-tertiary)] mb-1">
            {new Date(incident.created_at).toLocaleString()}
            {incident.zone && ` · ${incident.zone}`}
          </p>
          <h1 className="text-display-md">{incident.title}</h1>
        </div>
        <Badge status={SEVERITY_BADGE[incident.severity] || "info"}>{incident.severity.replace(/_/g, " ")}</Badge>
      </div>

      <p className="text-body-md">{incident.description}</p>

      {classification && (
        <div className="flex flex-col gap-6">
          <div className="bg-[var(--color-bg-secondary)] p-6">
            <p className="text-mono-sm text-[var(--color-text-tertiary)] mb-2">AI classification summary</p>
            <p className="text-body-md">{classification.summary}</p>
          </div>

          {classification.recommended_corrective_actions?.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-mono-md text-[var(--color-text-tertiary)]">Corrective actions</p>
              {classification.recommended_corrective_actions.map((a, i) => (
                <div key={i} className="bg-[var(--color-bg-secondary)] p-4 flex items-center justify-between gap-4">
                  <p className="text-body-sm">{a.action}</p>
                  <Badge status="info">{a.priority}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {incident.near_tx_hash && (
        <p className="text-mono-sm text-[var(--color-text-tertiary)] break-all">
          Proof transaction: {incident.near_tx_hash}
        </p>
      )}

      {incident.status !== "resolved" && (
        <Button onClick={handleResolve} disabled={resolving}>
          {resolving ? "Resolving…" : "Mark resolved"}
        </Button>
      )}
    </div>
  );
}
