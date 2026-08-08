"use client";

import { useEffect, useState } from "react";
import { WageManagement } from "@/components/manager/WageManagement";
import { WageRecordForm } from "@/components/manager/WageRecordForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingPage } from "@/components/shared/LoadingPage";
import type { WageRecordRow } from "@/lib/supabase/types";

type WageWithWorker = WageRecordRow & { worker_name: string };

export default function ManagerWagesPage() {
  const [records, setRecords] = useState<WageWithWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    const res = await fetch("/api/wages");
    const body = await res.json();
    if (res.ok) setRecords(body.data || []);
    setLoading(false);
  }

  useEffect(() => {
    async function handleWalletCallback() {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const txHash = params.get("transactionHashes");
      if (txHash) {
        window.history.replaceState(null, "", window.location.pathname);
        const pendingId = localStorage.getItem("cairn_pending_wage_approval");
        if (pendingId) {
          try {
            const res = await fetch(`/api/wages/${pendingId}/approve`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ txHash }),
            });
            if (res.ok) {
              localStorage.removeItem("cairn_pending_wage_approval");
            } else {
              const body = await res.json();
              console.error("Could not record wage approval:", body.error);
            }
          } catch (e) {
            console.error("Failed to parse or submit pending wage approval:", e);
          }
        }
      }
      load();
    }
    handleWalletCallback();
  }, []);

  return (
    <div className="px-6 md:px-10 py-12 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-display-md">Wage management</h1>
        <Button onClick={() => setModalOpen(true)}>Add wage record</Button>
      </div>

      {loading ? (
        <LoadingPage />
      ) : records.length === 0 ? (
        <EmptyState
          title="No wage records yet"
          description="Add a pay period for a worker — it will be recorded and can be verified on NEAR."
          action={<Button onClick={() => setModalOpen(true)}>Add wage record</Button>}
        />
      ) : (
        <WageManagement records={records} onApproved={load} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="text-heading-lg mb-5">Add wage record</h2>
        <WageRecordForm
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      </Modal>
    </div>
  );
}
