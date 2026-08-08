import { NextResponse } from "next/server";
import { createClient } from "./server";
import { createAdminClient } from "./admin";

/**
 * Verifies the current session belongs to a manager, and that `workerId` is
 * an actively assigned worker in that manager's organization.
 *
 * org_members has no RLS policies of its own (only referenced from other
 * tables' policies), so membership lookups must go through the admin client
 * after the session itself has been verified.
 */
export async function assertManagerCanAccessWorker(workerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) return { error: NextResponse.json({ error: "Not a manager" }, { status: 403 }) };

  const { data: assignment } = await admin
    .from("worker_assignments")
    .select("id")
    .eq("worker_id", workerId)
    .eq("org_id", member.org_id)
    .eq("status", "active")
    .maybeSingle();

  if (!assignment) return { error: NextResponse.json({ error: "Worker not found" }, { status: 404 }) };
  return { admin, orgId: member.org_id, error: undefined };
}

export async function getManagerOrgId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("org_members")
    .select("org_id, can_issue_credentials")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) return { error: NextResponse.json({ error: "Not a manager" }, { status: 403 }) };

  return {
    orgId: member.org_id,
    canIssueCredentials: member.can_issue_credentials,
    admin,
    error: undefined,
  };
}
