"use client";

import { useEffect, useState } from "react";
import { CredentialIssueForm } from "@/components/manager/CredentialIssueForm";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingPage } from "@/components/shared/LoadingPage";
import type { CredentialRow } from "@/lib/supabase/types";

type CredentialWithWorker = CredentialRow & { worker_name: string };

const STATUS_BADGE: Record<string, "safe" | "warning" | "critical" | "info"> = {
  active: "safe",
  revoked: "critical",
};

export default function ManagerCredentialsPage() {
  const [credentials, setCredentials] = useState<CredentialWithWorker[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/credentials");
    const body = await res.json();
    if (res.ok) setCredentials(body.data || []);
    setLoading(false);
  }

  useEffect(() => {
    async function handleWalletCallback() {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const txHash = params.get("transactionHashes");
      if (txHash) {
        // Clean URL immediately so it doesn't trigger again on reload
        window.history.replaceState(null, "", window.location.pathname);
        
        const pendingJson = localStorage.getItem("cairn_pending_credential");
        if (pendingJson) {
          try {
            const pendingData = JSON.parse(pendingJson);
            const res = await fetch(`/api/credentials/${pendingData.credentialId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ near_tx_hash: txHash }),
            });
            
            if (res.ok) {
              localStorage.removeItem("cairn_pending_credential");
            } else {
              const body = await res.json();
              console.error("Could not record credential transaction hash", body.error);
            }
          } catch (e) {
            console.error("Failed to parse or submit pending credential patch", e);
          }
        }
      }
      load();
    }

    handleWalletCallback();
  }, []);

  return (
    <div className="px-6 md:px-10 py-12 grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-10">
      <div className="flex flex-col gap-6">
        <h1 className="text-display-md font-serif text-[var(--color-text-primary)]">Issue credential</h1>
        <CredentialIssueForm onIssued={load} />
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-mono-lg font-bold text-[var(--color-accent)] tracking-widest text-xs md:text-sm uppercase">Issued credentials</p>
        {loading ? (
          <LoadingPage />
        ) : credentials.length === 0 ? (
          <div className="premium-panel p-8 text-center bg-[rgba(255,255,253,0.7)] backdrop-blur-md border border-[var(--color-border)] rounded-2xl">
            <EmptyState title="No credentials issued yet" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {credentials.map((c) => (
              <div key={c.id} className="premium-panel p-5 flex items-start justify-between gap-4 bg-[rgba(255,255,253,0.75)] hover:border-[rgba(212,148,10,0.3)] duration-200">
                <div>
                  <p className="text-mono-sm text-[var(--color-text-tertiary)]">{c.worker_name}</p>
                  <p className="text-heading-sm mt-1.5 text-[var(--color-text-primary)] font-semibold">{c.title}</p>
                  <p className="text-mono-sm text-[var(--color-text-tertiary)] mt-2">
                    Issued {new Date(c.issued_at).toLocaleDateString()}
                  </p>
                  {c.near_tx_hash && (
                    <div className="flex items-center gap-1.5 mt-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-safe)] animate-pulse" />
                      <a
                        href={`https://testnet.nearblocks.io/txns/${c.near_tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-mono-sm text-[var(--color-accent)] font-semibold hover:underline text-[10.5px]"
                      >
                        Verified on Arbitrum Sepolia →
                      </a>
                    </div>
                  )}
                </div>
                <Badge status={STATUS_BADGE[c.status] || "info"}>{c.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
