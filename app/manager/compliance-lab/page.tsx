"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { LoadingPage } from "@/components/shared/LoadingPage";
import { useAccount, useWriteContract } from "wagmi";
import { CLEARAIL_CORE_ABI } from "@/lib/blockchain/evm";
import { TransactionModal, TxStep } from "@/components/shared/TransactionModal";

interface Worker {
  id: string;
  full_name: string;
  trade: string | null;
  near_account: string | null;
  wallet_address?: string | null;
  score_breakdown: {
    consistency: number;
    incidents: number;
    credentials: number;
    hazard_rate: number;
    mock_revoke_apass?: boolean;
    mock_blacklist?: boolean;
  };
}

interface WageRecord {
  id: string;
  worker_id: string;
  net_pay: number;
  status: string;
  workers: {
    full_name: string;
  };
}

export default function ComplianceLabPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [wages, setWages] = useState<WageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Preflight check states
  const [checkedWorker, setCheckedWorker] = useState<string | null>(null);
  const [preflightData, setPreflightData] = useState<any>(null);

  // Settlement logs stream
  const [logs, setLogs] = useState<string[]>([]);
  const [settlementResult, setSettlementResult] = useState<any>(null);

  // Recovery console states
  const [recoveryBatchId, setRecoveryBatchId] = useState("1");
  const [recoveryIndex, setRecoveryIndex] = useState("0");
  const [recoveryLogs, setRecoveryLogs] = useState<string[]>([]);
  
  // Transaction Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<TxStep>("IDLE");
  const [activeTxHash, setActiveTxHash] = useState("");
  const [modalError, setModalError] = useState("");

  const contractAddress = (process.env.NEXT_PUBLIC_CLEARAIL_CORE_ADDRESS || "0x63d15515178fD90d01E7B8167C41b413D85E351C") as `0x${string}`;
  const tokenAddress = process.env.NEXT_PUBLIC_MOCK_ATOKEN_ADDRESS || "0xeb4DEC7a15cF2CE1CfEDE8FFc3ec5BEAED6Ff5A8";

  async function loadData() {
    try {
      const res = await fetch("/api/workers");
      const body = await res.json();
      setWorkers(body.data || []);

      const wageRes = await fetch("/api/wages");
      const wageBody = await wageRes.json();
      const pendingWages = (wageBody.data || []).filter((w: WageRecord) => w.status === "pending");
      setWages(pendingWages);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Update compliance mock toggles
  async function handleToggleMock(workerId: string, type: "apass" | "blacklist", currentValue: boolean) {
    setActionLoading(workerId + type);
    try {
      const worker = workers.find((w) => w.id === workerId);
      if (!worker) return;

      const mockRevokeApass = type === "apass" ? !currentValue : !!worker.score_breakdown?.mock_revoke_apass;
      const mockBlacklist = type === "blacklist" ? !currentValue : !!worker.score_breakdown?.mock_blacklist;

      const res = await fetch("/api/cleanverse/mock-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId, mockRevokeApass, mockBlacklist }),
      });

      if (res.ok) {
        setWorkers((prev) =>
          prev.map((w) => {
            if (w.id === workerId) {
              return {
                ...w,
                score_breakdown: {
                  ...w.score_breakdown,
                  mock_revoke_apass: mockRevokeApass,
                  mock_blacklist: mockBlacklist,
                },
              };
            }
            return w;
          })
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  }

  // Trigger server-side preflight check
  async function runPreflight(worker: Worker) {
    const targetWallet = worker.near_account || worker.wallet_address;
    if (!targetWallet) return;
    setCheckedWorker(worker.id);
    setPreflightData(null);
    try {
      const res = await fetch("/api/cleanverse/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: targetWallet,
          atokenAddress: tokenAddress
        })
      });
      const data = await res.json();
      setPreflightData(data.preflight || null);
    } catch (err) {
      console.error(err);
    }
  }

  // Run compliant settlement batch simulation
  async function executeSettlement() {
    if (wages.length === 0) return;
    setLogs([]);
    setSettlementResult(null);

    const log = (msg: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    log("Initiating ClearRail compliance settlement batch...");
    const wageIds = wages.map((w) => w.id);

    try {
      log("Querying Supabase pending wage records...");
      log(`Found ${wageIds.length} pending records. Running Cleanverse preflight & compliance attestations...`);

      const res = await fetch("/api/settlement/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wageRecordIds: wageIds,
          tokenAddress: tokenAddress
        })
      });

      const body = await res.json();
      if (!res.ok) {
        log(`Settlement prepare failed: ${body.error || "Unknown error"}`);
        return;
      }

      log(`Batch Attestations Prepared. Target Batch ID: ${body.batchId}`);
      log("-----------------------------------------");

      body.items.forEach((item: any, idx: number) => {
        log(`Worker [${idx + 1}]: ${item.workerName} (${item.workerWallet})`);
        log(`  Amount: $${item.amountCents.toFixed(2)}`);
        if (item.isCompliant) {
          log(`  Status: COMPLIANT ✓. Attestation signed by Registrar.`);
          log(`  Attestation Signature: ${item.attestation.signature.substring(0, 20)}...`);
        } else {
          log(`  🚨 Status: NON-COMPLIANT. Blocked Reason: ${item.blockedReason}`);
          log(`  🔒 Escrow lock activated on contract index ${idx}.`);
        }
        log("-----------------------------------------");
      });

      log(`Batch compliance preflight complete. Open Payroll tab to sign real wallet settlement on-chain!`);
      setSettlementResult(body);
      loadData();
    } catch (err: any) {
      log(`System Error: ${err.message || "Failed to process settlement"}`);
    }
  }

  // Trigger Reown / EVM Wallet Recovery Call
  async function runRecovery() {
    if (!isConnected) {
      alert("Please connect your wallet first using the CONNECT WALLET button in the sidebar.");
      return;
    }
    if (!recoveryBatchId || recoveryIndex === "") return;

    setRecoveryLogs([]);
    const rlog = (msg: string) => setRecoveryLogs((prev) => [...prev, msg]);

    setModalStep("CONFIRM_IN_WALLET");
    setModalOpen(true);

    try {
      rlog("Preparing recoverBlockedPayment transaction...");
      rlog(`Connected wallet: ${address}`);
      rlog(`Calling ClearRailCore contract at ${contractAddress}...`);

      const tx = await writeContractAsync({
        address: contractAddress,
        abi: CLEARAIL_CORE_ABI,
        functionName: "recoverBlockedPayment",
        args: [BigInt(recoveryBatchId), BigInt(recoveryIndex)]
      });

      setActiveTxHash(tx);
      setModalStep("BROADCASTING");
      rlog(`Transaction broadcasted to Arbitrum Sepolia! Tx: ${tx}`);
      rlog("✅ Success! Blocked funds recovered from escrow back to employer wallet.");
      setModalStep("CONFIRMED");
    } catch (err: any) {
      rlog(`❌ Recovery failed: ${err.shortMessage || err.message}`);
      setModalError(err.shortMessage || err.message || "Recovery failed");
      setModalStep("REJECTED");
    }
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="px-6 md:px-10 py-12 flex flex-col gap-10 max-w-6xl mx-auto text-left">
      {/* Editorial Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
          <span className="text-mono-sm text-[var(--color-accent)] font-semibold tracking-wider uppercase">
            COMPLIANCE LAB & PLAYGROUND
          </span>
        </div>
        <h1 className="text-display-md text-[var(--color-text-primary)] font-serif leading-tight">
          Compliance & Escrow Recovery Sandbox
        </h1>
        <p className="text-body-md text-[var(--color-text-secondary)] max-w-3xl leading-relaxed">
          Simulate workforce payment compliance audits using Cleanverse Sandbox V5.6. Revoke worker credentials, trigger country blacklists, verify automated payment blocks, and execute employer escrow recovery transactions via connected Reown wallet.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Worker Sandbox Panel */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="border border-[var(--color-border)] rounded-3xl p-6 bg-white/80 backdrop-blur-md shadow-sm">
            <h2 className="text-heading-md font-serif mb-4 text-[var(--color-text-primary)]">Site Workforce Simulation</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)] pb-2 text-[10px] text-mono-md text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    <th className="py-3">Worker</th>
                    <th className="py-3">EVM Wallet Address</th>
                    <th className="py-3 text-center">Compliance Controls</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {workers.map((w) => {
                    const walletAddr = w.near_account || w.wallet_address;
                    const hasWallet = !!walletAddr;
                    const isRevoked = !!w.score_breakdown?.mock_revoke_apass;
                    const isBlacklisted = !!w.score_breakdown?.mock_blacklist;

                    return (
                      <tr key={w.id} className="hover:bg-[rgba(20,18,16,0.02)] transition-colors">
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[var(--color-text-primary)]">{w.full_name}</span>
                            <span className="text-mono-sm text-[var(--color-text-tertiary)]">{w.trade || "Specialist"}</span>
                          </div>
                        </td>
                        <td className="py-4 font-mono text-mono-sm">
                          {hasWallet ? (
                            <span className="text-[var(--color-text-secondary)] truncate max-w-[140px] block" title={walletAddr}>
                              {walletAddr}
                            </span>
                          ) : (
                            <span className="text-[var(--color-status-warning)] italic">No wallet linked</span>
                          )}
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleToggleMock(w.id, "apass", isRevoked)}
                              disabled={actionLoading === w.id + "apass"}
                              className={`text-[10px] text-mono-sm px-2.5 py-1 rounded-lg border transition-all ${
                                isRevoked
                                  ? "bg-[var(--color-status-critical-bg)] text-[var(--color-status-critical)] border-[rgba(181,48,42,0.3)] font-bold"
                                  : "bg-[var(--color-status-safe-bg)] text-[var(--color-status-safe)] border-[rgba(61,122,74,0.3)]"
                              }`}
                            >
                              {isRevoked ? "A-Pass Revoked 🚨" : "A-Pass Valid ✓"}
                            </button>

                            <button
                              onClick={() => handleToggleMock(w.id, "blacklist", isBlacklisted)}
                              disabled={actionLoading === w.id + "blacklist"}
                              className={`text-[10px] text-mono-sm px-2.5 py-1 rounded-lg border transition-all ${
                                isBlacklisted
                                  ? "bg-[var(--color-status-critical-bg)] text-[var(--color-status-critical)] border-[rgba(181,48,42,0.3)] font-bold"
                                  : "bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] border-[var(--color-border-subtle)]"
                              }`}
                            >
                              {isBlacklisted ? "Blacklisted 🚨" : "Clean Nation ✓"}
                            </button>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <Button
                            variant="secondary"
                            onClick={() => runPreflight(w)}
                            disabled={!hasWallet}
                            className="!py-1 !px-2.5 !text-[11px]"
                          >
                            Preflight
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preflight Verification Result Terminal */}
          {preflightData && (
            <div className="border border-[var(--color-border)] rounded-3xl p-6 bg-white/80 backdrop-blur-md shadow-sm flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between">
                <h3 className="text-heading-sm font-serif font-bold text-[var(--color-text-primary)]">
                  Cleanverse Sandbox Preflight Audit Result
                </h3>
                <Badge status={preflightData.passed ? "safe" : "critical"}>
                  {preflightData.passed ? "APPROVED" : "BLOCKED"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-mono-sm">
                <div className={`p-4 rounded-2xl border ${preflightData.apass.valid ? "bg-[var(--color-status-safe-bg)] border-[rgba(61,122,74,0.3)]" : "bg-[var(--color-status-critical-bg)] border-[rgba(181,48,42,0.3)]"}`}>
                  <p className="font-bold uppercase text-[10px] text-[var(--color-text-tertiary)]">1. A-Pass Verification</p>
                  <p className="text-body-sm font-semibold mt-1">{preflightData.apass.message}</p>
                </div>

                <div className={`p-4 rounded-2xl border ${preflightData.compliance.valid ? "bg-[var(--color-status-safe-bg)] border-[rgba(61,122,74,0.3)]" : "bg-[var(--color-status-critical-bg)] border-[rgba(181,48,42,0.3)]"}`}>
                  <p className="font-bold uppercase text-[10px] text-[var(--color-text-tertiary)]">2. Compliance Pool Validator</p>
                  <p className="text-body-sm font-semibold mt-1">{preflightData.compliance.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Disbursal Stream Logger */}
          <div className="border border-[var(--color-border)] rounded-3xl p-6 bg-white/80 backdrop-blur-md shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-heading-sm font-serif font-bold text-[var(--color-text-primary)]">
                  Simulate Payroll Disbursal Audit
                </h3>
                <p className="text-body-sm text-[var(--color-text-secondary)]">
                  Run compliance preflight check across {wages.length} pending wage records.
                </p>
              </div>
              <Button variant="primary" onClick={executeSettlement} disabled={wages.length === 0}>
                Run Batch Audit &rarr;
              </Button>
            </div>

            {logs.length > 0 && (
              <div className="bg-[var(--color-bg-inverse)] text-[var(--color-text-inverse)] p-4 rounded-2xl font-mono text-mono-sm h-56 overflow-y-auto flex flex-col gap-1 text-left">
                {logs.map((line, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Escrow Recovery Console */}
        <div className="lg:col-span-4 border border-[var(--color-border)] rounded-3xl p-6 bg-white/80 backdrop-blur-md shadow-sm flex flex-col gap-5 text-left">
          <h2 className="text-heading-md font-serif text-[var(--color-text-primary)]">Escrow Recovery Console</h2>
          <p className="text-body-sm text-[var(--color-text-secondary)]">
            Employers can reclaim funds locked in contract escrow due to worker compliance rejections directly via Reown / EVM connected wallet.
          </p>

          <div className="flex flex-col gap-3">
            <Input
              label="Payroll Batch ID"
              value={recoveryBatchId}
              onChange={(e) => setRecoveryBatchId(e.target.value)}
              placeholder="e.g. 1"
            />
            <Input
              label="Worker Payment Index"
              value={recoveryIndex}
              onChange={(e) => setRecoveryIndex(e.target.value)}
              placeholder="e.g. 0"
            />

            <Button variant="primary" onClick={runRecovery} className="w-full mt-2">
              Recover Blocked Escrow &rarr;
            </Button>

            {recoveryLogs.length > 0 && (
              <div className="bg-[var(--color-bg-secondary)] p-3 rounded-xl font-mono text-[11px] flex flex-col gap-1 mt-2 text-left">
                {recoveryLogs.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Escrow Recovery Transaction"
        actionLabel="RECOVER BLOCKED ESCROW"
        step={modalStep}
        txHash={activeTxHash}
        errorReason={modalError}
      />
    </div>
  );
}
