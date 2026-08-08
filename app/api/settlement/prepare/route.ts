import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CleanverseClient } from "@/lib/cleanverse/adapter";
import { generateComplianceAttestation } from "@/lib/blockchain/evm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wageRecordIds, tokenAddress, batchId } = body as {
      wageRecordIds: string[];
      tokenAddress: string;
      batchId?: number;
    };

    if (!wageRecordIds || wageRecordIds.length === 0 || !tokenAddress) {
      return NextResponse.json({ error: "Missing wageRecordIds or tokenAddress" }, { status: 400 });
    }

    const admin = createAdminClient();
    const cleanverse = new CleanverseClient();

    // 1. Fetch wage records & worker profiles
    const { data: wages, error: wagesErr } = await admin
      .from("wage_records")
      .select("*, workers(*)")
      .in("id", wageRecordIds);

    if (wagesErr || !wages || wages.length === 0) {
      return NextResponse.json({ error: "Wage records not found in database." }, { status: 404 });
    }

    const targetBatchId = batchId || 1;
    const items = [];

    let index = 0;
    for (const wage of wages as any[]) {
      const workerWallet = wage.workers?.near_account || wage.workers?.wallet_address;
      if (!workerWallet) {
        return NextResponse.json({ error: `Worker ${wage.workers?.full_name} does not have a linked wallet address.` }, { status: 400 });
      }

      // Preflight Checks
      const isMockRevoked = wage.workers.score_breakdown && (wage.workers.score_breakdown as any).mock_revoke_apass === true;
      const isMockBlacklisted = wage.workers.score_breakdown && (wage.workers.score_breakdown as any).mock_blacklist === true;

      // A. Verify A-Pass
      let apassValid = false;
      let apassReason = "A-Pass verification failed";
      if (isMockRevoked) {
        apassValid = false;
        apassReason = "[MOCK_COMPLIANCE] A-Pass revoked by supervisor.";
      } else {
        const apassRes = await cleanverse.verifyAPass(workerWallet, tokenAddress, "arbitrum");
        if (apassRes.code === "0000" && apassRes.data?.code === 4) {
          apassValid = true;
        } else {
          apassReason = apassRes.data ? apassRes.data.message : (apassRes.message || "A-Pass invalid");
        }
      }

      // B. Verify Validator Compliance Pool
      let poolValid = false;
      let poolReason = "Compliance Pool verification failed";
      if (isMockBlacklisted) {
        poolValid = false;
        poolReason = "[MOCK_COMPLIANCE] Country blacklist triggered (worker nationality: North Korea).";
      } else {
        const contractAddress = process.env.NEXT_PUBLIC_CLEARAIL_CORE_ADDRESS || process.env.CLEARAIL_CORE_ADDRESS || "";
        const complianceRes = await cleanverse.verifyUserCompliance(contractAddress, workerWallet, "arbitrum");
        if (complianceRes.code === "0000" && complianceRes.data?.valid) {
          poolValid = true;
        } else {
          poolReason = complianceRes.message || "User failed compliance rules";
        }
      }

      const isCompliant = apassValid && poolValid;
      const blockedReason = isCompliant ? "" : `${apassValid ? "" : apassReason + " "}${poolValid ? "" : poolReason}`;
      const amountUnits = BigInt(Math.round(wage.net_pay * 1000000)); // 6 decimals A-Token standard

      // Generate Registrar Signature for On-Chain Verification
      const nonce = Math.floor(Math.random() * 1000000) + 1;
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour validity

      const attestation = await generateComplianceAttestation({
        batchId: targetBatchId,
        paymentIndex: index,
        workerAddress: workerWallet,
        amount: amountUnits,
        isApproved: isCompliant,
        nonce,
        deadline
      });

      items.push({
        wageRecordId: wage.id,
        paymentIndex: index,
        workerName: wage.workers.full_name,
        workerWallet,
        amountCents: wage.net_pay,
        amountUnits: amountUnits.toString(),
        isCompliant,
        blockedReason,
        attestation: {
          signature: attestation.signature,
          nonce: attestation.nonce,
          deadline: attestation.deadline
        }
      });

      index++;
    }

    return NextResponse.json({
      success: true,
      batchId: targetBatchId,
      items
    });
  } catch (error: any) {
    console.error("Settlement prepare error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
