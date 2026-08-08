"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingPage } from "@/components/shared/LoadingPage";

const INDUSTRY_OPTIONS = [
  { label: "Construction", value: "construction" },
  { label: "Manufacturing", value: "manufacturing" },
  { label: "Oil & Gas", value: "oil_gas" },
  { label: "Logistics", value: "logistics" },
];

export default function ManagerSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");

  const [name, setName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [industry, setIndustry] = useState("construction");
  const [city, setCity] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/organizations/mine");
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/onboarding");
        return;
      }
      const body = await res.json();
      const org = body.organization;
      if (org) {
        setName(org.name);
        setSiteName(org.site_name || "");
        setIndustry(org.industry);
        setCity(org.city || "");
        setInviteCode(org.invite_code);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/organizations/mine", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, siteName, industry, city }),
    });
    const body = await res.json();

    setSaving(false);
    if (!res.ok) setError(body.error || "Could not save changes.");
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="px-6 md:px-10 py-12 max-w-xl flex flex-col gap-8">
      <h1 className="text-display-md">Organization settings</h1>

      <div className="bg-[var(--color-bg-secondary)] p-6 flex items-center justify-between">
        <div>
          <p className="text-mono-sm text-[var(--color-text-tertiary)]">Invite Code</p>
          <p className="text-heading-md">{inviteCode}</p>
        </div>
        <p className="text-body-sm text-[var(--color-text-secondary)] max-w-xs text-right">
          Share this code with workers to add them to your roster.
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {error && <ErrorState message={error} />}
        <Input placeholder="Organization name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Site name" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
        <Dropdown options={INDUSTRY_OPTIONS} value={industry} onChange={setIndustry} placeholder="Industry" />
        <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
