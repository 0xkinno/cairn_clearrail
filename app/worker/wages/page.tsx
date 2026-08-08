import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WageTimeline } from "@/components/worker/WageTimeline";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function WorkerWagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: worker } = await admin.from("workers").select("id").eq("user_id", user.id).maybeSingle();
  if (!worker) redirect("/onboarding");

  const { data: records } = await admin
    .from("wage_records")
    .select("*")
    .eq("worker_id", worker.id)
    .order("pay_period_end", { ascending: false });

  return (
    <div className="px-6 md:px-10 py-12 max-w-2xl mx-auto flex flex-col gap-8">
      <h1 className="text-display-md">Your verified pay history</h1>
      {!records || records.length === 0 ? (
        <EmptyState
          title="No wage records yet"
          description="Verified pay periods recorded by your site manager will appear here."
        />
      ) : (
        <WageTimeline records={records} />
      )}
    </div>
  );
}
