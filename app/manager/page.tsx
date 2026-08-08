import { redirect } from "next/navigation";
import { getManagerOrgId } from "@/lib/supabase/manager-guard";
import { ComplianceOverview } from "@/components/manager/ComplianceOverview";
import { HazardFeed } from "@/components/manager/HazardFeed";

export default async function ManagerDashboardPage() {
  const result = await getManagerOrgId();
  if (result.error) redirect("/onboarding");
  const { admin, orgId } = result;

  const { data: org } = await admin
    .from("organizations")
    .select("name, site_name, worker_count, site_safety_score, invite_code")
    .eq("id", orgId)
    .maybeSingle();

  if (!org) redirect("/onboarding");

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: openIncidents }, { data: recentHazards }] = await Promise.all([
    admin
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "open"),
    admin
      .from("hazard_flags")
      .select("*")
      .eq("org_id", orgId)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="px-6 md:px-10 py-12 flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-mono-md text-[var(--color-text-tertiary)] mb-1">{org.site_name || "Site"}</p>
          <h1 className="text-display-md">{org.name}</h1>
        </div>
        <div className="text-right">
          <p className="text-mono-sm text-[var(--color-text-tertiary)]">Invite Code</p>
          <p className="text-mono-lg">{org.invite_code}</p>
        </div>
      </div>

      <ComplianceOverview
        siteScore={org.site_safety_score}
        workerCount={org.worker_count}
        openIncidents={openIncidents || 0}
        hazardsThisWeek={recentHazards?.length || 0}
      />

      <div className="flex flex-col gap-4">
        <p className="text-heading-sm">Live hazard feed</p>
        <HazardFeed orgId={orgId} initialHazards={recentHazards || []} />
      </div>
    </div>
  );
}
