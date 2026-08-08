"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAccount } from "wagmi";

async function getSha256Hash(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface ReportData {
  orgName: string;
  generatedAt: string;
  siteScore: number;
  workerCount: number;
  totalCheckins: number;
  openIncidents: number;
  resolvedIncidents: number;
  hazardsByType: Record<string, number>;
  creditsIssued: number;
}

function buildReportText(r: ReportData): string {
  const hazardLines = Object.entries(r.hazardsByType)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `  - ${type.replace(/_/g, " ")}: ${count}`)
    .join("\n");

  return `CLEAR RAIL COMPLIANCE REPORT
${r.orgName}
Generated ${new Date(r.generatedAt).toLocaleString()}
Network: Arbitrum Sepolia (421614)

SITE SAFETY SCORE: ${r.siteScore.toFixed(0)} / 100
ACTIVE WORKERS: ${r.workerCount}
TOTAL CHECK-INS: ${r.totalCheckins}
CREDENTIALS ISSUED: ${r.creditsIssued}

INCIDENTS
  Open: ${r.openIncidents}
  Resolved: ${r.resolvedIncidents}

HAZARDS BY TYPE (last 30 days)
${hazardLines || "  None recorded"}
`;
}

export function ReportGenerator({ orgId }: { orgId: string }) {
  const { address } = useAccount();
  const [report, setReport] = useState<ReportData | null>(null);
  const [reportTxHash, setReportTxHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [orgId]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/generate?org_id=${orgId}`);
      if (!res.ok) throw new Error("Failed to load report data.");
      const body = await res.json();
      setReport(body.report || null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Report error");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!report) return;
    const text = buildReportText(report);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clearrail-compliance-${report.orgName.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  if (error || !report) {
    return (
      <div className="p-4 bg-[var(--color-bg-secondary)] rounded-2xl text-[var(--color-text-tertiary)] text-mono-sm text-left">
        {error || "No report data available."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 border border-[var(--color-border)] rounded-3xl p-6 bg-white/80 backdrop-blur-md shadow-sm text-left">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] text-mono-sm text-[var(--color-accent)] font-bold tracking-widest uppercase">
            AUDIT REPORT
          </span>
          <h3 className="text-heading-md font-serif font-bold text-[var(--color-text-primary)]">
            {report.orgName} Compliance Summary
          </h3>
        </div>
        <Button variant="secondary" onClick={handleDownload}>
          Export Text Report
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-mono-sm">
        <div className="p-3 bg-[var(--color-bg-secondary)] rounded-xl">
          <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase block">Site Score</span>
          <span className="text-heading-sm font-bold text-[var(--color-status-safe)]">
            {report.siteScore.toFixed(0)}/100
          </span>
        </div>
        <div className="p-3 bg-[var(--color-bg-secondary)] rounded-xl">
          <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase block">Active Workers</span>
          <span className="text-heading-sm font-bold text-[var(--color-text-primary)]">
            {report.workerCount}
          </span>
        </div>
        <div className="p-3 bg-[var(--color-bg-secondary)] rounded-xl">
          <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase block">Check-ins</span>
          <span className="text-heading-sm font-bold text-[var(--color-text-primary)]">
            {report.totalCheckins}
          </span>
        </div>
        <div className="p-3 bg-[var(--color-bg-secondary)] rounded-xl">
          <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase block">Credentials</span>
          <span className="text-heading-sm font-bold text-[var(--color-text-primary)]">
            {report.creditsIssued}
          </span>
        </div>
      </div>
    </div>
  );
}
