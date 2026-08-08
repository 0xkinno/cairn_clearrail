import { NextRequest, NextResponse } from "next/server";
import { getManagerOrgId } from "@/lib/supabase/manager-guard";

export async function GET() {
  const result = await getManagerOrgId();
  if (result.error) return result.error;
  const { admin, orgId } = result;

  const { data: org, error } = await admin
    .from("organizations")
    .select("id, name, site_name, industry, city, invite_code")
    .eq("id", orgId)
    .maybeSingle();

  if (error || !org) return NextResponse.json({ error: error?.message || "Not found" }, { status: 404 });
  return NextResponse.json({ organization: org });
}

export async function PATCH(req: NextRequest) {
  const result = await getManagerOrgId();
  if (result.error) return result.error;
  const { admin, orgId } = result;

  const body = await req.json();
  const { name, siteName, industry, city } = body as {
    name: string;
    siteName?: string;
    industry: string;
    city?: string;
  };

  const { data: org, error } = await admin
    .from("organizations")
    .update({ name, site_name: siteName || null, industry, city: city || null })
    .eq("id", orgId)
    .select()
    .single();

  if (error || !org) return NextResponse.json({ error: error?.message || "Update failed" }, { status: 500 });
  return NextResponse.json({ organization: org });
}
