import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { QRVerificationCard } from "@/components/worker/QRVerificationCard";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function WorkerProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: worker } = await admin
    .from("workers")
    .select("id, full_name, trade, safety_score")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!worker) {
    return (
      <EmptyState
        title="No profile found"
        description="Complete onboarding to create your worker profile."
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 px-6 py-16">
      <h1 className="text-display-md">Your verification card</h1>
      <QRVerificationCard
        workerId={worker.id}
        fullName={worker.full_name}
        trade={worker.trade}
        safetyScore={worker.safety_score}
      />
    </div>
  );
}
