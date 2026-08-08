import { NextRequest, NextResponse } from "next/server";
import { CleanverseClient } from "@/lib/cleanverse/adapter";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userAddress, atokenAddress } = body as {
      userAddress: string;
      atokenAddress: string;
    };

    if (!userAddress) {
      return NextResponse.json({ error: "userAddress is required" }, { status: 400 });
    }

    const client = new CleanverseClient();
    const contractAddress = process.env.CLEARAIL_CORE_ADDRESS || "";

    console.log(`Preflight checking for worker ${userAddress} using atoken ${atokenAddress}...`);

    const admin = createAdminClient();
    const { data: worker } = await admin
      .from("workers")
      .select("score_breakdown")
      .eq("near_account", userAddress.toLowerCase())
      .maybeSingle();

    const isMockRevoked = worker?.score_breakdown && (worker.score_breakdown as any).mock_revoke_apass === true;
    const isMockBlacklisted = worker?.score_breakdown && (worker.score_breakdown as any).mock_blacklist === true;

    // 1. Check A-Pass validity
    let apassValid = false;
    let apassCode = 0;
    let apassMessage = "A-Pass verification skipped (no token address)";
    let magickLink = "";

    if (isMockRevoked) {
      apassCode = 5; // Revoked status code
      apassMessage = "[MOCK_COMPLIANCE] A-Pass revoked by supervisor.";
      apassValid = false;
    } else if (atokenAddress) {
      const apassRes = await client.verifyAPass(userAddress, atokenAddress, 'arbitrum');
      if (apassRes.code === '0000' && apassRes.data) {
        apassCode = apassRes.data.code;
        apassMessage = apassRes.data.message;
        apassValid = apassRes.data.code === 4;
        magickLink = apassRes.data.magickLink || "";
      } else {
        // Fallback simulation
        const fallbackRes = await client.verifyAPass(userAddress, atokenAddress, 'base');
        if (fallbackRes.code === '0000' && fallbackRes.data) {
          apassCode = fallbackRes.data.code;
          apassMessage = fallbackRes.data.message + " (Base Sandbox Simulation)";
          apassValid = fallbackRes.data.code === 4;
          magickLink = fallbackRes.data.magickLink || "";
        } else {
          apassMessage = apassRes.message || "Failed to verify A-Pass";
        }
      }
    }

    // 2. Check Validator Pool compliance
    let complianceValid = false;
    let complianceMessage = "Compliance verification skipped";

    if (isMockBlacklisted) {
      complianceMessage = "[MOCK_COMPLIANCE] Country blacklist triggered (worker nationality: North Korea).";
      complianceValid = false;
    } else if (contractAddress) {
      const complianceRes = await client.verifyUserCompliance(contractAddress, userAddress, 'arbitrum');
      if (complianceRes.code === '0000' && complianceRes.data) {
        complianceValid = complianceRes.data.valid;
        complianceMessage = complianceValid ? "User satisfies compliance pool rules" : "User fails compliance pool rules";
      } else {
        // Fallback simulation
        const fallbackRes = await client.verifyUserCompliance(contractAddress, userAddress, 'base');
        if (fallbackRes.code === '0000' && fallbackRes.data) {
          complianceValid = fallbackRes.data.valid;
          complianceMessage = complianceValid ? "User satisfies base compliance rules (Simulation)" : "User fails base compliance rules (Simulation)";
        } else {
          complianceMessage = complianceRes.message || "Failed to verify compliance pool rules";
        }
      }
    }

    return NextResponse.json({
      success: true,
      preflight: {
        userAddress,
        contractAddress,
        atokenAddress,
        apass: {
          valid: apassValid,
          code: apassCode,
          message: apassMessage,
          magickLink
        },
        compliance: {
          valid: complianceValid,
          message: complianceMessage
        },
        passed: apassValid && complianceValid
      }
    });
  } catch (error: any) {
    console.error("Cleanverse verify route error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
