import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CredentialTimeline } from "@/components/worker/CredentialTimeline";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function WorkerCredentialsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: worker } = await admin.from("workers").select("id").eq("user_id", user.id).maybeSingle();
  if (!worker) redirect("/onboarding");

  const { data: credentials } = await admin
    .from("credentials")
    .select("*")
    .eq("worker_id", worker.id)
    .order("issued_at", { ascending: false });

  return (
    <div className="px-6 md:px-10 py-12 max-w-2xl mx-auto flex flex-col gap-8">
      <h1 className="text-display-md">Your credentials</h1>
      {!credentials || credentials.length === 0 ? (
        <EmptyState
          title="No credentials yet"
          description="Training certifications and site clearances issued by your site manager will appear here."
        />
      ) : (
        <CredentialTimeline credentials={credentials} />
      )}
    </div>
  );
}
