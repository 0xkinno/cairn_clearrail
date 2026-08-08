"use client";

import { useEffect, useState, FormEvent } from "react";
import { IncidentBoard } from "@/components/manager/IncidentBoard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Dropdown } from "@/components/ui/Dropdown";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingPage } from "@/components/shared/LoadingPage";
import { EmptyState } from "@/components/shared/EmptyState";
import type { IncidentRow } from "@/lib/supabase/types";
import { useNearWallet } from "@/lib/blockchain/wallet-context";

const SEVERITY_OPTIONS = [
  { label: "Near miss", value: "near_miss" },
  { label: "First aid", value: "first_aid" },
  { label: "Medical treatment", value: "medical_treatment" },
  { label: "Lost time", value: "lost_time" },
  { label: "Serious", value: "serious" },
  { label: "Fatality", value: "fatality" },
];

export default function ManagerIncidentsPage() {
  const { accountId } = useNearWallet();
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("near_miss");
  const [zone, setZone] = useState("");

  async function loadIncidents() {
    const res = await fetch("/api/incidents");
    const body = await res.json();
    if (res.ok) setIncidents(body.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadIncidents();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, severity, zone }),
      });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error || "Could not create incident.");
      }

      setModalOpen(false);
      setTitle("");
      setDescription("");
      setZone("");
      setSeverity("near_miss");
      loadIncidents();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit incident.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="px-6 md:px-10 py-12 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-display-md">Incidents</h1>
        <Button onClick={() => setModalOpen(true)}>Report incident</Button>
      </div>

      {incidents.length === 0 ? (
        <EmptyState title="No incidents reported" description="Reported incidents will be classified by AI and tracked here." />
      ) : (
        <IncidentBoard incidents={incidents} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate} className="flex flex-col gap-5">
          <h2 className="text-heading-lg">Report incident</h2>
          {error && <ErrorState message={error} />}
          <Input placeholder="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea
            placeholder="Describe what happened — AI will classify severity, root cause, and corrective actions."
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Dropdown options={SEVERITY_OPTIONS} value={severity} onChange={setSeverity} placeholder="Severity" />
          <Input placeholder="Zone / area (optional)" value={zone} onChange={(e) => setZone(e.target.value)} />
          <Button type="submit" disabled={submitting}>
            {submitting ? "Analyzing & saving…" : "Submit incident"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
