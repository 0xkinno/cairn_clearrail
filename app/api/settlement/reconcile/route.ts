import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CleanverseClient } from "@/lib/cleanverse/adapter";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wageRecordId, txHash, isCompliant, blockedReason, userAddress } = body as {
      wageRecordId: string;
      txHash: string;
      isCompliant: boolean;
      blockedReason?: string;
      userAddress?: string;
    };

    if (!wageRecordId || !txHash) {
      return NextResponse.json({ error: "Missing wageRecordId or txHash" }, { status: 400 });
    }

    const admin = createAdminClient();
    const cleanverse = new CleanverseClient();

    // 1. Fetch current wage record
    const { data: wage, error: wageErr } = await admin
      .from("wage_records")
      .select("*, workers(*)")
      .eq("id", wageRecordId)
      .single();

    if (wageErr || !wage) {
      return NextResponse.json({ error: "Wage record not found" }, { status: 404 });
    }

    const newStatus = isCompliant ? "paid" : "blocked";

    // 2. Query Cleanverse /query_txs for transaction reconciliation if wallet address provided
    let cleanverseTx = null;
    const workerWallet = (wage as any).workers?.near_account || (wage as any).workers?.wallet_address || userAddress;
    if (workerWallet) {
      try {
        const cleanverseRes = await cleanverse.queryTransactions(workerWallet, "arbitrum", undefined, txHash);
        if (cleanverseRes.code === "0000" && cleanverseRes.data?.txs?.length > 0) {
          cleanverseTx = cleanverseRes.data.txs[0];
        }
      } catch (e) {
        console.warn("Cleanverse queryTransactions fallback warning:", e);
      }
    }

    // 3. Update Supabase record with confirmed wallet transaction hash
    const updatePayload: any = {
      status: newStatus,
      near_tx_hash: txHash, // database column storing confirmed transaction hash
      notes: isCompliant ? "Settled on Arbitrum Sepolia" : `Blocked: ${blockedReason || "Compliance failure"}`
    };

    if (isCompliant) {
      updatePayload.paid_at = new Date().toISOString();
    }

    const { error: updateErr } = await admin
      .from("wage_records")
      .update(updatePayload)
      .eq("id", wageRecordId);

    if (updateErr) {
      console.error("Supabase update error:", updateErr);
    }

    // 4. Create an audit trail anchor
    const auditHash = crypto.createHash("sha256").update(JSON.stringify({
      wageRecordId,
      txHash,
      isCompliant,
      status: newStatus,
      reconciledAt: new Date().toISOString()
    })).digest("hex");

    return NextResponse.json({
      success: true,
      wageRecordId,
      txHash,
      status: newStatus,
      auditHash,
      cleanverseReconciliation: cleanverseTx ? "VERIFIED" : "PENDING_INDEX"
    });
  } catch (error: any) {
    console.error("Settlement reconcile error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
