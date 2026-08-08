import { NearBindgen, near, call, view, LookupMap } from "near-sdk-js";

@NearBindgen({})
class SafetyLedger {
  incidentHashes: LookupMap<string> = new LookupMap<string>("ih");
  scoreCheckpoints: LookupMap<string> = new LookupMap<string>("sc");
  checkinAttestations: LookupMap<string> = new LookupMap<string>("ca");
  wageHashes: LookupMap<string> = new LookupMap<string>("wh");
  recordCount: number = 0;

  @call({})
  record_incident_hash({
    incident_id,
    data_hash,
    severity,
    org_id,
  }: {
    incident_id: string;
    data_hash: string;
    severity: string;
    org_id: string;
  }): void {
    this.incidentHashes.set(
      incident_id,
      JSON.stringify({
        incident_id,
        data_hash,
        severity,
        org_id,
        recorded_by: near.predecessorAccountId(),
        recorded_at: near.blockTimestamp().toString(),
        block_height: near.blockIndex().toString(),
      })
    );
    this.recordCount += 1;
    near.log(`Incident hash recorded: ${incident_id}`);
  }

  @call({})
  checkpoint_score({
    worker_id,
    score,
    breakdown_hash,
  }: {
    worker_id: string;
    score: number;
    breakdown_hash: string;
  }): void {
    const key = `${worker_id}_${near.blockTimestamp().toString()}`;
    this.scoreCheckpoints.set(
      key,
      JSON.stringify({
        worker_id,
        score,
        breakdown_hash,
        checkpointed_at: near.blockTimestamp().toString(),
        block_height: near.blockIndex().toString(),
      })
    );
    near.log(`Score checkpoint: ${worker_id} = ${score}`);
  }

  @call({})
  attest_checkin({
    checkin_id,
    worker_id,
    data_hash,
  }: {
    checkin_id: string;
    worker_id: string;
    data_hash: string;
  }): void {
    this.checkinAttestations.set(
      checkin_id,
      JSON.stringify({
        checkin_id,
        worker_id,
        data_hash,
        attested_at: near.blockTimestamp().toString(),
        block_height: near.blockIndex().toString(),
      })
    );
    near.log(`Check-in attested: ${checkin_id}`);
  }

  @call({})
  record_wage_hash({
    wage_record_id,
    worker_id,
    pay_hash,
    amount,
    currency,
    period,
  }: {
    wage_record_id: string;
    worker_id: string;
    pay_hash: string;
    amount: string;
    currency: string;
    period: string;
  }): void {
    this.wageHashes.set(
      wage_record_id,
      JSON.stringify({
        wage_record_id,
        worker_id,
        pay_hash,
        amount,
        currency,
        period,
        recorded_by: near.predecessorAccountId(),
        recorded_at: near.blockTimestamp().toString(),
        block_height: near.blockIndex().toString(),
      })
    );
    near.log(`Wage hash recorded: ${wage_record_id} for ${worker_id}`);
  }

  @view({})
  verify_record({
    record_id,
    record_type,
  }: {
    record_id: string;
    record_type: "incident" | "checkin" | "wage";
  }): string | null {
    if (record_type === "incident") return this.incidentHashes.get(record_id);
    if (record_type === "checkin") return this.checkinAttestations.get(record_id);
    if (record_type === "wage") return this.wageHashes.get(record_id);
    return null;
  }
}
