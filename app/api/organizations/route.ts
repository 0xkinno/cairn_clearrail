import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registerEmployerOnChain } from "@/lib/blockchain/evm";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, siteName, industry, city, nearAccount } = body as {
    name: string;
    siteName?: string;
    industry: string;
    city?: string;
    nearAccount?: string;
  };

  const admin = createAdminClient();

  // Normalize wallet address to lowercase
  const walletAddress = nearAccount ? nearAccount.toLowerCase() : null;

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      owner_id: user.id,
      name,
      site_name: siteName || null,
      industry,
      city: city || null,
      near_account: walletAddress,
    })
    .select()
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: orgError?.message || "Could not create organization." }, { status: 500 });
  }

  const { error: memberError } = await admin.from("org_members").insert({
    org_id: org.id,
    user_id: user.id,
    role: "owner",
    can_issue_credentials: true,
  });

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });

  // On-chain registration on Arbitrum Sepolia
  if (walletAddress) {
    try {
      console.log(`Registering employer ${walletAddress} on ClearRailCore...`);
      await registerEmployerOnChain(walletAddress, name, industry);
      console.log(`Employer registered on-chain successfully.`);
    } catch (e: any) {
      console.error("Failed to register employer on-chain:", e.message);
      // We do not fail the API call since the DB record is already successfully created.
    }
  }

  return NextResponse.json({ organization: org });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: worker } = await supabase.from("workers").select("id").eq("user_id", user.id).maybeSingle();
  if (!worker) return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });

  const admin = createAdminClient();
  const { data: assignment } = await admin
    .from("worker_assignments")
    .select("org_id")
    .eq("worker_id", worker.id)
    .eq("status", "active")
    .maybeSingle();

  if (!assignment) return NextResponse.json({ organization: null });

  const { data: org } = await admin
    .from("organizations")
    .select("id, name, site_name")
    .eq("id", assignment.org_id)
    .maybeSingle();

  return NextResponse.json({ organization: org });
}
