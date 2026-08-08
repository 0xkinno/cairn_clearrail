import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Navigation } from "@/components/shared/Navigation";

const WORKER_NAV = [
  { label: "Dashboard", href: "/worker" },
  { label: "Check-In", href: "/worker/checkin" },
  { label: "Credentials", href: "/worker/credentials" },
  { label: "Wages", href: "/worker/wages" },
  { label: "History", href: "/worker/history" },
  { label: "Profile", href: "/worker/profile" },
  { label: "Settings", href: "/worker/settings" },
];

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: worker } = await admin
    .from("workers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!worker) redirect("/onboarding");

  return (
    <div className="flex flex-col flex-1">
      <Navigation items={WORKER_NAV} brandHref="/worker" />
      <main className="flex-1">{children}</main>
    </div>
  );
}
