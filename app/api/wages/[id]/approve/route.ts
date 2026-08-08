import { NextRequest, NextResponse } from "next/server";
import { getManagerOrgId } from "@/lib/supabase/manager-guard";
import { createClient } from "@/lib/supabase/server";
import { recordWageHashOnChain } from "@/lib/blockchain/evm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getManagerOrgId();
  if (result.error) return result.error;
  const { admin, orgId } = result;

  const { data: wage } = await admin
    .from("wage_records")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!wage) return NextResponse.json({ error: "Wage record not found" }, { status: 404 });
  if (wage.status !== "pending") {
    return NextResponse.json({ error: "Only pending records can be approved" }, { status: 409 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let txHashToRecord: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    txHashToRecord = body.txHash || null;
  } catch (e) {
    // Fallback to server signing
  }

  try {
    if (!txHashToRecord) {
      const { txHash } = await recordWageHashOnChain({
        wageRecordId: wage.id,
        workerId: wage.worker_id,
        payHash: wage.pay_hash || "",
        amount: wage.net_pay.toString(),
        currency: wage.currency,
        period: `${wage.pay_period_start}_${wage.pay_period_end}`,
      });
      txHashToRecord = txHash;
    }

    const { data, error } = await admin
      .from("wage_records")
      .update({
        status: "approved",
        approved_by: user?.id || null,
        near_tx_hash: txHashToRecord,
        paid_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "On-chain wage recording failed" },
      { status: 500 }
    );
  }
}
