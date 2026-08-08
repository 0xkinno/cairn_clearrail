"use client";

import { useAccount } from "wagmi";

export function DashboardWalletControl({ walletAddress }: { walletAddress?: string }) {
  const { address, isConnected } = useAccount();

  return (
    <div className="flex items-center gap-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] px-4 py-2 rounded-2xl text-mono-sm">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-[var(--color-status-safe)] animate-pulse" : "bg-[var(--color-status-warning)]"}`} />
        <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold tracking-wider">
          ARBITRUM SEPOLIA WALLET:
        </span>
      </div>

      {address ? (
        <span className="font-mono text-body-sm font-semibold text-[var(--color-text-primary)] truncate max-w-[180px]" title={address}>
          {address}
        </span>
      ) : walletAddress ? (
        <span className="font-mono text-body-sm text-[var(--color-text-secondary)] truncate max-w-[180px]" title={walletAddress}>
          {walletAddress}
        </span>
      ) : (
        <span className="text-body-sm text-[var(--color-status-warning)] italic">
          Not Connected
        </span>
      )}

      <div className="ml-auto">
        <appkit-button balance="hide" size="sm" />
      </div>
    </div>
  );
}
