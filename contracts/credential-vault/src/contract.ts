import { NearBindgen, near, call, view, LookupMap, assert } from "near-sdk-js";

@NearBindgen({})
class CredentialVault {
  credentials: LookupMap<string> = new LookupMap<string>("c");
  workerCredentials: LookupMap<string> = new LookupMap<string>("wc");
  authorizedIssuers: LookupMap<boolean> = new LookupMap<boolean>("ai");
  credentialCount: number = 0;

  @call({})
  authorize_issuer({ issuer_account }: { issuer_account: string }): void {
    assert(near.predecessorAccountId() === near.currentAccountId(), "Only contract owner");
    this.authorizedIssuers.set(issuer_account, true);
  }

  @call({})
  issue_credential({
    credential_id,
    worker_id,
    credential_type,
    title,
    metadata_hash,
    expires_at,
  }: {
    credential_id: string;
    worker_id: string;
    credential_type: string;
    title: string;
    metadata_hash: string;
    expires_at: string | null;
  }): void {
    const issuer = near.predecessorAccountId();
    const credential = {
      id: credential_id,
      worker_id,
      issuer,
      credential_type,
      title,
      metadata_hash,
      issued_at: near.blockTimestamp().toString(),
      expires_at,
      status: "active",
      revoked_at: null,
    };
    this.credentials.set(credential_id, JSON.stringify(credential));
    const existingList = this.workerCredentials.get(worker_id);
    const list = existingList ? JSON.parse(existingList) : [];
    list.push(credential_id);
    this.workerCredentials.set(worker_id, JSON.stringify(list));
    this.credentialCount += 1;
    near.log(`Credential issued: ${credential_id} to ${worker_id} by ${issuer}`);
  }

  @view({})
  verify_credential({ credential_id }: { credential_id: string }): string | null {
    return this.credentials.get(credential_id);
  }

  @view({})
  get_worker_credentials({ worker_id }: { worker_id: string }): string[] {
    const list = this.workerCredentials.get(worker_id);
    if (!list) return [];
    return (JSON.parse(list) as string[]).map((id) => this.credentials.get(id) || "").filter(Boolean);
  }

  @call({})
  revoke_credential({ credential_id }: { credential_id: string }): void {
    const credStr = this.credentials.get(credential_id);
    assert(credStr !== null, "Credential not found");
    const credential = JSON.parse(credStr!);
    assert(near.predecessorAccountId() === credential.issuer, "Only issuer can revoke");
    credential.status = "revoked";
    credential.revoked_at = near.blockTimestamp().toString();
    this.credentials.set(credential_id, JSON.stringify(credential));
    near.log(`Credential revoked: ${credential_id}`);
  }
}
