import { redirect } from "next/navigation";
import { getManagerOrgId } from "@/lib/supabase/manager-guard";
import { ReportGenerator } from "@/components/manager/ReportGenerator";

export default async function ManagerReportsPage() {
  const result = await getManagerOrgId();
  if (result.error) redirect("/onboarding");
  const { orgId } = result;

  return (
    <div className="px-6 md:px-10 py-12 max-w-2xl mx-auto flex flex-col gap-8">
      <h1 className="text-display-md">Compliance reports</h1>
      <ReportGenerator orgId={orgId} />
    </div>
  );
}
