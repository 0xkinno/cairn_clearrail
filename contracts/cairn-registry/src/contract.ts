import { NearBindgen, near, call, view, LookupMap, assert } from "near-sdk-js";

@NearBindgen({})
class CairnRegistry {
  workers: LookupMap<string> = new LookupMap<string>("w");
  workerCount: number = 0;

  @call({})
  register_worker({
    worker_id,
    full_name,
    trade,
  }: {
    worker_id: string;
    full_name: string;
    trade: string;
  }): void {
    assert(this.workers.get(worker_id) === null, "Worker already registered");
    this.workers.set(
      worker_id,
      JSON.stringify({
        full_name,
        trade,
        registered_at: near.blockTimestamp().toString(),
        registered_by: near.predecessorAccountId(),
        is_active: true,
      })
    );
    this.workerCount += 1;
    near.log(`Worker registered: ${worker_id}`);
  }

  @view({})
  get_worker({ worker_id }: { worker_id: string }): string | null {
    return this.workers.get(worker_id);
  }

  @view({})
  get_worker_count(): number {
    return this.workerCount;
  }

  @call({})
  deactivate_worker({ worker_id }: { worker_id: string }): void {
    const existing = this.workers.get(worker_id);
    assert(existing !== null, "Worker not found");
    const record = JSON.parse(existing!);
    assert(near.predecessorAccountId() === record.registered_by, "Only registrar can deactivate");
    record.is_active = false;
    record.deactivated_at = near.blockTimestamp().toString();
    this.workers.set(worker_id, JSON.stringify(record));
  }
}
