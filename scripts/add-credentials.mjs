import crypto from "crypto";
import { Account, JsonRpcProvider, teraToGas } from "near-api-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEPLOYER_ID = process.env.NEAR_DEPLOYER_ACCOUNT_ID;
const DEPLOYER_KEY = process.env.NEAR_DEPLOYER_PRIVATE_KEY;
const VAULT = process.env.NEAR_CONTRACT_VAULT;

if (!SUPABASE_URL || !SERVICE_KEY || !DEPLOYER_ID || !DEPLOYER_KEY || !VAULT) {
  throw new Error("Missing required env vars. Load .env.local before running this script.");
}

const provider = new JsonRpcProvider({ url: "https://rpc.testnet.near.org" });
const deployer = new Account(DEPLOYER_ID, provider, DEPLOYER_KEY);

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

async function main() {
  const workers = await sb("workers?select=id,full_name");
  const assignments = await sb("worker_assignments?select=worker_id,org_id");
  const byWorker = new Map(assignments.map((a) => [a.worker_id, a.org_id]));

  const NEW_CREDS = [
    { workerName: "Wei Ming Tan", type: "incident_free_milestone", title: "180 Days Incident-Free" },
    { workerName: "Ahmad Zulkifli", type: "site_clearance", title: "Container Yard Access" },
  ];

  for (const c of NEW_CREDS) {
    const worker = workers.find((w) => w.full_name === c.workerName);
    const existing = await sb(`credentials?worker_id=eq.${worker.id}&title=eq.${encodeURIComponent(c.title)}&select=id`);
    if (existing.length > 0) {
      console.log(`"${c.title}" -> ${c.workerName} already exists`);
      continue;
    }
    const orgId = byWorker.get(worker.id);
    const credentialId = crypto.randomUUID();
    const metadataHash = sha256(JSON.stringify({ workerId: worker.id, ...c }));
    const outcome = await deployer.callFunctionRaw({
      contractId: VAULT,
      methodName: "issue_credential",
      args: { credential_id: credentialId, worker_id: worker.id, credential_type: c.type, title: c.title, metadata_hash: metadataHash, expires_at: null },
      gas: teraToGas("30"),
    });
    const tx = outcome.transaction_outcome.id;
    await sb("credentials", {
      method: "POST",
      body: JSON.stringify({ id: credentialId, worker_id: worker.id, issuer_org_id: orgId, credential_type: c.type, title: c.title, near_tx_hash: tx }),
    });
    console.log(`"${c.title}" -> ${c.workerName}, tx ${tx}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
