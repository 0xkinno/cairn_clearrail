"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface TransactionProofCardProps {
  txHash: string;
  blockNumber?: number;
  fromAddress?: string;
  toAddress?: string;
  assetSymbol?: string;
  amount?: string | number;
  cleanverseVerified?: boolean;
  workProofVerified?: boolean;
  travelRuleAvailable?: boolean;
  onDownloadTravelRule?: () => void;
}

export function TransactionProofCard({
  txHash,
  blockNumber,
  fromAddress,
  toAddress,
  assetSymbol = "A-USDC",
  amount,
  cleanverseVerified = true,
  workProofVerified = true,
  travelRuleAvailable = true,
  onDownloadTravelRule
}: TransactionProofCardProps) {
  const explorerUrl = `${process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_EXPLORER_URL || "https://sepolia.arbiscan.io"}/tx/${txHash}`;

  return (
    <div className="border border-[var(--color-border)] rounded-3xl p-6 bg-gradient-to-br from-[rgba(255,255,253,0.95)] to-[rgba(242,240,235,0.8)] backdrop-blur-md shadow-md flex flex-col gap-5 text-left">
      {/* Institutional Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-status-safe)] animate-pulse" />
          <span className="text-mono-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
            CONFIRMED ON ARBITRUM SEPOLIA (CHAIN ID 421614)
          </span>
        </div>
        <Badge status="safe">SETTLED & ANCHORED</Badge>
      </div>

      {/* Grid of Key Proof Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-mono-sm">
        <div className="flex flex-col gap-1 bg-white/60 p-3 rounded-xl border border-[var(--color-border-subtle)]">
          <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Transaction Hash</span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-status-info)] hover:underline truncate font-mono text-body-sm font-semibold"
            title={txHash}
          >
            {txHash}
          </a>
        </div>

        {blockNumber && (
          <div className="flex flex-col gap-1 bg-white/60 p-3 rounded-xl border border-[var(--color-border-subtle)]">
            <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Block Number</span>
            <span className="text-[var(--color-text-primary)] font-mono text-body-sm font-semibold">
              #{blockNumber}
            </span>
          </div>
        )}

        {amount && (
          <div className="flex flex-col gap-1 bg-white/60 p-3 rounded-xl border border-[var(--color-border-subtle)]">
            <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Settled Amount & Asset</span>
            <span className="text-[var(--color-text-primary)] font-mono text-body-sm font-bold">
              {typeof amount === "number" ? `$${amount.toFixed(2)}` : amount} {assetSymbol}
            </span>
          </div>
        )}

        {fromAddress && (
          <div className="flex flex-col gap-1 bg-white/60 p-3 rounded-xl border border-[var(--color-border-subtle)]">
            <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Payer (Employer)</span>
            <span className="text-[var(--color-text-secondary)] font-mono text-mono-sm truncate">
              {fromAddress}
            </span>
          </div>
        )}

        {toAddress && (
          <div className="flex flex-col gap-1 bg-white/60 p-3 rounded-xl border border-[var(--color-border-subtle)]">
            <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Recipient (Worker Escrow)</span>
            <span className="text-[var(--color-text-secondary)] font-mono text-mono-sm truncate">
              {toAddress}
            </span>
          </div>
        )}
      </div>

      {/* Verification Status Signals */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {cleanverseVerified && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-status-safe-bg)] text-[var(--color-status-safe)] text-mono-sm font-semibold border border-[rgba(61,122,74,0.2)]">
            ✓ CLEANVERSE V5.6 VERIFIED
          </span>
        )}

        {workProofVerified && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(212,148,10,0.1)] text-[var(--color-accent-text)] text-mono-sm font-semibold border border-[rgba(212,148,10,0.3)]">
            ✓ WORKPROOF ANCHORED
          </span>
        )}

        {travelRuleAvailable && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-status-info-bg)] text-[var(--color-status-info)] text-mono-sm font-semibold border border-[rgba(46,107,158,0.2)]">
            ✓ TRAVEL RULE READY
          </span>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-4 border-t border-[var(--color-border-subtle)] pt-4 mt-1">
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-mono-sm font-semibold text-[var(--color-accent)] hover:underline flex items-center gap-1"
        >
          View on Arbitrum Sepolia Arbiscan →
        </a>

        {travelRuleAvailable && onDownloadTravelRule && (
          <Button variant="secondary" onClick={onDownloadTravelRule} className="!py-1.5 !px-3.5 !text-mono-sm">
            Download Travel Rule Report
          </Button>
        )}
      </div>
    </div>
  );
}
