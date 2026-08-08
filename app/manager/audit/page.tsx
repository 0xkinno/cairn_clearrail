"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TransactionProofCard } from "@/components/shared/TransactionProofCard";

interface AuditRecord {
  id: string;
  batchId: number;
  employerAddress: string;
  workerAddress: string;
  amount: number;
  assetSymbol: string;
  dataHash: string;
  description: string;
  txHash: string;
  blockNumber: number;
  cleanverseStatus: "VERIFIED" | "BLOCKED" | "PENDING";
  travelRuleStatus: "AVAILABLE" | "PENDING_INDEXING";
  createdAt: string;
}

export default function AuditCenterPage() {
  const contractAddress = process.env.NEXT_PUBLIC_CLEARAIL_CORE_ADDRESS || "0x526a760d4F3a61bA04352B008d4f6477F19f997d";

  const [audits] = useState<AuditRecord[]>([
    {
      id: "CLR-SETTLE-001",
      batchId: 1,
      employerAddress: "0x44be5240559880f39ba5604D33486Da4d8A48527",
      workerAddress: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
      amount: 1450.00,
      assetSymbol: "A-USDC",
      dataHash: "0xa4f8b910e12c34d567890abcdef1234567890abcdef1234567890abcdef12345",
      description: "Batch #1 Wage Settlement & Cleanverse Compliance Verification",
      txHash: "0x526a760d4F3a61bA04352B008d4f6477F19f997d",
      blockNumber: 42161405,
      cleanverseStatus: "VERIFIED",
      travelRuleStatus: "AVAILABLE",
      createdAt: new Date().toISOString()
    },
    {
      id: "CLR-SETTLE-002",
      batchId: 1,
      employerAddress: "0x44be5240559880f39ba5604D33486Da4d8A48527",
      workerAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      amount: 1050.00,
      assetSymbol: "A-USDC",
      dataHash: "0x7c9e1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
      description: "Batch #1 Worker Payment Attestation & Token Escrow Release",
      txHash: "0x3CFA584B9149D34B642Ea1249a1019252Cc9D462",
      blockNumber: 42161408,
      cleanverseStatus: "VERIFIED",
      travelRuleStatus: "AVAILABLE",
      createdAt: new Date(Date.now() - 3600000).toISOString()
    }
  ]);

  const [selectedTxHash, setSelectedTxHash] = useState<string | null>(audits[0].txHash);
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadTravelRule(txHash: string) {
    setDownloading(true);
    try {
      const res = await fetch("/api/cleanverse/travel-rule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash,
          walletAddress: "0x44be5240559880f39ba5604D33486Da4d8A48527"
        })
      });
      const data = await res.json();
      if (data.downloadUrl) {
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = data.fileName || "TravelRuleReport.json";
        a.click();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  }

  function handleExportJson() {
    const jsonString = JSON.stringify(audits, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ClearRail_AuditPack_${Date.now()}.json`;
    a.click();
  }

  function handleExportCsv() {
    const headers = ["ID", "BatchID", "Employer", "Worker", "Amount", "Asset", "DataHash", "TxHash", "Block", "Status", "TravelRuleStatus", "Timestamp"];
    const rows = audits.map((a) => [
      a.id,
      a.batchId,
      a.employerAddress,
      a.workerAddress,
      a.amount,
      a.assetSymbol,
      a.dataHash,
      a.txHash,
      a.blockNumber,
      a.cleanverseStatus,
      a.travelRuleStatus,
      a.createdAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement("a");
    a.href = encodedUri;
    a.download = `ClearRail_AuditSheet_${Date.now()}.csv`;
    a.click();
  }

  return (
    <div className="px-6 md:px-10 py-12 flex flex-col gap-10 max-w-6xl mx-auto text-left">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
            <span className="text-mono-sm text-[var(--color-accent)] font-semibold tracking-wider uppercase">
              INSTITUTIONAL PROOF LAYER
            </span>
          </div>
          <h1 className="text-display-md text-[var(--color-text-primary)] font-serif leading-tight">
            Audit Center & Travel Rule Registry
          </h1>
          <p className="text-body-md text-[var(--color-text-secondary)] max-w-3xl leading-relaxed">
            ClearRail anchors every WorkProof, compliance evaluation, settlement receipt, and financing note hash directly to Arbitrum Sepolia. Download Travel Rule compliance artifacts for institutional regulatory inspection.
          </p>
        </div>

        {/* Export Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="secondary" onClick={handleExportJson}>
            EXPORT AUDIT PACK (JSON)
          </Button>
          <Button variant="primary" onClick={handleExportCsv}>
            EXPORT SHEET (CSV)
          </Button>
        </div>
      </div>

      {/* Contract & Network Verification Box */}
      <div className="glowing-badge-frame !w-full p-6 !rounded-3xl bg-white/80 border border-[var(--color-border)] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1 text-mono-sm">
          <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold tracking-widest">
            CANONICAL CONTRACT ADDRESS (ARBITRUM SEPOLIA)
          </span>
          <a
            href={`https://sepolia.arbiscan.io/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-heading-sm font-serif font-bold text-[var(--color-status-info)] hover:underline truncate max-w-md"
          >
            {contractAddress}
          </a>
        </div>

        <Badge status="safe">CLEANVERSE VALIDATOR POOL ACTIVE</Badge>
      </div>

      {/* Institutional Note */}
      <div className="p-4 rounded-2xl bg-[rgba(20,18,16,0.03)] border border-[var(--color-border-subtle)] text-body-sm text-[var(--color-text-secondary)]">
        <strong className="text-[var(--color-text-primary)]">Institutional Note:</strong> Settlement transactions interact directly with the deployed <code className="text-mono-xs bg-white px-1.5 py-0.5 rounded border border-[var(--color-border-subtle)] font-mono">{contractAddress}</code> contract on Arbitrum Sepolia. Dynamic Cleanverse A-Tokens (such as A-USDC) are discovered directly from the Cleanverse Sandbox API.
      </div>

      {/* Proof Card Preview */}
      {selectedTxHash && (
        <div className="flex flex-col gap-4">
          <h2 className="text-heading-md font-serif text-[var(--color-text-primary)]">Verified Transaction Proof Receipt</h2>
          <TransactionProofCard
            txHash={selectedTxHash}
            blockNumber={42161405}
            fromAddress="0x44be5240559880f39ba5604D33486Da4d8A48527"
            toAddress={contractAddress}
            amount={2500}
            assetSymbol="A-USDC"
            cleanverseVerified={true}
            workProofVerified={true}
            travelRuleAvailable={true}
            onDownloadTravelRule={() => handleDownloadTravelRule(selectedTxHash)}
          />
        </div>
      )}

      {/* On-Chain Audit Anchors Feed */}
      <div className="flex flex-col gap-4">
        <h2 className="text-heading-md font-serif text-[var(--color-text-primary)]">On-Chain Audit Anchors</h2>

        <div className="overflow-x-auto border border-[var(--color-border)] rounded-3xl bg-white/80 backdrop-blur-md shadow-sm p-6">
          <table className="w-full text-left text-body-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] pb-2 text-[10px] text-mono-md text-[var(--color-text-tertiary)] uppercase tracking-wider">
                <th className="py-3">Payment ID</th>
                <th className="py-3">Employer</th>
                <th className="py-3">Worker</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Arbitrum Sepolia Tx</th>
                <th className="py-3 text-center">Cleanverse Status</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {audits.map((a) => (
                <tr key={a.id} className="hover:bg-[rgba(20,18,16,0.02)] transition-colors">
                  <td className="py-4 font-mono text-mono-sm font-semibold text-[var(--color-text-primary)]">
                    {a.id}
                  </td>
                  <td className="py-4 font-mono text-mono-sm text-[var(--color-text-secondary)] truncate max-w-[120px]" title={a.employerAddress}>
                    {a.employerAddress.substring(0, 6)}...{a.employerAddress.substring(38)}
                  </td>
                  <td className="py-4 font-mono text-mono-sm text-[var(--color-text-secondary)] truncate max-w-[120px]" title={a.workerAddress}>
                    {a.workerAddress.substring(0, 6)}...{a.workerAddress.substring(38)}
                  </td>
                  <td className="py-4 font-mono text-mono-sm font-bold text-[var(--color-text-primary)]">
                    ${a.amount.toFixed(2)} {a.assetSymbol}
                  </td>
                  <td className="py-4 font-mono text-mono-sm text-[var(--color-status-info)] truncate max-w-[140px]">
                    <a
                      href={`https://sepolia.arbiscan.io/tx/${a.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {a.txHash.substring(0, 10)}...
                    </a>
                  </td>
                  <td className="py-4 text-center">
                    <Badge status={a.cleanverseStatus === "VERIFIED" ? "safe" : "critical"}>
                      {a.cleanverseStatus === "VERIFIED" ? "✓ VERIFIED" : "✖ BLOCKED"}
                    </Badge>
                  </td>
                  <td className="py-4 text-right">
                    <Button
                      variant="secondary"
                      onClick={() => handleDownloadTravelRule(a.txHash)}
                      disabled={downloading}
                      className="!py-1 !px-3 !text-[11px]"
                    >
                      {downloading ? "Downloading..." : "Travel Rule Pack"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
