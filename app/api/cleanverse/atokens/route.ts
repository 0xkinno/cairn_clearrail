import { NextRequest, NextResponse } from "next/server";
import { CleanverseClient } from "@/lib/cleanverse/adapter";

export async function GET(req: NextRequest) {
  try {
    const client = new CleanverseClient();
    
    // 1. Query deposit A-Token list directly from Cleanverse Sandbox for Arbitrum
    const res = await client.queryDepositATokenList("arbitrum");

    const mockAtokenAddress = process.env.NEXT_PUBLIC_MOCK_ATOKEN_ADDRESS || "0x3CFA584B9149D34B642Ea1249a1019252Cc9D462";
    const canonicalAddress = process.env.NEXT_PUBLIC_CLEARAIL_CORE_ADDRESS || "0x526a760d4F3a61bA04352B008d4f6477F19f997d";

    const defaultCanonicalToken = {
      origin_token: {
        address: mockAtokenAddress,
        name: "USD Coin",
        symbol: "USDC",
        decimals: 6,
        icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png"
      },
      atoken: {
        address: mockAtokenAddress,
        name: "Cleanverse A-USDC (Canonical Arbitrum Sepolia)",
        symbol: "A-USDC",
        decimals: 6,
        icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png"
      },
      accesscore_address: canonicalAddress,
      apass_address: "0x0000000000000000000000000000000000000000"
    };

    if (res.code === "0000" && res.data?.tokens && res.data.tokens.length > 0) {
      // Prepend our deployed canonical testnet token to the discovered live Cleanverse tokens
      const combinedTokens = [defaultCanonicalToken, ...res.data.tokens];

      return NextResponse.json({
        success: true,
        network: "arbitrum",
        isLiveDiscovered: true,
        tokens: combinedTokens
      });
    }

    // Fallback if network issue occurs
    return NextResponse.json({
      success: true,
      network: "arbitrum",
      isFallback: true,
      tokens: [defaultCanonicalToken]
    });
  } catch (error: any) {
    console.error("Query deposit A-Token list error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
