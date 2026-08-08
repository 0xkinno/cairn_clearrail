import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const admin = createAdminClient();
  const [{ data: worker }, { data: member }] = await Promise.all([
    admin.from("workers").select("id, near_account").eq("user_id", user.id).maybeSingle(),
    admin.from("org_members").select("org_id").eq("user_id", user.id).maybeSingle(),
  ]);

  if (worker) {
    return NextResponse.json({ authenticated: true, role: "worker", onboarded: true, worker });
  }
  if (member) {
    return NextResponse.json({ authenticated: true, role: "manager", onboarded: true, orgId: member.org_id });
  }

  return NextResponse.json({ authenticated: true, onboarded: false });
}
