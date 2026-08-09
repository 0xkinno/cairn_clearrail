"use client";

import { Button } from "@/components/ui/Button";

export type TxStep = "IDLE" | "PREPARING" | "CONFIRM_IN_WALLET" | "BROADCASTING" | "CONFIRMED" | "FAILED" | "REJECTED";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  step: TxStep;
  actionLabel?: string;
  network?: string;
  assetSymbol?: string;
  amount?: string | number;
  recipient?: string;
  txHash?: string;
  errorReason?: string;
  onConfirm?: () => void;
}

export function TransactionModal({
  isOpen,
  onClose,
  title,
  step,
  actionLabel = "SETTLE PAYROLL",
  network = "ARBITRUM SEPOLIA (421614)",
  assetSymbol = "A-USDC",
  amount,
  recipient,
  txHash,
  errorReason,
  onConfirm
}: TransactionModalProps) {
  if (!isOpen) return null;

  const explorerUrl = txHash ? `${process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_EXPLORER_URL || "https://sepolia.arbiscan.io"}/tx/${txHash}` : "#";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-6 text-left relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
          <div>
            <span className="text-[10px] text-mono-md font-bold text-[var(--color-accent)] uppercase tracking-wider">
              ARBITRUM SEPOLIA CONTRACT TRANSACTION
            </span>
            <h3 className="text-heading-md font-serif text-[var(--color-text-primary)] font-bold mt-0.5">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] p-1 rounded-full text-lg"
          >
            ✕
          </button>
        </div>

        {/* Transaction Summary Card */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-2xl p-4 flex flex-col gap-3 text-mono-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-tertiary)] uppercase text-[10px]">Action</span>
            <span className="font-bold text-[var(--color-text-primary)]">{actionLabel}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-[var(--color-text-tertiary)] uppercase text-[10px]">Target Network</span>
            <span className="font-semibold text-[var(--color-status-info)]">{network}</span>
          </div>

          {amount && (
            <div className="flex justify-between">
              <span className="text-[var(--color-text-tertiary)] uppercase text-[10px]">Asset & Amount</span>
              <span className="font-bold text-[var(--color-text-primary)]">
                {typeof amount === "number" ? `$${amount.toFixed(2)}` : amount} {assetSymbol}
              </span>
            </div>
          )}

          {recipient && (
            <div className="flex justify-between">
              <span className="text-[var(--color-text-tertiary)] uppercase text-[10px]">Recipient / Worker</span>
              <span className="font-mono text-mono-sm truncate max-w-[200px]">{recipient}</span>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-[var(--color-border-subtle)] pt-2 mt-1">
            <span className="text-[var(--color-text-tertiary)] uppercase text-[10px]">Cleanverse Preflight</span>
            <span className="text-[var(--color-status-safe)] font-semibold text-[11px]">✓ VERIFIED & ATTESTED</span>
          </div>
        </div>

        {/* Step Progression View */}
        <div className="flex flex-col gap-3">
          {step === "PREPARING" && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] text-body-sm">
              <span className="w-4 h-4 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
              <span>Running Cleanverse compliance preflight and preparing transaction...</span>
            </div>
          )}

          {step === "CONFIRM_IN_WALLET" && (
            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[rgba(212,148,10,0.12)] border border-[rgba(212,148,10,0.3)] text-left">
              <div className="flex items-center gap-2 text-[var(--color-accent-text)] font-semibold text-body-sm">
                <span className="w-3 h-3 rounded-full bg-[var(--color-accent)] animate-ping" />
                <span>CONFIRM TRANSACTION IN YOUR REOWN / EVM WALLET</span>
              </div>
              <p className="text-body-sm text-[var(--color-text-secondary)]">
                Please approve the transaction prompt in your connected wallet. This will submit a real contract transaction to Arbitrum Sepolia.
              </p>
            </div>
          )}

          {step === "BROADCASTING" && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--color-status-info-bg)] text-[var(--color-status-info)] text-body-sm">
              <span className="w-4 h-4 rounded-full border-2 border-[var(--color-status-info)] border-t-transparent animate-spin" />
              <div>
                <p className="font-semibold">Broadcasting to Arbitrum Sepolia...</p>
                {txHash && (
                  <p className="text-mono-sm text-[11px] truncate mt-0.5" title={txHash}>
                    Tx: {txHash}
                  </p>
                )}
              </div>
            </div>
          )}

          {step === "CONFIRMED" && (
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-[var(--color-status-safe-bg)] border border-[rgba(61,122,74,0.3)] text-left">
              <div className="flex items-center gap-2 text-[var(--color-status-safe)] font-semibold">
                <span>✓</span>
                <span>TRANSACTION CONFIRMED ON-CHAIN!</span>
              </div>
              {txHash && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mono-sm text-[var(--color-status-info)] hover:underline truncate font-mono text-[11px]"
                >
                  View Tx on Arbiscan: {txHash} →
                </a>
              )}
            </div>
          )}

          {(step === "FAILED" || step === "REJECTED") && (
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-[var(--color-status-critical-bg)] border border-[rgba(181,48,42,0.3)] text-left text-mono-sm text-[var(--color-status-critical)]">
              <p className="font-semibold">
                {step === "REJECTED" ? "Transaction Rejected in Wallet" : "Transaction Execution Failed"}
              </p>
              {errorReason && <p className="text-[11px] text-[var(--color-text-secondary)]">{errorReason}</p>}
            </div>
          )}
        </div>

        {/* Modal Buttons */}
        <div className="flex justify-end gap-3 border-t border-[var(--color-border-subtle)] pt-4">
          {step === "CONFIRMED" ? (
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          ) : step === "IDLE" && onConfirm ? (
            <>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={onConfirm}>
                Confirm in Wallet
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={onClose} disabled={step === "BROADCASTING"}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
