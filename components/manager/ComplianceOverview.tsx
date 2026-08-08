interface ComplianceOverviewProps {
  siteScore: number;
  workerCount: number;
  openIncidents: number;
  hazardsThisWeek: number;
}

export function ComplianceOverview({
  siteScore,
  workerCount,
  openIncidents,
  hazardsThisWeek,
}: ComplianceOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
      <div className="bg-[var(--color-bg-secondary)] p-6">
        <p className="text-stat">{Number(siteScore ?? 50).toFixed(0)}</p>
        <p className="text-mono-sm text-[var(--color-text-tertiary)]">Site Safety Score</p>
      </div>
      <div className="bg-[var(--color-bg-secondary)] p-6">
        <p className="text-stat">{workerCount}</p>
        <p className="text-mono-sm text-[var(--color-text-tertiary)]">Active Workers</p>
      </div>
      <div className="bg-[var(--color-bg-secondary)] p-6">
        <p className="text-stat">{openIncidents}</p>
        <p className="text-mono-sm text-[var(--color-text-tertiary)]">Open Incidents</p>
      </div>
      <div className="bg-[var(--color-bg-secondary)] p-6">
        <p className="text-stat">{hazardsThisWeek}</p>
        <p className="text-mono-sm text-[var(--color-text-tertiary)]">Hazards This Week</p>
      </div>
    </div>
  );
}
