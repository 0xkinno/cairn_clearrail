import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { accountId } = await req.json();
  if (!accountId) {
    return NextResponse.json({ error: "accountId (wallet address) is required" }, { status: 400 });
  }

  // Normalize wallet address to lowercase
  const walletAddress = accountId.toLowerCase();

  const admin = createAdminClient();

  // 1. Look up if this wallet_address is already linked to a worker or organization (via near_account column)
  const [{ data: worker }, { data: org }] = await Promise.all([
    admin.from("workers").select("user_id").eq("near_account", walletAddress).maybeSingle(),
    admin.from("organizations").select("id, owner_id").eq("near_account", walletAddress).maybeSingle(),
  ]);

  // If organization exists, find a matching org member to be sure who the manager user is
  let managerUserId: string | null = null;
  if (org && org.owner_id) {
    managerUserId = org.owner_id;
  } else if (org) {
    const { data: member } = await admin
      .from("org_members")
      .select("user_id")
      .eq("org_id", org.id)
      .eq("role", "owner")
      .maybeSingle();
    if (member) managerUserId = member.user_id;
  }

  const targetUserId = worker?.user_id || managerUserId;

  if (targetUserId) {
    // User exists and is onboarded! Get their email from Auth
    const { data: authUser, error: authError } = await admin.auth.admin.getUserById(targetUserId);
    if (authError || !authUser?.user?.email) {
      return NextResponse.json({ error: "Linked user not found in auth store" }, { status: 404 });
    }

    const nextRedirect = worker ? "/worker" : "/manager";
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: authUser.user.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback?next=${nextRedirect}`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      return NextResponse.json({ error: linkError?.message || "Failed to generate session link" }, { status: 500 });
    }

    return NextResponse.json({ exists: true, loginUrl: linkData.properties.action_link });
  }

  // User does not exist / is not onboarded. Create or use placeholder email: [account]@clearrail.auth
  const email = `${walletAddress}@clearrail.auth`;

  try {
    // Attempt placeholder sign-up
    await admin.auth.admin.createUser({
      email,
      password: crypto.randomUUID(),
      email_confirm: true,
    });
  } catch (err) {
    // Ignore error if user already exists
  }

  // Generate onboarding login link
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback?next=/onboarding?wallet_address=${walletAddress}`,
    },
  });

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: linkError?.message || "Failed to generate onboarding session link" }, { status: 500 });
  }

  return NextResponse.json({ exists: false, loginUrl: linkData.properties.action_link });
}
