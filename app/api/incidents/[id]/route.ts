import { NextRequest, NextResponse } from "next/server";
import { getManagerOrgId } from "@/lib/supabase/manager-guard";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getManagerOrgId();
  if (result.error) return result.error;
  const { admin, orgId } = result;

  const { data, error } = await admin
    .from("incidents")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: error?.message || "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getManagerOrgId();
  if (result.error) return result.error;
  const { admin, orgId } = result;

  const body = await req.json();
  const { status, resolutionNotes, txHash } = body as { status?: string; resolutionNotes?: string; txHash?: string };

  const updateData: any = {};
  if (status !== undefined) {
    updateData.status = status;
    updateData.resolved_at = status === "resolved" ? new Date().toISOString() : null;
  }
  if (resolutionNotes !== undefined) {
    updateData.resolution_notes = resolutionNotes || null;
  }
  if (txHash !== undefined) {
    updateData.near_tx_hash = txHash;
  }

  const { data, error } = await admin
    .from("incidents")
    .update(updateData)
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message || "Update failed" }, { status: 500 });
  return NextResponse.json({ data });
}
