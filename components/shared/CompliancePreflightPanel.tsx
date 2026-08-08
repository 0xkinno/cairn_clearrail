"use client";

import { Badge } from "@/components/ui/Badge";

interface PreflightResult {
  identityVerified: boolean;
  assetVerified: boolean;
  compliancePoolVerified: boolean;
  transactionContextVerified: boolean;
  passed: boolean;
  blockedReason?: string;
  workerName?: string;
  walletAddress?: string;
}

export function CompliancePreflightPanel({ result }: { result: PreflightResult }) {
  return (
    <div className="border border-[var(--color-border)] rounded-2xl p-5 bg-white/80 backdrop-blur-md shadow-sm flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${result.passed ? "bg-[var(--color-status-safe)]" : "bg-[var(--color-status-critical)]"}`} />
          <span className="text-mono-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)]">
            CLEANVERSE V5.6 COMPLIANCE PREFLIGHT
          </span>
        </div>
        <Badge status={result.passed ? "safe" : "critical"}>
          {result.passed ? "READY FOR SETTLEMENT" : "SETTLEMENT BLOCKED"}
        </Badge>
      </div>

      {result.workerName && (
        <div className="flex flex-col">
          <span className="text-[10px] text-mono-md text-[var(--color-text-tertiary)] uppercase">Worker Target</span>
          <span className="text-body-sm font-semibold text-[var(--color-text-primary)]">
            {result.workerName} {result.walletAddress ? `(${result.walletAddress})` : ""}
          </span>
        </div>
      )}

      {/* Audit Checklist */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-mono-sm">
        <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${result.identityVerified ? "bg-[var(--color-status-safe-bg)] border-[rgba(61,122,74,0.2)] text-[var(--color-status-safe)]" : "bg-[var(--color-status-critical-bg)] border-[rgba(181,48,42,0.2)] text-[var(--color-status-critical)]"}`}>
          <span>{result.identityVerified ? "✓" : "✕"}</span>
          <span className="font-semibold text-[11px]">Worker Identity</span>
        </div>

        <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${result.assetVerified ? "bg-[var(--color-status-safe-bg)] border-[rgba(61,122,74,0.2)] text-[var(--color-status-safe)]" : "bg-[var(--color-status-critical-bg)] border-[rgba(181,48,42,0.2)] text-[var(--color-status-critical)]"}`}>
          <span>{result.assetVerified ? "✓" : "✕"}</span>
          <span className="font-semibold text-[11px]">A-Token Asset</span>
        </div>

        <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${result.compliancePoolVerified ? "bg-[var(--color-status-safe-bg)] border-[rgba(61,122,74,0.2)] text-[var(--color-status-safe)]" : "bg-[var(--color-status-critical-bg)] border-[rgba(181,48,42,0.2)] text-[var(--color-status-critical)]"}`}>
          <span>{result.compliancePoolVerified ? "✓" : "✕"}</span>
          <span className="font-semibold text-[11px]">Validator Rules</span>
        </div>

        <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${result.transactionContextVerified ? "bg-[var(--color-status-safe-bg)] border-[rgba(61,122,74,0.2)] text-[var(--color-status-safe)]" : "bg-[var(--color-status-critical-bg)] border-[rgba(181,48,42,0.2)] text-[var(--color-status-critical)]"}`}>
          <span>{result.transactionContextVerified ? "✓" : "✕"}</span>
          <span className="font-semibold text-[11px]">Batch Context</span>
        </div>
      </div>

      {!result.passed && result.blockedReason && (
        <div className="p-3 bg-[var(--color-status-critical-bg)] border border-[rgba(181,48,42,0.3)] rounded-xl text-mono-sm text-[var(--color-status-critical)]">
          <p className="font-semibold">Reason for Preflight Block:</p>
          <p className="mt-0.5">{result.blockedReason}</p>
        </div>
      )}
    </div>
  );
}
