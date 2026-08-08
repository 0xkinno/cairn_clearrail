import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getManagerOrgId } from "@/lib/supabase/manager-guard";
import { INCIDENT_CLASSIFICATION_PROMPT } from "@/lib/ai/prompts";
import { recordIncidentHashOnChain } from "@/lib/blockchain/evm";
import type { IncidentClassification } from "@/lib/supabase/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET() {
  const result = await getManagerOrgId();
  if (result.error) return result.error;
  const { admin, orgId } = result;

  const { data, error } = await admin
    .from("incidents")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const result = await getManagerOrgId();
  if (result.error) return result.error;
  const { admin, orgId } = result;

  const body = await req.json();
  const { title, description, severity, affectedWorkerId, zone, skipAttestation } = body as {
    title: string;
    description: string;
    severity: string;
    affectedWorkerId?: string;
    zone?: string;
    skipAttestation?: boolean;
  };

  let classification: IncidentClassification | null = null;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `${INCIDENT_CLASSIFICATION_PROMPT}\n\nIncident description: "${description}"\nRespond in English.`;
    const aiResult = await model.generateContent(prompt);
    const jsonMatch = aiResult.response.text().match(/\{[\s\S]*\}/);
    if (jsonMatch) classification = JSON.parse(jsonMatch[0]);
  } catch {
    // AI classification is best-effort; the incident is still recorded without it.
  }

  const { data: incident, error } = await admin
    .from("incidents")
    .insert({
      org_id: orgId,
      affected_worker_id: affectedWorkerId || null,
      title,
      description,
      severity,
      ai_classification: classification,
      root_cause_categories: classification?.root_cause_categories || [],
      corrective_actions: classification?.recommended_corrective_actions || [],
      zone: zone || null,
    })
    .select()
    .single();

  if (error || !incident) {
    return NextResponse.json({ error: error?.message || "Failed to save incident" }, { status: 500 });
  }

  const dataHash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ id: incident.id, title, description, severity }))
    .digest("hex");

  if (!skipAttestation) {
    try {
      const { txHash } = await recordIncidentHashOnChain(incident.id, dataHash, severity, orgId);
      await admin.from("incidents").update({ near_tx_hash: txHash }).eq("id", incident.id);
      incident.near_tx_hash = txHash;
    } catch {
      // Best-effort on-chain recording — the incident itself is already saved.
    }
  }

  return NextResponse.json({ incident, dataHash, success: true });
}
