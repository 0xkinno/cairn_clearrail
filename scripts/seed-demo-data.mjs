/**
 * Seeds real demo data into Supabase + NEAR testnet for Cairn.
 *
 * Everything here is a genuine row/transaction: check-in photos go through
 * the real Gemini vision API, incident descriptions go through the real
 * Gemini classification prompt, and every credential/wage/incident/checkin
 * writes a real signed NEAR transaction. Nothing here is hardcoded frontend
 * data — it's demo *content* inserted the same way the app itself would
 * insert it, just scripted instead of clicked through the UI.
 *
 * Run via WSL/Linux (near-sdk-js network quirks aside, this itself is fine
 * on Windows, but --dns-result-order=ipv4first avoids a WSL IPv6 routing bug
 * we hit earlier when talking to rpc.testnet.near.org).
 */
import crypto from "crypto";
import { Account, JsonRpcProvider, teraToGas } from "near-api-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

const NEAR_NODE_URL = process.env.NEAR_NODE_URL || "https://rpc.testnet.near.org";
const DEPLOYER_ID = process.env.NEAR_DEPLOYER_ACCOUNT_ID;
const DEPLOYER_KEY = process.env.NEAR_DEPLOYER_PRIVATE_KEY;
const CONTRACTS = {
  registry: process.env.NEAR_CONTRACT_REGISTRY,
  vault: process.env.NEAR_CONTRACT_VAULT,
  ledger: process.env.NEAR_CONTRACT_LEDGER,
  org: process.env.NEAR_CONTRACT_ORG,
};

if (!SUPABASE_URL || !SERVICE_KEY || !GEMINI_KEY || !DEPLOYER_ID || !DEPLOYER_KEY) {
  throw new Error("Missing required env vars. Load .env.local before running this script.");
}

const provider = new JsonRpcProvider({ url: NEAR_NODE_URL });
const deployer = new Account(DEPLOYER_ID, provider, DEPLOYER_KEY);

async function callContract(contractId, methodName, args) {
  const outcome = await deployer.callFunctionRaw({
    contractId,
    methodName,
    args,
    gas: teraToGas("30"),
  });
  return outcome.transaction_outcome.id;
}

function sb(path, options = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...options.headers,
    },
  }).then(async (r) => {
    const body = await r.json();
    if (!r.ok) throw new Error(`Supabase ${path} failed: ${JSON.stringify(body)}`);
    return body;
  });
}

const PHOTOS = [
  "photo-1504328345606-18bbc8c9d7d1", // welding, bare hands
  "photo-1626885930974-4b69aa21bbf9", // two workers safety vests
  "photo-1673201159772-a3b7fa2ecc5d", // hard hat working on metal
  "photo-1764114908655-9a26d32750a0", // workers heavy machinery factory
  "photo-1760963301666-582b92218a19", // three people hard hats vests talking
  "photo-1780220176316-99cfba738b07", // two men vests hard hats outside
];

async function fetchPhotoBase64(photoId) {
  const buf = await fetch(`https://images.unsplash.com/${photoId}?w=800`).then((r) => r.arrayBuffer());
  return Buffer.from(buf).toString("base64");
}

const HAZARD_ANALYSIS_PROMPT = `You are Cairn's AI Safety Engine, an expert industrial safety analyst. You analyze workplace photos to detect hazards, assess risk, and provide actionable safety recommendations.

You must respond ONLY with valid JSON matching this exact schema:

{
  "hazards_detected": [
    {
      "type": "string (one of: missing_ppe, damaged_ppe, trip_hazard, fall_risk, electrical_hazard, chemical_hazard, fire_risk, ergonomic_risk, housekeeping, machine_guarding, confined_space, structural_risk, environmental, other)",
      "item": "string (specific description of what was detected)",
      "severity": "string (one of: low, medium, high, critical)",
      "confidence": "number (0.0 to 1.0)",
      "location_in_image": "string (describe where in the image)",
      "recommended_action": "string (specific corrective action)"
    }
  ],
  "overall_risk_level": "string (one of: safe, low, elevated, high, critical)",
  "summary": "string (2-3 sentence plain language summary of findings)",
  "iso_45001_categories": ["string (relevant ISO 45001 clause numbers)"],
  "immediate_action_required": "boolean",
  "positive_observations": ["string (things done correctly, good practices observed)"],
  "environmental_factors": {
    "lighting": "string (adequate/poor/not_visible)",
    "weather_conditions": "string (if outdoor, describe visible conditions)",
    "crowding": "string (sparse/moderate/crowded/not_applicable)"
  }
}

Rules:
- Be thorough but avoid false positives. Only flag hazards you can see with reasonable confidence.
- Always include positive observations when safety practices are done well.
- Severity levels: low = minor improvement needed, medium = should address within 24h, high = address immediately, critical = stop work.
- Consider the Southeast Asian industrial context.`;

const INCIDENT_CLASSIFICATION_PROMPT = `You are Cairn's Incident Classification Engine. You analyze incident descriptions and classify them according to occupational safety standards.

Respond ONLY with valid JSON:

{
  "severity": "string (one of: near_miss, first_aid, medical_treatment, lost_time, serious, fatality)",
  "severity_score": "number (1-10)",
  "root_cause_categories": ["string (human_error, equipment_failure, environmental, procedural, training_gap, supervision, design_flaw, maintenance, communication)"],
  "contributing_factors": ["string"],
  "affected_body_parts": ["string"],
  "equipment_involved": ["string"],
  "iso_45001_clause": "string",
  "recommended_corrective_actions": [
    { "action": "string", "priority": "string (immediate, short_term, long_term)", "responsible_party": "string" }
  ],
  "investigation_questions": ["string"],
  "similar_incident_prevention": "string",
  "summary": "string (2-3 sentence classification summary)"
}`;

async function withRetry(fn, label, maxAttempts = 5) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isRetryable = /503|UNAVAILABLE|overloaded|high demand|429|RESOURCE_EXHAUSTED/i.test(String(err.message));
      if (!isRetryable || attempt === maxAttempts) throw err;
      const delay = Math.min(2000 * 2 ** (attempt - 1), 30000);
      console.log(`    ${label}: transient error (attempt ${attempt}/${maxAttempts}), retrying in ${delay / 1000}s...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

async function geminiVision(imageBase64, note) {
  return withRetry(async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_KEY}`;
    const body = {
      contents: [
        {
          parts: [
            { text: HAZARD_ANALYSIS_PROMPT + "\n\n" + `Analyze this workplace photo for safety hazards. ${note || ""} Respond in English.` },
            { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
          ],
        },
      ],
    };
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Gemini vision: no JSON in response: " + JSON.stringify(json).slice(0, 300));
    return JSON.parse(match[0]);
  }, "geminiVision");
}

async function geminiClassify(description) {
  return withRetry(async () => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_KEY}`;
  const body = { contents: [{ parts: [{ text: `${INCIDENT_CLASSIFICATION_PROMPT}\n\nIncident description: "${description}"\nRespond in English.` }] }] };
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Gemini classify: no JSON in response: " + JSON.stringify(json).slice(0, 300));
  return JSON.parse(match[0]);
  }, "geminiClassify");
}

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function computeSafetyScore({ totalCheckins, currentStreak, daysSinceRegistration, incidentSeverities, hazardFlagRate }) {
  const expectedCheckins = Math.max(daysSinceRegistration * 0.7, 1);
  const checkinRate = Math.min(totalCheckins / expectedCheckins, 1);
  const streakBonus = Math.min(currentStreak / 30, 1) * 0.3;
  const consistency = Math.round((checkinRate * 0.7 + streakBonus) * 100);

  const severityWeights = { near_miss: 5, first_aid: 15, medical_treatment: 30, lost_time: 50, serious: 75, fatality: 100 };
  const totalSeverityPoints = incidentSeverities.reduce((sum, sev) => sum + (severityWeights[sev] || 10), 0);
  const incidents = Math.round((1 - Math.min(totalSeverityPoints / 100, 1)) * 100);

  const credentials = 100; // seed context: assume required credentials on file
  const hazard_rate = Math.round((1 - Math.min(hazardFlagRate / 100, 1)) * 100);

  const breakdown = {
    consistency: Math.min(Math.max(consistency, 0), 100),
    incidents: Math.min(Math.max(incidents, 0), 100),
    credentials,
    hazard_rate: Math.min(Math.max(hazard_rate, 0), 100),
  };
  const score = Math.round(breakdown.consistency * 0.25 + breakdown.incidents * 0.3 + breakdown.credentials * 0.25 + breakdown.hazard_rate * 0.2);
  return { score: Math.min(Math.max(score, 0), 100), breakdown };
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

async function main() {
  console.log("=== Cairn demo data seed ===");

  // ---------- Register existing worker + org on-chain (were never registered) ----------
  console.log("\n[1/7] Registering existing worker + org on-chain...");
  const existingWorker = (await sb("workers?select=id,full_name,trade,near_account"))[0];
  if (!existingWorker.near_account) {
    await callContract(CONTRACTS.registry, "register_worker", {
      worker_id: existingWorker.id,
      full_name: existingWorker.full_name,
      trade: existingWorker.trade || "general",
    });
    await sb(`workers?id=eq.${existingWorker.id}`, { method: "PATCH", body: JSON.stringify({ near_account: existingWorker.id }) });
    console.log(`  registered ${existingWorker.full_name} on-chain`);
  }
  const existingOrg = (await sb("organizations?select=id,name,industry,near_account"))[0];
  if (!existingOrg.near_account) {
    await callContract(CONTRACTS.org, "register_org", { org_id: existingOrg.id, name: existingOrg.name, industry: existingOrg.industry });
    await sb(`organizations?id=eq.${existingOrg.id}`, { method: "PATCH", body: JSON.stringify({ near_account: existingOrg.id }) });
    console.log(`  registered ${existingOrg.name} on-chain`);
  }
  const skyline = existingOrg;
  const ahmad = existingWorker;

  // ---------- New organization (idempotent) ----------
  console.log("\n[2/7] Ensuring second organization exists: Northport Logistics...");
  let northport = (await sb(`organizations?name=eq.Northport Logistics&select=id,name,invite_code,near_account`))[0];
  if (!northport) {
    [northport] = await sb("organizations", {
      method: "POST",
      body: JSON.stringify({
        name: "Northport Logistics",
        site_name: "Container Terminal 4",
        industry: "logistics",
        country: "Malaysia",
        city: "Port Klang",
      }),
    });
  }
  if (!northport.near_account) {
    await callContract(CONTRACTS.org, "register_org", { org_id: northport.id, name: northport.name, industry: "logistics" });
    await sb(`organizations?id=eq.${northport.id}`, { method: "PATCH", body: JSON.stringify({ near_account: northport.id }) });
  }
  console.log(`  ${northport.name} (${northport.invite_code}) ready`);

  // ---------- New workers (idempotent) ----------
  console.log("\n[3/7] Ensuring 4 new workers exist...");
  const NEW_WORKERS = [
    { full_name: "Siti Nurhaliza", trade: "Welder", org: skyline, days: 45 },
    { full_name: "Rajesh Kumar", trade: "Scaffolder", org: skyline, days: 30 },
    { full_name: "Muthu Vellu", trade: "Crane Operator", org: northport, days: 60 },
    { full_name: "Wei Ming Tan", trade: "General Laborer", org: northport, days: 20 },
  ];

  const workers = [{ ...ahmad, org: skyline, days: 5 }];
  for (const w of NEW_WORKERS) {
    let row = (await sb(`workers?full_name=eq.${encodeURIComponent(w.full_name)}&select=id,full_name,near_account`))[0];
    if (!row) {
      [row] = await sb("workers", {
        method: "POST",
        body: JSON.stringify({ full_name: w.full_name, trade: w.trade, preferred_language: "en", created_at: daysAgo(w.days) }),
      });
    }
    if (!row.near_account) {
      await callContract(CONTRACTS.registry, "register_worker", { worker_id: row.id, full_name: w.full_name, trade: w.trade });
      await sb(`workers?id=eq.${row.id}`, { method: "PATCH", body: JSON.stringify({ near_account: row.id }) });
    }
    const assignment = await sb(`worker_assignments?worker_id=eq.${row.id}&select=id`);
    if (assignment.length === 0) {
      await sb("worker_assignments", { method: "POST", body: JSON.stringify({ worker_id: row.id, org_id: w.org.id, status: "active" }) });
    }
    console.log(`  ${w.full_name} (${w.trade}) -> ${w.org.name} ready`);
    workers.push({ ...row, org: w.org, days: w.days });
  }

  // worker_assignments for Ahmad (existing, may not have one)
  const existingAssignment = await sb(`worker_assignments?worker_id=eq.${ahmad.id}&select=id`);
  if (existingAssignment.length === 0) {
    await sb("worker_assignments", { method: "POST", body: JSON.stringify({ worker_id: ahmad.id, org_id: skyline.id, status: "active" }) });
  }

  // ---------- Check-ins (25+, resumable) ----------
  const existingCheckinCount = (await sb("checkins?select=id")).length;
  const TARGET_CHECKINS = 26;
  const remaining = Math.max(TARGET_CHECKINS - existingCheckinCount, 0);
  console.log(`\n[4/7] ${existingCheckinCount} check-ins already exist, generating ${remaining} more...`);
  const ZONES = ["Zone A", "Zone B", "Fabrication Bay", "Loading Dock", "Storage Yard", null];
  let checkinCount = 0;
  let photoCache = {};

  let geminiQuotaExhausted = false;
  for (let i = 0; i < remaining; i++) {
    if (geminiQuotaExhausted) break;
    const worker = workers[i % workers.length];
    const photoId = PHOTOS[i % PHOTOS.length];
    if (!photoCache[photoId]) photoCache[photoId] = await fetchPhotoBase64(photoId);
    const imageBase64 = photoCache[photoId];

    try {

    const analysis = await geminiVision(imageBase64, "");
    const hazardsCount = analysis.hazards_detected.length;
    const checkinDate = daysAgo(Math.floor(Math.random() * Math.min(worker.days, 21)));
    const zone = ZONES[i % ZONES.length];

    const [checkin] = await sb("checkins", {
      method: "POST",
      body: JSON.stringify({
        worker_id: worker.id,
        org_id: worker.org.id,
        text_note: null,
        language: "en",
        ai_analysis: analysis,
        overall_risk: analysis.overall_risk_level,
        hazards_count: hazardsCount,
        zone,
        created_at: checkinDate,
      }),
    });

    if (hazardsCount > 0) {
      await sb("hazard_flags", {
        method: "POST",
        body: JSON.stringify(
          analysis.hazards_detected.map((h) => ({
            checkin_id: checkin.id,
            worker_id: worker.id,
            org_id: worker.org.id,
            hazard_type: h.type,
            description: h.item,
            severity: h.severity,
            confidence: h.confidence,
            iso_category: analysis.iso_45001_categories?.[0] || null,
            zone,
            created_at: checkinDate,
          }))
        ),
      });
    }

    const dataHash = sha256(JSON.stringify({ id: checkin.id, worker_id: worker.id, ai_analysis: analysis }));
    const attestTx = await callContract(CONTRACTS.ledger, "attest_checkin", { checkin_id: checkin.id, worker_id: worker.id, data_hash: dataHash });
    await sb(`checkins?id=eq.${checkin.id}`, { method: "PATCH", body: JSON.stringify({ near_attestation_hash: attestTx }) });

    checkinCount++;
    console.log(`  [${checkinCount}/${remaining}] ${worker.full_name}: ${analysis.overall_risk_level} risk, ${hazardsCount} hazard(s), tx ${attestTx.slice(0, 12)}...`);
    } catch (err) {
      if (/RESOURCE_EXHAUSTED|quota/i.test(String(err.message))) {
        console.log(`  Gemini daily quota exhausted after ${checkinCount} new check-ins — skipping remaining check-ins, continuing with rest of seed.`);
        geminiQuotaExhausted = true;
      } else {
        throw err;
      }
    }
  }

  // recompute per-worker aggregates + score checkpoints
  console.log("\n  Recomputing safety scores...");
  for (const worker of workers) {
    const checkins = await sb(`checkins?worker_id=eq.${worker.id}&select=id,created_at&order=created_at.desc`);
    const hazards = await sb(`hazard_flags?worker_id=eq.${worker.id}&select=id`);
    const totalCheckins = checkins.length;
    const currentStreak = Math.min(totalCheckins, 1 + Math.floor(Math.random() * 5));
    const { score, breakdown } = computeSafetyScore({
      totalCheckins,
      currentStreak,
      daysSinceRegistration: Math.max(worker.days, 1),
      incidentSeverities: [],
      hazardFlagRate: (hazards.length / Math.max(totalCheckins, 1)) * 100,
    });
    await sb(`workers?id=eq.${worker.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        total_checkins: totalCheckins,
        current_streak: currentStreak,
        longest_streak: Math.max(currentStreak, Math.floor(Math.random() * 8)),
        safety_score: score,
        score_breakdown: breakdown,
      }),
    });
    const breakdownHash = sha256(JSON.stringify(breakdown));
    const checkpointTx = await callContract(CONTRACTS.ledger, "checkpoint_score", { worker_id: worker.id, score, breakdown_hash: breakdownHash });
    await sb("score_history", { method: "POST", body: JSON.stringify({ worker_id: worker.id, score, breakdown, near_checkpoint_hash: checkpointTx }) });
    console.log(`  ${worker.full_name}: score ${score} (${totalCheckins} check-ins), tx ${checkpointTx.slice(0, 12)}...`);
  }
  await sb(`organizations?id=eq.${northport.id}`, { method: "PATCH", body: JSON.stringify({ worker_count: 2 }) });
  await sb(`organizations?id=eq.${skyline.id}`, { method: "PATCH", body: JSON.stringify({ worker_count: 3 }) });

  // ---------- Incidents (5 total, need 3 more) ----------
  console.log("\n[5/7] Filing incidents across severities with real Gemini classification...");
  const NEW_INCIDENTS = [
    {
      title: "Minor cut from unguarded blade",
      description: "A worker sustained a shallow laceration to the forearm while clearing debris near an unguarded circular saw blade. First aid was administered on-site; no further treatment was needed.",
      severity: "first_aid",
      zone: "Fabrication Bay",
      org: skyline,
      worker: workers[1],
      days: 12,
    },
    {
      title: "Forklift collision with storage rack",
      description: "A forklift operator misjudged clearance while reversing and struck a storage rack, causing the operator to be thrown against the seatbelt. The worker was taken to hospital for evaluation and was placed on light duty for one week.",
      severity: "lost_time",
      zone: "Loading Dock",
      org: northport,
      worker: workers[3],
      days: 8,
    },
    {
      title: "Crane load swing causes fall from height",
      description: "During a lift operation, an improperly rigged load swung unexpectedly, causing a nearby worker to lose balance and fall approximately 2.5 meters from a platform. The worker sustained a fractured wrist and was hospitalized overnight.",
      severity: "serious",
      zone: "Storage Yard",
      org: northport,
      worker: workers[4],
      days: 4,
    },
  ];

  for (const inc of NEW_INCIDENTS) {
    if (geminiQuotaExhausted) {
      console.log(`  "${inc.title}" skipped — Gemini quota exhausted, rerun script tomorrow to backfill.`);
      continue;
    }
    const already = await sb(`incidents?title=eq.${encodeURIComponent(inc.title)}&select=id`);
    if (already.length > 0) {
      console.log(`  "${inc.title}" already exists, skipping`);
      continue;
    }
    let classification;
    try {
      classification = await geminiClassify(inc.description);
    } catch (err) {
      if (/RESOURCE_EXHAUSTED|quota/i.test(String(err.message))) {
        console.log(`  "${inc.title}" skipped — Gemini quota exhausted, rerun script tomorrow to backfill.`);
        geminiQuotaExhausted = true;
        continue;
      }
      throw err;
    }
    const [row] = await sb("incidents", {
      method: "POST",
      body: JSON.stringify({
        org_id: inc.org.id,
        affected_worker_id: inc.worker.id,
        title: inc.title,
        description: inc.description,
        severity: inc.severity,
        ai_classification: classification,
        root_cause_categories: classification.root_cause_categories || [],
        corrective_actions: classification.recommended_corrective_actions || [],
        zone: inc.zone,
        status: "open",
        created_at: daysAgo(inc.days),
      }),
    });
    const dataHash = sha256(JSON.stringify({ id: row.id, title: inc.title, description: inc.description, severity: inc.severity }));
    const tx = await callContract(CONTRACTS.ledger, "record_incident_hash", { incident_id: row.id, data_hash: dataHash, severity: inc.severity, org_id: inc.org.id });
    await sb(`incidents?id=eq.${row.id}`, { method: "PATCH", body: JSON.stringify({ near_tx_hash: tx }) });
    console.log(`  "${inc.title}" (${inc.severity}), classified + on-chain tx ${tx.slice(0, 12)}...`);
  }

  // ---------- Credentials (10+, need 9 more) ----------
  console.log("\n[6/7] Issuing credentials on-chain...");
  const skylineManagerId = (await sb(`org_members?org_id=eq.${skyline.id}&select=user_id&limit=1`))[0]?.user_id || null;
  const CREDENTIAL_TEMPLATES = [
    { type: "safety_training", title: "Working at Heights" },
    { type: "safety_training", title: "Confined Space Entry" },
    { type: "site_clearance", title: "Site Induction — Fabrication Bay" },
    { type: "site_clearance", title: "Site Induction — Container Terminal 4" },
    { type: "equipment_certification", title: "Forklift Operator License" },
    { type: "equipment_certification", title: "Crane Rigging Certification" },
    { type: "incident_free_milestone", title: "90 Days Incident-Free" },
    { type: "safety_training", title: "First Aid & CPR" },
    { type: "safety_training", title: "Hazardous Materials Handling" },
    { type: "incident_free_milestone", title: "180 Days Incident-Free" },
    { type: "site_clearance", title: "Container Yard Access" },
  ];

  for (let i = 0; i < CREDENTIAL_TEMPLATES.length; i++) {
    const tmpl = CREDENTIAL_TEMPLATES[i];
    const worker = workers[i % workers.length];
    const already = await sb(`credentials?worker_id=eq.${worker.id}&title=eq.${encodeURIComponent(tmpl.title)}&select=id`);
    if (already.length > 0) {
      console.log(`  "${tmpl.title}" -> ${worker.full_name} already exists, skipping`);
      continue;
    }
    const credentialId = crypto.randomUUID();
    const metadataHash = sha256(JSON.stringify({ workerId: worker.id, ...tmpl }));
    const tx = await callContract(CONTRACTS.vault, "issue_credential", {
      credential_id: credentialId,
      worker_id: worker.id,
      credential_type: tmpl.type,
      title: tmpl.title,
      metadata_hash: metadataHash,
      expires_at: null,
    });
    await sb("credentials", {
      method: "POST",
      body: JSON.stringify({
        id: credentialId,
        worker_id: worker.id,
        issuer_org_id: worker.org.id,
        issued_by: worker.org.id === skyline.id ? skylineManagerId : null,
        credential_type: tmpl.type,
        title: tmpl.title,
        near_tx_hash: tx,
        issued_at: daysAgo(Math.floor(Math.random() * worker.days)),
      }),
    });
    console.log(`  "${tmpl.title}" -> ${worker.full_name}, tx ${tx.slice(0, 12)}...`);
  }

  // ---------- Wage records (8+, need 7 more) ----------
  console.log("\n[7/7] Recording + approving wage records on-chain...");
  const WAGE_TEMPLATES = [
    { shifts: 12, hours: 96, ot: 6, base: 22, otRate: 33, ded: 40, currency: "MYR" },
    { shifts: 10, hours: 80, ot: 0, base: 25, otRate: 0, ded: 30, currency: "MYR" },
    { shifts: 14, hours: 112, ot: 10, base: 20, otRate: 30, ded: 50, currency: "MYR" },
    { shifts: 11, hours: 88, ot: 4, base: 28, otRate: 42, ded: 45, currency: "MYR" },
    { shifts: 9, hours: 72, ot: 0, base: 24, otRate: 0, ded: 20, currency: "MYR" },
    { shifts: 13, hours: 104, ot: 8, base: 21, otRate: 31.5, ded: 35, currency: "MYR" },
    { shifts: 10, hours: 80, ot: 2, base: 26, otRate: 39, ded: 25, currency: "MYR" },
  ];

  for (let i = 0; i < WAGE_TEMPLATES.length; i++) {
    const t = WAGE_TEMPLATES[i];
    const worker = workers[i % workers.length];
    const periodEndDaysAgo = i * 14;
    const periodStart = new Date(Date.now() - (periodEndDaysAgo + 14) * 86400000).toISOString().slice(0, 10);
    const periodEnd = new Date(Date.now() - periodEndDaysAgo * 86400000).toISOString().slice(0, 10);
    const gross = t.base * t.hours + t.otRate * t.ot;
    const net = gross - t.ded;
    const payHash = sha256(`${worker.id}|${periodStart}|${periodEnd}|${net}|${t.currency}`);

    const already = await sb(`wage_records?worker_id=eq.${worker.id}&pay_period_start=eq.${periodStart}&pay_period_end=eq.${periodEnd}&select=id`);
    if (already.length > 0) {
      console.log(`  ${worker.full_name} ${periodStart}..${periodEnd} already exists, skipping`);
      continue;
    }

    const [row] = await sb("wage_records", {
      method: "POST",
      body: JSON.stringify({
        worker_id: worker.id,
        org_id: worker.org.id,
        pay_period_start: periodStart,
        pay_period_end: periodEnd,
        shifts_worked: t.shifts,
        hours_total: t.hours,
        overtime_hours: t.ot,
        base_rate: t.base,
        overtime_rate: t.otRate,
        gross_pay: gross,
        deductions: t.ded,
        net_pay: net,
        currency: t.currency,
        pay_hash: payHash,
        status: "pending",
      }),
    });

    const tx = await callContract(CONTRACTS.ledger, "record_wage_hash", {
      wage_record_id: row.id,
      worker_id: worker.id,
      pay_hash: payHash,
      amount: String(net),
      currency: t.currency,
      period: `${periodStart}_${periodEnd}`,
    });
    await sb(`wage_records?id=eq.${row.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "approved", near_tx_hash: tx, paid_at: new Date().toISOString() }),
    });
    console.log(`  ${worker.full_name}: ${t.currency} ${net.toFixed(2)} net, tx ${tx.slice(0, 12)}...`);
  }

  console.log("\n=== Seed complete ===");
}

main().catch((err) => {
  console.error("SEED FAILED:", err);
  process.exit(1);
});
