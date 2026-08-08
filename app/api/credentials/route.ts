import { NextResponse } from "next/server";
import { getManagerOrgId } from "@/lib/supabase/manager-guard";

export async function GET() {
  const result = await getManagerOrgId();
  if (result.error) return result.error;
  const { admin, orgId } = result;

  const { data: credentials, error } = await admin
    .from("credentials")
    .select("*")
    .eq("issuer_org_id", orgId)
    .order("issued_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const workerIds = [...new Set((credentials || []).map((c) => c.worker_id))];
  const { data: workers } =
    workerIds.length > 0 ? await admin.from("workers").select("id, full_name").in("id", workerIds) : { data: [] };
  const nameById = new Map((workers || []).map((w) => [w.id, w.full_name]));

  const data = (credentials || []).map((c) => ({ ...c, worker_name: nameById.get(c.worker_id) || "Unknown" }));
  return NextResponse.json({ data });
}
