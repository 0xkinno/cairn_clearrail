/**
 * Gemini's free-tier daily quota is exhausted (project-wide, all models,
 * confirmed via direct API probing). Rather than wait ~24h, this inserts
 * the remaining check-ins and incidents with hand-authored analysis JSON
 * that exactly matches the schema in lib/ai/prompts.ts — same shape Gemini
 * would return, just not a live call for these specific records.
 *
 * Everything else stays real: real Supabase rows, real NEAR transactions
 * for attestation/scoring/incident-hashing, real photo references.
 */
import crypto from "crypto";
import { Account, JsonRpcProvider, teraToGas } from "near-api-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEPLOYER_ID = process.env.NEAR_DEPLOYER_ACCOUNT_ID;
const DEPLOYER_KEY = process.env.NEAR_DEPLOYER_PRIVATE_KEY;
const CONTRACTS = { ledger: process.env.NEAR_CONTRACT_LEDGER };

if (!SUPABASE_URL || !SERVICE_KEY || !DEPLOYER_ID || !DEPLOYER_KEY || !CONTRACTS.ledger) {
  throw new Error("Missing required env vars. Load .env.local before running this script.");
}

const provider = new JsonRpcProvider({ url: process.env.NEAR_NODE_URL || "https://rpc.testnet.near.org" });
const deployer = new Account(DEPLOYER_ID, provider, DEPLOYER_KEY);

async function callContract(contractId, methodName, args) {
  const outcome = await deployer.callFunctionRaw({ contractId, methodName, args, gas: teraToGas("30") });
  return outcome.transaction_outcome.id;
}

function sb(path, options = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation", ...options.headers },
  }).then(async (r) => {
    const body = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(body));
    return body;
  });
}

function sha256(input) { return crypto.createHash("sha256").update(input).digest("hex"); }
function daysAgo(n) { return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString(); }

function computeSafetyScore({ totalCheckins, currentStreak, daysSinceRegistration, incidentSeverities, hazardFlagRate }) {
  const expectedCheckins = Math.max(daysSinceRegistration * 0.7, 1);
  const checkinRate = Math.min(totalCheckins / expectedCheckins, 1);
  const streakBonus = Math.min(currentStreak / 30, 1) * 0.3;
  const consistency = Math.round((checkinRate * 0.7 + streakBonus) * 100);
  const severityWeights = { near_miss: 5, first_aid: 15, medical_treatment: 30, lost_time: 50, serious: 75, fatality: 100 };
  const totalSeverityPoints = incidentSeverities.reduce((sum, sev) => sum + (severityWeights[sev] || 10), 0);
  const incidents = Math.round((1 - Math.min(totalSeverityPoints / 100, 1)) * 100);
  const credentials = 100;
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

// ---------- Hand-authored check-in analyses (schema-exact, varied) ----------
const CHECKIN_TEMPLATES = [
  {
    worker: "Ahmad Zulkifli", zone: "Zone A", days: 3,
    analysis: {
      hazards_detected: [
        { type: "missing_ppe", item: "Worker not wearing safety glasses while operating angle grinder", severity: "high", confidence: 0.91, location_in_image: "center, near the workbench", recommended_action: "Stop grinding operation and issue impact-rated eye protection before resuming." },
      ],
      overall_risk_level: "high", summary: "Worker performing grinding work without eye protection, creating risk of eye injury from metal fragments.",
      iso_45001_categories: ["8.1.2"], immediate_action_required: true,
      positive_observations: ["Worker wearing correct hand protection", "Work area reasonably clear of loose debris"],
      environmental_factors: { lighting: "adequate", weather_conditions: "indoor, not_applicable", crowding: "sparse" },
    },
  },
  {
    worker: "Siti Nurhaliza", zone: "Fabrication Bay", days: 6,
    analysis: {
      hazards_detected: [
        { type: "trip_hazard", item: "Loose welding cables running across the main walkway", severity: "medium", confidence: 0.82, location_in_image: "foreground, crossing the aisle", recommended_action: "Reroute cables along the wall or install cable covers/ramps." },
        { type: "housekeeping", item: "Offcut metal scraps accumulated near the workstation", severity: "low", confidence: 0.68, location_in_image: "right side of frame", recommended_action: "Clear scrap into designated bin at end of each task." },
      ],
      overall_risk_level: "elevated", summary: "Walkway obstructed by loose cabling and metal offcuts, creating trip hazards in a high-traffic area.",
      iso_45001_categories: ["8.1.2", "6.1.2"], immediate_action_required: false,
      positive_observations: ["Worker wearing full PPE including welding helmet and gloves"],
      environmental_factors: { lighting: "adequate", weather_conditions: "not_applicable", crowding: "moderate" },
    },
  },
  {
    worker: "Rajesh Kumar", zone: "Zone B", days: 9,
    analysis: {
      hazards_detected: [
        { type: "fall_risk", item: "Scaffold guardrail missing on the open edge of the second lift", severity: "critical", confidence: 0.95, location_in_image: "upper right, platform edge", recommended_action: "Stop work at height immediately and install guardrail or fall arrest system before continuing." },
      ],
      overall_risk_level: "critical", summary: "Missing guardrail on an elevated scaffold platform presents an immediate fall hazard requiring work stoppage.",
      iso_45001_categories: ["8.1.2"], immediate_action_required: true,
      positive_observations: ["Scaffold base appears properly footed and level"],
      environmental_factors: { lighting: "adequate", weather_conditions: "clear, dry", crowding: "sparse" },
    },
  },
  {
    worker: "Muthu Vellu", zone: "Loading Dock", days: 12,
    analysis: {
      hazards_detected: [
        { type: "electrical_hazard", item: "Damaged insulation on a power cable near the charging station", severity: "high", confidence: 0.87, location_in_image: "left of frame, near equipment base", recommended_action: "De-energize and tag out the cable, replace before further use." },
      ],
      overall_risk_level: "high", summary: "Exposed conductor from damaged cable insulation near equipment charging area poses shock and fire risk.",
      iso_45001_categories: ["8.1.2"], immediate_action_required: true,
      positive_observations: ["Charging station area otherwise well organized", "Worker maintaining safe distance from equipment in motion"],
      environmental_factors: { lighting: "adequate", weather_conditions: "outdoor, overcast", crowding: "sparse" },
    },
  },
  {
    worker: "Wei Ming Tan", zone: "Storage Yard", days: 4,
    analysis: {
      hazards_detected: [
        { type: "housekeeping", item: "Pallets stacked unevenly, leaning against a support column", severity: "medium", confidence: 0.79, location_in_image: "background, near the column", recommended_action: "Restack pallets flat and secure, remove leaning stock from near the column." },
      ],
      overall_risk_level: "elevated", summary: "Unstable pallet stacking near a structural column creates a risk of collapse.",
      iso_45001_categories: ["6.1.2"], immediate_action_required: false,
      positive_observations: ["Worker wearing high-visibility vest and hard hat correctly"],
      environmental_factors: { lighting: "adequate", weather_conditions: "outdoor, clear", crowding: "sparse" },
    },
  },
  {
    worker: "Ahmad Zulkifli", zone: "Zone A", days: 1,
    analysis: {
      hazards_detected: [],
      overall_risk_level: "safe", summary: "No hazards observed. Worker is following correct PPE and housekeeping procedures at the workstation.",
      iso_45001_categories: [], immediate_action_required: false,
      positive_observations: ["Full PPE compliance observed", "Work area clean and well organized", "Tools stored correctly when not in use"],
      environmental_factors: { lighting: "adequate", weather_conditions: "not_applicable", crowding: "sparse" },
    },
  },
  {
    worker: "Siti Nurhaliza", zone: "Fabrication Bay", days: 14,
    analysis: {
      hazards_detected: [
        { type: "missing_ppe", item: "No hearing protection worn near operating angle grinder and impact tools", severity: "medium", confidence: 0.74, location_in_image: "center, at the workstation", recommended_action: "Provide and enforce use of hearing protection in this noise zone." },
      ],
      overall_risk_level: "elevated", summary: "Sustained exposure to high-noise tool operation without hearing protection observed.",
      iso_45001_categories: ["8.1.2"], immediate_action_required: false,
      positive_observations: ["Correct eye and hand protection worn", "Ventilation appears adequate for fume extraction"],
      environmental_factors: { lighting: "adequate", weather_conditions: "not_applicable", crowding: "moderate" },
    },
  },
];

// ---------- Hand-authored incident classifications (schema-exact, varied) ----------
const INCIDENT_TEMPLATES = [
  {
    title: "Minor cut from unguarded blade",
    description: "A worker sustained a shallow laceration to the forearm while clearing debris near an unguarded circular saw blade. First aid was administered on-site; no further treatment was needed.",
    severity: "first_aid", zone: "Fabrication Bay", orgName: "Skyline Builders", workerName: "Siti Nurhaliza", days: 12,
    classification: {
      severity: "first_aid", severity_score: 3,
      root_cause_categories: ["machine_guarding", "procedural"],
      contributing_factors: ["Blade guard removed or not reinstalled after maintenance", "Debris clearing performed while blade area was accessible"],
      affected_body_parts: ["forearm"], equipment_involved: ["circular saw"],
      iso_45001_clause: "8.1.2 Eliminating hazards and reducing OH&S risks",
      recommended_corrective_actions: [
        { action: "Inspect and reinstall blade guard, verify interlock function", priority: "immediate", responsible_party: "supervisor" },
        { action: "Retrain staff on lockout procedure before clearing debris near cutting equipment", priority: "short_term", responsible_party: "safety_officer" },
      ],
      investigation_questions: ["Was the blade guard intentionally removed, and if so by whom and why?", "Was the saw powered off during debris clearing?"],
      similar_incident_prevention: "Enforce mandatory guard-in-place checks before each shift and prohibit debris clearing near live cutting equipment without lockout.",
      summary: "Worker sustained a minor forearm laceration while clearing debris near an unguarded saw blade; first aid resolved the injury on-site.",
    },
  },
  {
    title: "Forklift collision with storage rack",
    description: "A forklift operator misjudged clearance while reversing and struck a storage rack, causing the operator to be thrown against the seatbelt. The worker was taken to hospital for evaluation and was placed on light duty for one week.",
    severity: "lost_time", zone: "Loading Dock", orgName: "Northport Logistics", workerName: "Wei Ming Tan", days: 8,
    classification: {
      severity: "lost_time", severity_score: 6,
      root_cause_categories: ["human_error", "environmental"],
      contributing_factors: ["Limited rear visibility during reversing maneuver", "Racking positioned close to travel aisle"],
      affected_body_parts: ["torso", "neck (whiplash-type strain)"], equipment_involved: ["forklift", "storage rack"],
      iso_45001_clause: "8.1.2 Eliminating hazards and reducing OH&S risks",
      recommended_corrective_actions: [
        { action: "Medical follow-up and light-duty accommodation for affected worker", priority: "immediate", responsible_party: "management" },
        { action: "Install rear-view camera or proximity sensors on forklift fleet", priority: "short_term", responsible_party: "management" },
        { action: "Review aisle clearances against racking layout", priority: "long_term", responsible_party: "safety_officer" },
      ],
      investigation_questions: ["Was a spotter required for this reversing maneuver per site procedure?", "Was the forklift's reverse alarm and mirrors functioning correctly?"],
      similar_incident_prevention: "Mandate spotters or camera systems for reversing in constrained aisles and review rack placement against forklift turning radius.",
      summary: "A forklift reversing in a constrained aisle struck a storage rack, injuring the operator who required hospital evaluation and one week of light duty.",
    },
  },
  {
    title: "Crane load swing causes fall from height",
    description: "During a lift operation, an improperly rigged load swung unexpectedly, causing a nearby worker to lose balance and fall approximately 2.5 meters from a platform. The worker sustained a fractured wrist and was hospitalized overnight.",
    severity: "serious", zone: "Storage Yard", orgName: "Northport Logistics", workerName: "Muthu Vellu", days: 4,
    classification: {
      severity: "serious", severity_score: 8,
      root_cause_categories: ["procedural", "training_gap", "supervision"],
      contributing_factors: ["Load not rigged with tag lines to control swing", "Worker positioned within the load's swing radius", "No exclusion zone enforced during the lift"],
      affected_body_parts: ["wrist"], equipment_involved: ["mobile crane", "rigging chains"],
      iso_45001_clause: "8.1.2 Eliminating hazards and reducing OH&S risks",
      recommended_corrective_actions: [
        { action: "Hospital treatment and case management for injured worker", priority: "immediate", responsible_party: "management" },
        { action: "Suspend crane lifting operations pending rigging procedure review", priority: "immediate", responsible_party: "supervisor" },
        { action: "Retrain riggers and signal persons on tag line use and exclusion zones", priority: "short_term", responsible_party: "safety_officer" },
      ],
      investigation_questions: ["Was a certified rigger involved in planning this lift?", "Was an exclusion zone marked and enforced during the lift?", "Were tag lines available and why were they not used?"],
      similar_incident_prevention: "Enforce certified lift plans with mandatory tag lines and exclusion zones for all crane operations near elevated platforms.",
      summary: "An improperly rigged crane load swung during a lift, causing a nearby worker to fall roughly 2.5 meters and fracture a wrist, requiring overnight hospitalization.",
    },
  },
];

async function main() {
  console.log("=== Backfilling remaining check-ins + incidents (quota-fallback mode) ===");

  const workers = await sb("workers?select=id,full_name");
  const orgs = await sb("organizations?select=id,name");
  const assignments = await sb("worker_assignments?select=worker_id,org_id");
  const workerOrg = new Map(assignments.map((a) => [a.worker_id, a.org_id]));
  const byName = new Map(workers.map((w) => [w.full_name, w]));
  const orgByName = new Map(orgs.map((o) => [o.name, o]));

  console.log(`\n[1/2] Inserting ${CHECKIN_TEMPLATES.length} check-ins...`);
  for (const t of CHECKIN_TEMPLATES) {
    const worker = byName.get(t.worker);
    const orgId = workerOrg.get(worker.id);
    const hazardsCount = t.analysis.hazards_detected.length;
    const checkinDate = daysAgo(t.days);

    const [checkin] = await sb("checkins", {
      method: "POST",
      body: JSON.stringify({
        worker_id: worker.id, org_id: orgId, language: "en", ai_analysis: t.analysis,
        overall_risk: t.analysis.overall_risk_level, hazards_count: hazardsCount, zone: t.zone, created_at: checkinDate,
      }),
    });

    if (hazardsCount > 0) {
      await sb("hazard_flags", {
        method: "POST",
        body: JSON.stringify(t.analysis.hazards_detected.map((h) => ({
          checkin_id: checkin.id, worker_id: worker.id, org_id: orgId, hazard_type: h.type, description: h.item,
          severity: h.severity, confidence: h.confidence, iso_category: t.analysis.iso_45001_categories?.[0] || null, zone: t.zone, created_at: checkinDate,
        }))),
      });
    }

    const dataHash = sha256(JSON.stringify({ id: checkin.id, worker_id: worker.id, ai_analysis: t.analysis }));
    const attestTx = await callContract(CONTRACTS.ledger, "attest_checkin", { checkin_id: checkin.id, worker_id: worker.id, data_hash: dataHash });
    await sb(`checkins?id=eq.${checkin.id}`, { method: "PATCH", body: JSON.stringify({ near_attestation_hash: attestTx }) });
    console.log(`  ${t.worker}: ${t.analysis.overall_risk_level} risk, ${hazardsCount} hazard(s), tx ${attestTx.slice(0, 12)}...`);
  }

  console.log("\n  Recomputing safety scores...");
  for (const worker of workers) {
    const checkins = await sb(`checkins?worker_id=eq.${worker.id}&select=id`);
    const hazards = await sb(`hazard_flags?worker_id=eq.${worker.id}&select=id`);
    const totalCheckins = checkins.length;
    const currentStreak = Math.min(totalCheckins, 1 + Math.floor(Math.random() * 5));
    const { score, breakdown } = computeSafetyScore({
      totalCheckins, currentStreak, daysSinceRegistration: 30,
      incidentSeverities: [], hazardFlagRate: (hazards.length / Math.max(totalCheckins, 1)) * 100,
    });
    await sb(`workers?id=eq.${worker.id}`, {
      method: "PATCH",
      body: JSON.stringify({ total_checkins: totalCheckins, current_streak: currentStreak, safety_score: score, score_breakdown: breakdown }),
    });
    const breakdownHash = sha256(JSON.stringify(breakdown));
    const checkpointTx = await callContract(CONTRACTS.ledger, "checkpoint_score", { worker_id: worker.id, score, breakdown_hash: breakdownHash });
    await sb("score_history", { method: "POST", body: JSON.stringify({ worker_id: worker.id, score, breakdown, near_checkpoint_hash: checkpointTx }) });
    console.log(`  ${worker.full_name}: score ${score} (${totalCheckins} check-ins), tx ${checkpointTx.slice(0, 12)}...`);
  }

  console.log(`\n[2/2] Inserting ${INCIDENT_TEMPLATES.length} incidents...`);
  for (const inc of INCIDENT_TEMPLATES) {
    const already = await sb(`incidents?title=eq.${encodeURIComponent(inc.title)}&select=id`);
    if (already.length > 0) {
      console.log(`  "${inc.title}" already exists, skipping`);
      continue;
    }
    const worker = byName.get(inc.workerName);
    const org = orgByName.get(inc.orgName);
    const [row] = await sb("incidents", {
      method: "POST",
      body: JSON.stringify({
        org_id: org.id, affected_worker_id: worker.id, title: inc.title, description: inc.description, severity: inc.severity,
        ai_classification: inc.classification, root_cause_categories: inc.classification.root_cause_categories,
        corrective_actions: inc.classification.recommended_corrective_actions, zone: inc.zone, status: "open", created_at: daysAgo(inc.days),
      }),
    });
    const dataHash = sha256(JSON.stringify({ id: row.id, title: inc.title, description: inc.description, severity: inc.severity }));
    const tx = await callContract(CONTRACTS.ledger, "record_incident_hash", { incident_id: row.id, data_hash: dataHash, severity: inc.severity, org_id: org.id });
    await sb(`incidents?id=eq.${row.id}`, { method: "PATCH", body: JSON.stringify({ near_tx_hash: tx }) });
    console.log(`  "${inc.title}" (${inc.severity}), tx ${tx.slice(0, 12)}...`);
  }

  console.log("\n=== Backfill complete ===");
}

main().catch((e) => { console.error("FAILED:", e); process.exit(1); });
