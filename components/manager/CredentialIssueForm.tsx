"use client";

import { useEffect, useState, FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { useAccount } from "wagmi";

const CREDENTIAL_TYPE_OPTIONS = [
  { label: "Safety training", value: "safety_training" },
  { label: "Site clearance", value: "site_clearance" },
  { label: "Equipment certification", value: "equipment_certification" },
  { label: "Incident-free milestone", value: "incident_free_milestone" },
];

interface WorkerOption {
  id: string;
  full_name: string;
}

export function CredentialIssueForm({ onIssued }: { onIssued: () => void }) {
  const { address } = useAccount();
  const [workers, setWorkers] = useState<WorkerOption[]>([]);
  const [workerId, setWorkerId] = useState("");
  const [credentialType, setCredentialType] = useState("safety_training");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/workers")
      .then((r) => r.json())
      .then((body) => setWorkers(body.data || []));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!workerId) {
      setError("Select a worker.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const credentialData = {
      worker_id: workerId,
      credential_type: credentialType,
      title,
      description,
      expires_at: expiresAt || null,
      issuer_address: address || null
    };

    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentialData),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to issue credential.");
      }

      setTitle("");
      setDescription("");
      setExpiresAt("");
      onIssued();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Credential issuance failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const workerOptions = workers.map((w) => ({ label: w.full_name, value: w.id }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left border border-[var(--color-border)] rounded-3xl p-6 bg-white/80 backdrop-blur-md shadow-sm">
      <h3 className="text-heading-md font-serif font-bold text-[var(--color-text-primary)]">
        Issue Worker Credential
      </h3>
      {error && <ErrorState message={error} />}

      <Dropdown
        label="Worker"
        options={workerOptions}
        value={workerId}
        onChange={setWorkerId}
        placeholder="Select a worker"
      />

      <Dropdown
        label="Credential Type"
        options={CREDENTIAL_TYPE_OPTIONS}
        value={credentialType}
        onChange={setCredentialType}
      />

      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="e.g. OSHA 30 Construction Safety"
      />

      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Details on scope and certification requirements"
      />

      <Input
        label="Expires At (Optional)"
        type="date"
        value={expiresAt}
        onChange={(e) => setExpiresAt(e.target.value)}
      />

      <Button variant="primary" type="submit" disabled={submitting}>
        {submitting ? "Issuing..." : "Issue & Anchor Credential &rarr;"}
      </Button>
    </form>
  );
}
