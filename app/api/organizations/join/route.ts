import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inviteCode } = (await req.json()) as { inviteCode: string };
  if (!inviteCode) return NextResponse.json({ error: "Invite code required" }, { status: 400 });

  const { data: worker } = await supabase.from("workers").select("id").eq("user_id", user.id).maybeSingle();
  if (!worker) return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });

  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id, name")
    .eq("invite_code", inviteCode.trim().toLowerCase())
    .maybeSingle();
  if (!org) return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });

  const { data: existing } = await admin
    .from("worker_assignments")
    .select("id")
    .eq("worker_id", worker.id)
    .eq("org_id", org.id)
    .eq("status", "active")
    .maybeSingle();
  if (existing) return NextResponse.json({ error: "Already assigned to this organization" }, { status: 409 });

  const { error: insertError } = await admin.from("worker_assignments").insert({
    worker_id: worker.id,
    org_id: org.id,
    status: "active",
  });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  const { count } = await admin
    .from("worker_assignments")
    .select("id", { count: "exact", head: true })
    .eq("org_id", org.id)
    .eq("status", "active");
  await admin.from("organizations").update({ worker_count: count || 0 }).eq("id", org.id);

  return NextResponse.json({ success: true, orgName: org.name });
}
