import { redirect } from "next/navigation";
import { getManagerOrgId } from "@/lib/supabase/manager-guard";
import { SiteHeatmap } from "@/components/manager/SiteHeatmap";
import { RiskForecast } from "@/components/manager/RiskForecast";

export default async function ManagerAnalyticsPage() {
  const result = await getManagerOrgId();
  if (result.error) redirect("/onboarding");
  const { admin, orgId } = result;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: hazards } = await admin
    .from("hazard_flags")
    .select("zone")
    .eq("org_id", orgId)
    .gte("created_at", thirtyDaysAgo);

  const zoneCounts = new Map<string, number>();
  for (const h of hazards || []) {
    const zone = h.zone || "Unspecified";
    zoneCounts.set(zone, (zoneCounts.get(zone) || 0) + 1);
  }
  const zoneData = Array.from(zoneCounts.entries()).map(([zone, count]) => ({ zone, count }));

  return (
    <div className="px-6 md:px-10 py-12 flex flex-col gap-12">
      <h1 className="text-display-md">Analytics</h1>

      <div className="flex flex-col gap-4">
        <p className="text-heading-sm">Hazard density by zone (30 days)</p>
        <SiteHeatmap data={zoneData} />
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-heading-sm">Predictive safety intelligence</p>
        <RiskForecast orgId={orgId} />
      </div>
    </div>
  );
}
