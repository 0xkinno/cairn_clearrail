"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { WageRecordRow } from "@/lib/supabase/types";
import { useAccount, useWriteContract } from "wagmi";
import { CLEARAIL_CORE_ABI, MOCK_ERC20_ABI } from "@/lib/blockchain/evm";
import { TransactionModal, TxStep } from "@/components/shared/TransactionModal";

type WageWithWorker = WageRecordRow & { worker_name: string };
type SortKey = "worker_name" | "pay_period_end" | "status" | "net_pay";

const STATUS_BADGE: Record<string, "safe" | "warning" | "critical" | "info"> = {
  pending: "warning",
  approved: "safe",
  paid: "safe",
  blocked: "critical"
};

export function WageManagement({
  records,
  onApproved,
}: {
  records: WageWithWorker[];
  onApproved: () => void;
}) {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [sortKey, setSortKey] = useState<SortKey>("pay_period_end");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<TxStep>("IDLE");
  const [modalTitle, setModalTitle] = useState("");
  const [modalAmount, setModalAmount] = useState<number | string>("");
  const [activeTxHash, setActiveTxHash] = useState("");
  const [modalError, setModalError] = useState("");

  const contractAddress = (process.env.NEXT_PUBLIC_CLEARAIL_CORE_ADDRESS || "0x63d15515178fD90d01E7B8167C41b413D85E351C") as `0x${string}`;
  const tokenAddress = (process.env.NEXT_PUBLIC_MOCK_ATOKEN_ADDRESS || "0xeb4DEC7a15cF2CE1CfEDE8FFc3ec5BEAED6Ff5A8") as `0x${string}`;

  const sorted = useMemo(() => {
    return [...records].sort((a, b) => {
      if (sortKey === "net_pay") return b.net_pay - a.net_pay;
      if (sortKey === "worker_name") return a.worker_name.localeCompare(b.worker_name);
      if (sortKey === "status") return a.status.localeCompare(b.status);
      return b.pay_period_end.localeCompare(a.pay_period_end);
    });
  }, [records, sortKey]);

  async function handleApproveAndSettle(record: WageWithWorker) {
    if (!isConnected) {
      alert("Please connect your wallet first using the CONNECT WALLET button in the sidebar.");
      return;
    }

    setModalTitle(`Settle Wage Record for ${record.worker_name}`);
    setModalAmount(record.net_pay);
    setModalError("");
    setModalStep("PREPARING");
    setModalOpen(true);

    try {
      // 1. Prepare Cleanverse Preflight & Attestation Signature
      const prepRes = await fetch("/api/settlement/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wageRecordIds: [record.id],
          tokenAddress
        })
      });

      const prepData = await prepRes.json();
      if (!prepRes.ok || !prepData.items || prepData.items.length === 0) {
        throw new Error(prepData.error || "Compliance preflight failed");
      }

      const item = prepData.items[0];
      setModalStep("CONFIRM_IN_WALLET");

      let txHash = "";

      if (item.isCompliant) {
        // Step A: Approve ERC-20 Token Transfer to Escrow
        const amountBig = BigInt(item.amountUnits);
        await writeContractAsync({
          address: tokenAddress,
          abi: MOCK_ERC20_ABI,
          functionName: "approve",
          args: [contractAddress, amountBig]
        });

        // Step B: Submit Contract Transaction via Connected Wallet
        txHash = await writeContractAsync({
          address: contractAddress,
          abi: CLEARAIL_CORE_ABI,
          functionName: "releasePayment",
          args: [
            BigInt(prepData.batchId),
            BigInt(item.paymentIndex),
            item.attestation.signature,
            BigInt(item.attestation.nonce),
            BigInt(item.attestation.deadline)
          ]
        });
      } else {
        // Submit Block Payment Contract Transaction
        txHash = await writeContractAsync({
          address: contractAddress,
          abi: CLEARAIL_CORE_ABI,
          functionName: "blockPayment",
          args: [
            BigInt(prepData.batchId),
            BigInt(item.paymentIndex),
            item.blockedReason || "Cleanverse Compliance Rejection",
            item.attestation.signature,
            BigInt(item.attestation.nonce),
            BigInt(item.attestation.deadline)
          ]
        });
      }

      setActiveTxHash(txHash);
      setModalStep("BROADCASTING");

      // Reconcile transaction with backend & Cleanverse
      await fetch("/api/settlement/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wageRecordId: record.id,
          txHash,
          isCompliant: item.isCompliant,
          blockedReason: item.blockedReason
        })
      });

      setModalStep("CONFIRMED");
      onApproved();
    } catch (err: any) {
      console.error(err);
      setModalError(err.shortMessage || err.message || "User rejected transaction");
      setModalStep("REJECTED");
    }
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {(["pay_period_end", "worker_name", "status", "net_pay"] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortKey(key)}
              className={`text-mono-sm px-3 py-1.5 rounded-lg border transition-all ${
                sortKey === key
                  ? "bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] border-[var(--color-text-primary)] font-bold"
                  : "bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] border-[var(--color-border-subtle)]"
              }`}
            >
              {key.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {sorted.map((r) => (
          <div key={r.id} className="border border-[var(--color-border)] rounded-2xl bg-white/80 backdrop-blur-md p-5 flex items-center justify-between gap-4 text-left shadow-sm">
            <div>
              <p className="text-mono-sm text-[var(--color-text-tertiary)] font-bold">{r.worker_name}</p>
              <p className="text-heading-sm font-serif font-bold text-[var(--color-text-primary)] mt-1">
                {r.currency} {r.net_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-body-sm text-[var(--color-text-secondary)] mt-1">
                {new Date(r.pay_period_start).toLocaleDateString()} – {new Date(r.pay_period_end).toLocaleDateString()}
              </p>
              {r.near_tx_hash && (
                <a
                  href={`https://sepolia.arbiscan.io/tx/${r.near_tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mono-sm text-[var(--color-status-info)] hover:underline block mt-2 font-mono text-[11px] truncate max-w-md"
                >
                  Arbiscan Tx: {r.near_tx_hash} &rarr;
                </a>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge status={STATUS_BADGE[r.status] || "info"}>{r.status}</Badge>
              {r.status === "pending" && (
                <Button onClick={() => handleApproveAndSettle(r)}>
                  Sign & Settle on Arbitrum &rarr;
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        actionLabel="SETTLE PAYROLL OBLIGATION"
        step={modalStep}
        amount={modalAmount}
        txHash={activeTxHash}
        errorReason={modalError}
      />
    </div>
  );
}
