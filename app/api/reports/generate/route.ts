import { NextResponse } from "next/server";
import { getManagerOrgId } from "@/lib/supabase/manager-guard";

export async function POST() {
  const result = await getManagerOrgId();
  if (result.error) return result.error;
  const { admin, orgId } = result;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: org }, { count: openIncidents }, { count: resolvedIncidents }, { data: hazards }, { count: creditsIssued }] =
    await Promise.all([
      admin.from("organizations").select("name, site_safety_score, worker_count").eq("id", orgId).maybeSingle(),
      admin.from("incidents").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "open"),
      admin.from("incidents").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "resolved"),
      admin
        .from("hazard_flags")
        .select("hazard_type")
        .eq("org_id", orgId)
        .gte("created_at", thirtyDaysAgo),
      admin.from("credentials").select("id", { count: "exact", head: true }).eq("issuer_org_id", orgId),
    ]);

  const { data: assignments } = await admin
    .from("worker_assignments")
    .select("worker_id")
    .eq("org_id", orgId)
    .eq("status", "active");
  const workerIds = (assignments || []).map((a) => a.worker_id);
  const { data: workers } =
    workerIds.length > 0 ? await admin.from("workers").select("total_checkins").in("id", workerIds) : { data: [] };
  const totalCheckins = (workers || []).reduce((sum, w) => sum + w.total_checkins, 0);

  const hazardsByType: Record<string, number> = {};
  for (const h of hazards || []) {
    hazardsByType[h.hazard_type] = (hazardsByType[h.hazard_type] || 0) + 1;
  }

  return NextResponse.json({
    report: {
      orgName: org?.name || "Organization",
      generatedAt: new Date().toISOString(),
      siteScore: org?.site_safety_score || 0,
      workerCount: org?.worker_count || 0,
      totalCheckins,
      openIncidents: openIncidents || 0,
      resolvedIncidents: resolvedIncidents || 0,
      hazardsByType,
      creditsIssued: creditsIssued || 0,
    },
  });
}
