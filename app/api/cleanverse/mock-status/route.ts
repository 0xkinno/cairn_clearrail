import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workerId, mockRevokeApass, mockBlacklist } = body as {
      workerId: string;
      mockRevokeApass: boolean;
      mockBlacklist: boolean;
    };

    if (!workerId) {
      return NextResponse.json({ error: "workerId is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Fetch current worker
    const { data: worker, error: fetchErr } = await admin
      .from("workers")
      .select("score_breakdown")
      .eq("id", workerId)
      .single();

    if (fetchErr || !worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    // 2. Merge mock flags into score_breakdown JSON
    const newBreakdown = {
      ...(worker.score_breakdown || {}),
      mock_revoke_apass: mockRevokeApass,
      mock_blacklist: mockBlacklist
    };

    // 3. Update database
    const { error: updateErr } = await admin
      .from("workers")
      .update({ score_breakdown: newBreakdown })
      .eq("id", workerId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, mockStatus: { mockRevokeApass, mockBlacklist } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
