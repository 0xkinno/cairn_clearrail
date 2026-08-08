import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";
import { computeSafetyScore } from "@/lib/ai/safety-score";
import { anchorAuditDataOnChain, checkpointScoreOnChain } from "@/lib/blockchain/evm";
import type { HazardAnalysis } from "@/lib/supabase/types";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: worker } = await supabase.from("workers").select("id").eq("user_id", user.id).maybeSingle();
  if (!worker) return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || 20);

  const { data, error } = await supabase
    .from("checkins")
    .select("id, photo_url, text_note, overall_risk, hazards_count, zone, created_at")
    .eq("worker_id", worker.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: worker } = await supabase
    .from("workers")
    .select("id, created_at, total_checkins, current_streak, longest_streak")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!worker) return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });

  const body = await req.json();
  const { imageBase64, textNote, voiceTranscript, language, zone, analysis, skipAttestation } = body as {
    imageBase64?: string;
    textNote?: string;
    voiceTranscript?: string;
    language?: string;
    zone?: string;
    analysis: HazardAnalysis;
    skipAttestation?: boolean;
  };

  if (!analysis) return NextResponse.json({ error: "AI analysis required" }, { status: 400 });

  const admin = createAdminClient();

  const { data: assignment } = await supabase
    .from("worker_assignments")
    .select("org_id")
    .eq("worker_id", worker.id)
    .eq("status", "active")
    .maybeSingle();
  const orgId = assignment?.org_id ?? null;

  let photoUrl: string | null = null;
  if (imageBase64) {
    const path = `${worker.id}/${Date.now()}.jpg`;
    const buffer = Buffer.from(imageBase64, "base64");
    const { error: uploadError } = await admin.storage
      .from("checkin-photos")
      .upload(path, buffer, { contentType: "image/jpeg" });
    if (!uploadError) {
      photoUrl = admin.storage.from("checkin-photos").getPublicUrl(path).data.publicUrl;
    }
  }

  const hazardsCount = analysis.hazards_detected.length;

  const { data: checkin, error: checkinError } = await admin
    .from("checkins")
    .insert({
      worker_id: worker.id,
      org_id: orgId,
      photo_url: photoUrl,
      text_note: textNote || null,
      voice_transcript: voiceTranscript || null,
      language: language || "en",
      ai_analysis: analysis,
      overall_risk: analysis.overall_risk_level,
      hazards_count: hazardsCount,
      zone: zone || null,
    })
    .select()
    .single();

  if (checkinError || !checkin) {
    return NextResponse.json({ error: checkinError?.message || "Failed to save check-in" }, { status: 500 });
  }

  const dataHash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ id: checkin.id, worker_id: worker.id, ai_analysis: analysis }))
    .digest("hex");

  if (!skipAttestation) {
    try {
      const { txHash } = await anchorAuditDataOnChain(dataHash, `Check-in attestation ${checkin.id} for worker ${worker.id}`);
      await admin.from("checkins").update({ near_attestation_hash: txHash }).eq("id", checkin.id);
      checkin.near_attestation_hash = txHash;
    } catch (e) {
      console.error("Server check-in attestation failed:", e);
    }
  }

  if (hazardsCount > 0) {
    await admin.from("hazard_flags").insert(
      analysis.hazards_detected.map((hazard) => ({
        checkin_id: checkin.id,
        worker_id: worker.id,
        org_id: orgId,
        hazard_type: hazard.type,
        description: hazard.item,
        severity: hazard.severity,
        confidence: hazard.confidence,
        iso_category: analysis.iso_45001_categories?.[0] || null,
        zone: zone || null,
      }))
    );
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: recentCheckins }, { data: recentHazards }, { data: incidents }, { data: lastCheckin }] =
    await Promise.all([
      admin.from("checkins").select("id").eq("worker_id", worker.id).gte("created_at", thirtyDaysAgo),
      admin.from("hazard_flags").select("id").eq("worker_id", worker.id).gte("created_at", thirtyDaysAgo),
      admin.from("incidents").select("severity").eq("affected_worker_id", worker.id),
      admin
        .from("checkins")
        .select("created_at")
        .eq("worker_id", worker.id)
        .neq("id", checkin.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const now = new Date();
  const daysSinceRegistration = Math.max(
    Math.floor((now.getTime() - new Date(worker.created_at).getTime()) / (1000 * 60 * 60 * 24)),
    1
  );

  let newStreak = 1;
  if (lastCheckin) {
    const lastDate = new Date(lastCheckin.created_at);
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) newStreak = worker.current_streak + 1;
  }
  const newLongestStreak = Math.max(worker.longest_streak, newStreak);

  const totalCheckins30d = recentCheckins?.length || 1;
  const hazardFlagRate = ((recentHazards?.length || 0) / totalCheckins30d) * 100;

  const { score, breakdown } = computeSafetyScore({
    totalCheckins: worker.total_checkins + 1,
    currentStreak: newStreak,
    daysSinceRegistration,
    incidentCount: incidents?.length || 0,
    incidentSeverities: (incidents || []).map((i) => i.severity),
    credentialsRequired: 0,
    credentialsHeld: 0,
    credentialsExpired: 0,
    hazardFlagRate,
  });

  await admin
    .from("workers")
    .update({
      total_checkins: worker.total_checkins + 1,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      safety_score: score,
      score_breakdown: breakdown,
    })
    .eq("id", worker.id);

  const breakdownHash = crypto.createHash("sha256").update(JSON.stringify(breakdown)).digest("hex");
  let checkpointHash: string | null = null;
  try {
    const { txHash } = await checkpointScoreOnChain(worker.id, score, breakdownHash);
    checkpointHash = txHash;
  } catch {
    // Best-effort on-chain checkpoint — the score is already saved in Postgres.
  }

  await admin.from("score_history").insert({
    worker_id: worker.id,
    score,
    breakdown,
    near_checkpoint_hash: checkpointHash,
  });

  return NextResponse.json({ checkin, score, breakdown, dataHash, success: true });
}
