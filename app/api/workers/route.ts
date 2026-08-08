import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getManagerOrgId } from "@/lib/supabase/manager-guard";
import { registerWorkerOnChain } from "@/lib/blockchain/evm";

export async function GET() {
  const result = await getManagerOrgId();
  if (result.error) return result.error;
  const { admin, orgId } = result;

  const { data: assignments } = await admin
    .from("worker_assignments")
    .select("worker_id")
    .eq("org_id", orgId)
    .eq("status", "active");

  const workerIds = (assignments || []).map((a) => a.worker_id);
  if (workerIds.length === 0) return NextResponse.json({ data: [] });

  const { data: workers, error } = await admin
    .from("workers")
    .select("id, full_name, trade, safety_score, current_streak, total_checkins, near_account, profile_photo_url")
    .in("id", workerIds)
    .order("full_name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: workers });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fullName, trade, preferredLanguage, nearAccount } = await req.json();

  if (!fullName) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Normalize wallet address to lowercase
  const walletAddress = nearAccount ? nearAccount.toLowerCase() : null;

  const { data: worker, error } = await admin
    .from("workers")
    .insert({
      user_id: user.id,
      full_name: fullName,
      email: user.email,
      trade: trade || null,
      preferred_language: preferredLanguage || "en",
      near_account: walletAddress,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // On-chain registration on Arbitrum Sepolia
  if (walletAddress) {
    try {
      console.log(`Registering worker ${walletAddress} on ClearRailCore...`);
      await registerWorkerOnChain(walletAddress, fullName, trade || "");
      console.log(`Worker registered on-chain successfully.`);
    } catch (e: any) {
      console.error("Failed to register worker on-chain:", e.message);
      // Do not fail the API call since the DB record is already successfully created.
    }
  }

  return NextResponse.json({ success: true, data: worker });
}
