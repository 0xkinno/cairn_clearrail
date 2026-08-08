import { redirect } from "next/navigation";
import { getManagerOrgId } from "@/lib/supabase/manager-guard";
import { createClient } from "@/lib/supabase/server";
import { WorkerRoster } from "@/components/manager/WorkerRoster";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function ManagerWorkersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await getManagerOrgId();
  if (result.error) redirect("/onboarding");
  const { admin, orgId } = result;

  const { data: assignments } = await admin
    .from("worker_assignments")
    .select("worker_id")
    .eq("org_id", orgId)
    .eq("status", "active");

  const workerIds = (assignments || []).map((a) => a.worker_id);
  const { data: workers } =
    workerIds.length > 0
      ? await admin
          .from("workers")
          .select("id, full_name, trade, safety_score, current_streak, total_checkins, near_account")
          .in("id", workerIds)
          .order("full_name", { ascending: true })
      : { data: [] };

  return (
    <div className="px-6 md:px-10 py-12 flex flex-col gap-8">
      <h1 className="text-display-md">Workers</h1>
      {!workers || workers.length === 0 ? (
        <EmptyState
          title="No workers assigned yet"
          description="Share your organization's invite code (Settings) with workers to add them to your roster."
        />
      ) : (
        <WorkerRoster workers={workers} />
      )}
    </div>
  );
}
