import { NearBindgen, near, call, view, LookupMap, assert } from "near-sdk-js";

@NearBindgen({})
class OrgRegistry {
  organizations: LookupMap<string> = new LookupMap<string>("o");
  orgIssuers: LookupMap<string> = new LookupMap<string>("oi");
  orgCount: number = 0;

  @call({})
  register_org({
    org_id,
    name,
    industry,
  }: {
    org_id: string;
    name: string;
    industry: string;
  }): void {
    assert(this.organizations.get(org_id) === null, "Org already registered");
    this.organizations.set(
      org_id,
      JSON.stringify({
        name,
        industry,
        registered_by: near.predecessorAccountId(),
        registered_at: near.blockTimestamp().toString(),
      })
    );
    this.orgIssuers.set(org_id, JSON.stringify([near.predecessorAccountId()]));
    this.orgCount += 1;
    near.log(`Org registered: ${org_id}`);
  }

  @call({})
  add_issuer({ org_id, issuer_account }: { org_id: string; issuer_account: string }): void {
    const org = this.organizations.get(org_id);
    assert(org !== null, "Org not found");
    const orgData = JSON.parse(org!);
    assert(near.predecessorAccountId() === orgData.registered_by, "Only org owner");
    const issuers = JSON.parse(this.orgIssuers.get(org_id) || "[]");
    if (!issuers.includes(issuer_account)) {
      issuers.push(issuer_account);
      this.orgIssuers.set(org_id, JSON.stringify(issuers));
    }
  }

  @call({})
  remove_issuer({ org_id, issuer_account }: { org_id: string; issuer_account: string }): void {
    const org = this.organizations.get(org_id);
    assert(org !== null, "Org not found");
    assert(near.predecessorAccountId() === JSON.parse(org!).registered_by, "Only org owner");
    const issuers = JSON.parse(this.orgIssuers.get(org_id) || "[]").filter(
      (a: string) => a !== issuer_account
    );
    this.orgIssuers.set(org_id, JSON.stringify(issuers));
  }

  @view({})
  get_org({ org_id }: { org_id: string }): string | null {
    return this.organizations.get(org_id);
  }

  @view({})
  get_org_count(): number {
    return this.orgCount;
  }
}
