"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { useAccount } from "wagmi";

const MANAGER_NAV = [
  { label: "Overview", href: "/manager" },
  { label: "WorkProof", href: "/manager/workproof" },
  { label: "Compliance Lab", href: "/manager/compliance-lab" },
  { label: "Payroll", href: "/manager/wages" },
  { label: "Financing", href: "/manager/financing" },
  { label: "Audit Center", href: "/manager/audit" },
  { label: "Workers", href: "/manager/workers" },
  { label: "Incidents", href: "/manager/incidents" },
  { label: "Credentials", href: "/manager/credentials" },
  { label: "Analytics", href: "/manager/analytics" },
  { label: "Settings", href: "/manager/settings" },
];

function ManagerSidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { address, isConnected } = useAccount();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 border-r border-[var(--color-border)] p-6 flex flex-col justify-between bg-[rgba(255,255,253,0.85)] backdrop-blur-md min-h-screen sticky top-0 z-20">
      {/* Brand logo and navigation links */}
      <div className="flex flex-col gap-6">
        <Link href="/manager" className="flex flex-col gap-1 text-left">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
            <span className="text-heading-md font-serif font-bold tracking-tight text-[var(--color-text-primary)]">
              CLEAR RAIL
            </span>
          </div>
          <span className="text-[10px] text-mono-sm text-[var(--color-accent)] font-semibold tracking-widest uppercase pl-5">
            ARBITRUM SEPOLIA
          </span>
        </Link>
        
        <nav className="flex flex-col gap-1">
          {MANAGER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-mono-md px-3 py-2 rounded-xl transition-all duration-200 hover:bg-[rgba(20,18,16,0.035)] text-left flex items-center justify-between",
                pathname === item.href
                  ? "text-[var(--color-text-primary)] font-bold bg-[rgba(212,148,10,0.08)] border-l-2 border-[var(--color-accent)] pl-2.5"
                  : "text-[var(--color-text-tertiary)]"
              )}
            >
              <span>{item.label}</span>
              {item.href === "/manager/compliance-lab" && (
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-ping" />
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Reown AppKit Wallet Connection & Account Status */}
      <div className="flex flex-col gap-4 mt-6">
        <div className="glowing-badge-frame !w-full flex-col !items-stretch !p-3.5 !rounded-2xl border-[rgba(212,148,10,0.3)] text-left bg-gradient-to-br from-[rgba(255,255,253,0.95)] to-[rgba(253,246,231,0.9)] shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-mono-md font-bold text-[var(--color-text-tertiary)] tracking-widest uppercase">
              NETWORK: 421614
            </span>
            {isConnected ? (
              <span className="text-[9px] text-mono-md font-semibold text-[var(--color-status-safe)] bg-[var(--color-status-safe-bg)] px-1.5 py-0.5 rounded">
                CONNECTED
              </span>
            ) : (
              <span className="text-[9px] text-mono-md font-semibold text-[var(--color-status-warning)] bg-[var(--color-status-warning-bg)] px-1.5 py-0.5 rounded">
                DISCONNECTED
              </span>
            )}
          </div>

          <div className="w-full flex justify-center">
            <appkit-button balance="show" size="sm" />
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-mono-md text-[var(--color-text-tertiary)] text-left px-3 hover:text-[var(--color-status-critical)] transition-colors"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full premium-bg relative">
      {/* Grid pattern background */}
      <div className="absolute inset-0 grid-pattern opacity-[0.2] pointer-events-none z-0" />
      
      {/* Left Sidebar */}
      <ManagerSidebarContent />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden relative z-10">
        {children}
      </main>
    </div>
  );
}
