import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getManagerOrgId } from "@/lib/supabase/manager-guard";

export async function GET() {
  const result = await getManagerOrgId();
  if (result.error) return result.error;
  const { admin, orgId } = result;

  const { data: records, error } = await admin
    .from("wage_records")
    .select("*")
    .eq("org_id", orgId)
    .order("pay_period_end", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const workerIds = [...new Set((records || []).map((r) => r.worker_id))];
  const { data: workers } =
    workerIds.length > 0 ? await admin.from("workers").select("id, full_name").in("id", workerIds) : { data: [] };
  const nameById = new Map((workers || []).map((w) => [w.id, w.full_name]));

  const data = (records || []).map((r) => ({ ...r, worker_name: nameById.get(r.worker_id) || "Unknown" }));
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const result = await getManagerOrgId();
  if (result.error) return result.error;
  const { admin, orgId } = result;

  const body = await req.json();
  const {
    workerId,
    payPeriodStart,
    payPeriodEnd,
    shiftsWorked,
    hoursTotal,
    overtimeHours,
    baseRate,
    overtimeRate,
    deductions,
    currency,
    notes,
  } = body as {
    workerId: string;
    payPeriodStart: string;
    payPeriodEnd: string;
    shiftsWorked: number;
    hoursTotal: number;
    overtimeHours: number;
    baseRate: number;
    overtimeRate: number;
    deductions: number;
    currency: string;
    notes?: string;
  };

  const grossPay = baseRate * hoursTotal + (overtimeRate || 0) * (overtimeHours || 0);
  const netPay = grossPay - (deductions || 0);

  const payData = `${workerId}|${payPeriodStart}|${payPeriodEnd}|${netPay}|${currency}`;
  const payHash = crypto.createHash("sha256").update(payData).digest("hex");

  const { data, error } = await admin
    .from("wage_records")
    .insert({
      worker_id: workerId,
      org_id: orgId,
      pay_period_start: payPeriodStart,
      pay_period_end: payPeriodEnd,
      shifts_worked: shiftsWorked,
      hours_total: hoursTotal,
      overtime_hours: overtimeHours || 0,
      base_rate: baseRate,
      overtime_rate: overtimeRate || 0,
      gross_pay: grossPay,
      deductions: deductions || 0,
      net_pay: netPay,
      currency,
      pay_hash: payHash,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
