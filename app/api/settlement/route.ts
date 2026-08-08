import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CleanverseClient } from "@/lib/cleanverse/adapter";
import {
  createPayrollBatchOnChain,
  settlePaymentOnChain,
  markBatchSettledOnChain,
  anchorAuditDataOnChain
} from "@/lib/blockchain/evm";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wageRecordIds, tokenAddress, tokenSymbol } = body as {
      wageRecordIds: string[];
      tokenAddress: string;
      tokenSymbol: string;
    };

    if (!wageRecordIds || wageRecordIds.length === 0 || !tokenAddress) {
      return NextResponse.json({ error: "Missing wageRecordIds or tokenAddress" }, { status: 400 });
    }

    const admin = createAdminClient();
    const cleanverse = new CleanverseClient();

    // 1. Fetch all wage records from Supabase
    const { data: wages, error: wagesErr } = await admin
      .from("wage_records")
      .select("*, workers(*)")
      .in("id", wageRecordIds);

    if (wagesErr || !wages || wages.length === 0) {
      return NextResponse.json({ error: "Wage records not found in database." }, { status: 404 });
    }

    console.log(`Starting ClearRail compliant settlement for ${wages.length} wage records...`);

    // 2. Map workers and amounts for the batch
    const workerAddresses: string[] = [];
    const amounts: bigint[] = [];

    for (const wage of wages as any[]) {
      const workerWallet = wage.workers?.near_account || wage.workers?.wallet_address;
      if (!workerWallet) {
        return NextResponse.json({ error: `Worker ${wage.workers?.full_name || wage.worker_id} does not have a linked wallet address.` }, { status: 400 });
      }

      workerAddresses.push(workerWallet);
      // Net pay in cents/cents-equivalent, converted to 6 decimals (A-Token standard)
      const payAmount = BigInt(Math.round(wage.net_pay * 100)); // standard cent-factor
      amounts.push(payAmount);
    }

    // 3. Create the Payroll Batch on ClearRailCore (Arbitrum Sepolia)
    console.log("Creating payroll batch on-chain...");
    const batchResult = await createPayrollBatchOnChain(workerAddresses, amounts, tokenAddress);
    const batchId = batchResult.batchId;
    const batchTxHash = batchResult.txHash;
    console.log(`On-chain Payroll Batch created. Batch ID: ${batchId}, Tx: ${batchTxHash}`);

    // 4. Run compliance checks and settle each worker individually
    let overallBlocked = false;
    let index = 0;
    const settlementDetails = [];

    for (const wage of wages as any[]) {
      const workerWallet = wage.workers?.near_account || wage.workers?.wallet_address;
      const amountCents = wage.net_pay;
      
      console.log(`Running compliance preflight for ${wage.workers.full_name} (${workerWallet})...`);

      const isMockRevoked = wage.workers.score_breakdown && (wage.workers.score_breakdown as any).mock_revoke_apass === true;
      const isMockBlacklisted = wage.workers.score_breakdown && (wage.workers.score_breakdown as any).mock_blacklist === true;

      // A. A-Pass validation
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
          // Fallback simulation: check on base chain
          const fallbackApass = await cleanverse.verifyAPass(workerWallet, tokenAddress, "base");
          if (fallbackApass.code === "0000" && fallbackApass.data?.code === 4) {
            apassValid = true;
          } else {
            apassReason = apassRes.data ? apassRes.data.message : apassRes.message;
          }
        }
      }

      // B. Validator Pool validation
      let poolValid = false;
      let poolReason = "Compliance Pool verification failed";

      if (isMockBlacklisted) {
        poolValid = false;
        poolReason = "[MOCK_COMPLIANCE] Country blacklist triggered (worker nationality: North Korea).";
      } else {
        const complianceRes = await cleanverse.verifyUserCompliance(process.env.CLEARAIL_CORE_ADDRESS!, workerWallet, "arbitrum");
        if (complianceRes.code === "0000" && complianceRes.data?.valid) {
          poolValid = true;
        } else {
          // Fallback simulation: check on base chain
          const fallbackCompliance = await cleanverse.verifyUserCompliance(process.env.CLEARAIL_CORE_ADDRESS!, workerWallet, "base");
          if (fallbackCompliance.code === "0000" && fallbackCompliance.data?.valid) {
            poolValid = true;
          } else {
            poolReason = complianceRes.message || "User failed compliance rules";
          }
        }
      }

      const isCompliant = apassValid && poolValid;
      const blockedReason = isCompliant ? "" : `${apassValid ? "" : apassReason + " "}${poolValid ? "" : poolReason}`;

      // C. Submit settlement to ClearRailCore
      let settleTxHash = "";
      try {
        if (isCompliant) {
          const res = await settlePaymentOnChain(batchId, index, true, "Compliant Payment", batchTxHash);
          settleTxHash = res.txHash;
          
          await admin
            .from("wage_records")
            .update({
              status: "paid",
              near_tx_hash: settleTxHash,
              paid_at: new Date().toISOString()
            })
            .eq("id", wage.id);
            
          console.log(`Payment settled on-chain for worker ${wage.workers.full_name}. Tx: ${settleTxHash}`);
        } else {
          overallBlocked = true;
          // Mark as blocked on-chain (holding funds in protected escrow)
          const res = await settlePaymentOnChain(batchId, index, false, blockedReason, batchTxHash);
          settleTxHash = res.txHash;

          await admin
            .from("wage_records")
            .update({
              status: "blocked",
              near_tx_hash: settleTxHash,
              notes: `Blocked by Cleanverse Compliance: ${blockedReason}`
            })
            .eq("id", wage.id);

          console.warn(`Payment blocked on-chain for worker ${wage.workers.full_name}: ${blockedReason}`);
        }
      } catch (err: any) {
        console.error(`On-chain settlement call failed for worker index ${index}:`, err.message);
      }

      settlementDetails.push({
        workerName: wage.workers.full_name,
        wallet: workerWallet,
        amount: amountCents,
        isCompliant,
        blockedReason,
        txHash: settleTxHash
      });

      index++;
    }

    // 5. Finalize the batch on-chain
    const reportHash = crypto.createHash("sha256").update(JSON.stringify(settlementDetails)).digest("hex");
    await markBatchSettledOnChain(batchId, reportHash);

    // 6. Anchor audit receipt on-chain
    await anchorAuditDataOnChain(reportHash, `ClearRail Batch Settlement proof for Batch ${batchId}`);

    return NextResponse.json({
      success: true,
      batchId,
      batchTxHash,
      overallBlocked,
      reportHash,
      settlementDetails
    });
  } catch (error: any) {
    console.error("Settlement processing failed:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
