"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingPage } from "@/components/shared/LoadingPage";
import { useNearWallet } from "@/lib/blockchain/wallet-context";

const LANGUAGE_OPTIONS = [
  { label: "English", value: "en" },
  { label: "Bahasa Malaysia", value: "ms" },
  { label: "ไทย (Thai)", value: "th" },
  { label: "Tiếng Việt", value: "vi" },
];

export default function WorkerSettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const { accountId, connect, disconnect } = useNearWallet();
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("en");
  const [nearAccount, setNearAccount] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);

  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  const [savingLanguage, setSavingLanguage] = useState(false);

  useEffect(() => {
    async function autoLinkWallet() {
      if (accountId && !nearAccount && !loading) {
        try {
          const res = await fetch("/api/workers/link-wallet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nearAccount: accountId }),
          });
          if (res.ok) {
            setNearAccount(accountId);
          }
        } catch (err) {
          console.error("Auto linking wallet failed", err);
        }
      }
    }
    autoLinkWallet();
  }, [accountId, nearAccount, loading]);

  useEffect(() => {
    async function load() {
      const statusRes = await fetch("/api/auth/status");
      if (!statusRes.ok) {
        router.replace("/login");
        return;
      }
      const statusData = await statusRes.json();
      if (!statusData.onboarded || statusData.role !== "worker" || !statusData.worker) {
        router.replace("/onboarding");
        return;
      }

      const worker = statusData.worker;
      setLanguage(worker.preferred_language || "en");
      setNearAccount(worker.near_account);

      const orgRes = await fetch("/api/organizations");
      const orgBody = await orgRes.json();
      setOrgName(orgBody.organization?.name || null);

      setLoading(false);
    }
    load();
  }, [router, supabase]);

  async function handleSaveLanguage() {
    setSavingLanguage(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("workers").update({ preferred_language: language }).eq("user_id", user.id);
    }
    setSavingLanguage(false);
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    setJoining(true);
    setJoinError(null);
    setJoinSuccess(null);

    const res = await fetch("/api/organizations/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode }),
    });
    const body = await res.json();

    setJoining(false);
    if (!res.ok) {
      setJoinError(body.error || "Could not join organization.");
      return;
    }

    setJoinSuccess(`Joined ${body.orgName}.`);
    setOrgName(body.orgName);
    setInviteCode("");
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="px-6 md:px-10 py-12 max-w-xl flex flex-col gap-10">
      <h1 className="text-display-md">Settings</h1>

      <div className="flex flex-col gap-4">
        <p className="text-heading-sm">Organization</p>
        {orgName ? (
          <div className="bg-[var(--color-bg-secondary)] p-5">
            <Badge status="safe">Active</Badge>
            <p className="text-body-md mt-2">{orgName}</p>
          </div>
        ) : (
          <form onSubmit={handleJoin} className="flex flex-col gap-3">
            {joinError && <ErrorState message={joinError} />}
            {joinSuccess && <p className="text-body-sm text-[var(--color-status-safe)]">{joinSuccess}</p>}
            <p className="text-body-sm text-[var(--color-text-secondary)]">
              Enter the invite code your site manager gave you.
            </p>
            <div className="flex gap-3">
              <Input
                placeholder="Invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
              />
              <Button type="submit" disabled={joining}>
                {joining ? "Joining…" : "Join"}
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-heading-sm">Language</p>
        <div className="flex gap-3">
          <Dropdown options={LANGUAGE_OPTIONS} value={language} onChange={setLanguage} />
          <Button onClick={handleSaveLanguage} disabled={savingLanguage} variant="secondary">
            {savingLanguage ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-heading-sm">EVM Wallet</p>
        {nearAccount ? (
          <div className="flex flex-col items-start gap-3">
            <div className="flex items-center gap-3">
              <p className="text-mono-md text-[var(--color-text-secondary)] font-semibold break-all">{nearAccount}</p>
              <Badge status="safe">Connected</Badge>
            </div>
            <button
              type="button"
              onClick={async () => {
                await disconnect();
                setNearAccount(null);
                try {
                  await fetch("/api/workers/link-wallet", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nearAccount: null }),
                  });
                } catch {}
              }}
              className="text-mono-sm text-[var(--color-status-critical)] hover:underline text-left text-xs cursor-pointer"
            >
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-body-sm text-[var(--color-text-tertiary)]">
              Link your EVM wallet to verify your identity and view compliant wages on Arbitrum Sepolia.
            </p>
            <Button onClick={connect}>
              Connect EVM Wallet
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
