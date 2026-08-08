import { NextRequest, NextResponse } from "next/server";
import { assertManagerCanAccessWorker } from "@/lib/supabase/manager-guard";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await assertManagerCanAccessWorker(id);
  if (result.error) return result.error;

  const { data, error } = await result.admin
    .from("score_history")
    .select("score, breakdown, near_checkpoint_hash, recorded_at")
    .eq("worker_id", id)
    .order("recorded_at", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
