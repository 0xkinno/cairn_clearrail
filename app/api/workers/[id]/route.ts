import { NextRequest, NextResponse } from "next/server";
import { assertManagerCanAccessWorker } from "@/lib/supabase/manager-guard";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await assertManagerCanAccessWorker(id);
  if (result.error) return result.error;

  const { data: worker, error } = await result.admin.from("workers").select("*").eq("id", id).maybeSingle();
  if (error || !worker) return NextResponse.json({ error: error?.message || "Not found" }, { status: 404 });

  return NextResponse.json({ data: worker });
}
