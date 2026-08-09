import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('c:\\Users\\hp\\Downloads\\Cairn-ClearRail\\.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seed() {
  console.log("Seeding Supabase...");

  // 1. Create Auth Users
  const usersToCreate = [
    { email: 'manager@clearrail.io', password: 'clearrail2026', role: 'manager' },
    { email: 'worker@clearrail.io', password: 'clearrail2026', role: 'worker' }
  ];

  const userIds = {};

  for (const u of usersToCreate) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true
    });
    
    if (error && error.message.includes('already exists')) {
      console.log(`User ${u.email} already exists, fetching ID...`);
      // Fallback if already exists, list users and find
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const existingUser = usersData.users.find(user => user.email === u.email);
      userIds[u.role] = existingUser.id;
    } else if (error) {
      console.error(`Error creating ${u.email}:`, error);
    } else {
      console.log(`Created user ${u.email}`);
      userIds[u.role] = data.user.id;
    }
  }

  const managerId = userIds['manager'];
  const workerAuthId = userIds['worker'];

  if (!managerId) throw new Error("Missing manager ID");

  // 2. Create Organization
  let { data: org, error: orgError } = await supabase
    .from('organizations')
    .upsert({
      name: 'ClearRail Demo Corp',
      owner_id: managerId,
      invite_code: 'CLEARRAIL',
      site_safety_score: 88,
      industry: 'Construction'
    }, { onConflict: 'invite_code' })
    .select()
    .single();

  if (orgError) {
    console.error("Org error:", orgError);
  } else {
    console.log("Org created/upserted:", org.id);
  }

  // Also make manager an org_member
  await supabase.from('org_members').upsert({
    org_id: org.id,
    user_id: managerId,
    role: 'manager',
    can_issue_credentials: true
  }, { onConflict: 'org_id,user_id' });

  // 3. Workers
  // We need to fetch existing workers or insert new ones
  const workersData = [
    { user_id: workerAuthId, full_name: 'Marcus Chen', role: 'worker', safety_score: 92, current_streak: 14, total_checkins: 34, is_active: true, near_account: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' },
    { user_id: null, full_name: 'Priya Sharma', role: 'worker', safety_score: 87, current_streak: 8, total_checkins: 22, is_active: true, near_account: '0x5702b24116718DCF49314231222A33403e88Aff8' },
    { user_id: null, full_name: 'James Okafor', role: 'worker', safety_score: 45, current_streak: 2, total_checkins: 9, is_active: true, near_account: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72' }
  ];

  const workerIds = {};
  for (const w of workersData) {
    const { data: workerRow, error: wError } = await supabase
      .from('workers')
      .upsert(w, { onConflict: 'near_account' })
      .select()
      .single();
    
    if (wError) console.error("Worker error:", wError);
    else workerIds[w.full_name] = workerRow.id;
  }
  console.log("Workers created");

  const marcusId = workerIds['Marcus Chen'];
  const priyaId = workerIds['Priya Sharma'];
  const jamesId = workerIds['James Okafor'];

  // Add assignments
  for (const wid of [marcusId, priyaId, jamesId]) {
     await supabase.from('worker_assignments').upsert({
       worker_id: wid, org_id: org.id, status: 'active'
     }, { onConflict: 'worker_id,org_id,status' });
  }

  // 4. Wage Records
  const wageData = [
    { worker_id: marcusId, org_id: org.id, pay_period_start: '2026-08-01', pay_period_end: '2026-08-07', shifts_worked: 5, hours_total: 40, base_rate: 60, gross_pay: 2400, net_pay: 2400, status: 'approved', currency: 'USD' },
    { worker_id: marcusId, org_id: org.id, pay_period_start: '2026-08-08', pay_period_end: '2026-08-14', shifts_worked: 5, hours_total: 40, base_rate: 65, gross_pay: 2600, net_pay: 2600, status: 'pending', currency: 'USD' },
    { worker_id: priyaId, org_id: org.id, pay_period_start: '2026-08-01', pay_period_end: '2026-08-07', shifts_worked: 4, hours_total: 32, base_rate: 56.25, gross_pay: 1800, net_pay: 1800, status: 'approved', currency: 'USD' },
    { worker_id: jamesId, org_id: org.id, pay_period_start: '2026-08-01', pay_period_end: '2026-08-07', shifts_worked: 5, hours_total: 40, base_rate: 52.5, gross_pay: 2100, net_pay: 2100, status: 'blocked', currency: 'USD' }
  ];

  for (const wd of wageData) {
     const { error } = await supabase.from('wage_records').insert(wd);
     if (error) console.error("Wage error (might already exist):", error.message);
  }
  console.log("Wages created");

  // 5. Checkins
  const checkinData = [
    { worker_id: marcusId, org_id: org.id, overall_risk: 'low', hazards_count: 0, photo_url: 'https://images.unsplash.com/photo-1541888087588-926cb99a0a03' },
    { worker_id: jamesId, org_id: org.id, overall_risk: 'high', hazards_count: 2, photo_url: 'https://images.unsplash.com/photo-1504307651254-35680f356f12', ai_analysis: { hazards: ["Missing hard hat", "No safety vest"] } }
  ];
  for (const cd of checkinData) {
     const { error } = await supabase.from('checkins').insert(cd);
     if (error) console.error("Checkin error:", error.message);
  }

  // 6. Credentials
  const credData = [
    { worker_id: marcusId, issuer_org_id: org.id, credential_type: 'OSHA', title: 'OSHA Safety Certification', status: 'active' },
    { worker_id: priyaId, issuer_org_id: org.id, credential_type: 'FIRST_AID', title: 'First Aid Certification', status: 'active' },
    { worker_id: jamesId, issuer_org_id: org.id, credential_type: 'OSHA', title: 'OSHA Safety Certification', status: 'expired' }
  ];
  for (const cr of credData) {
     const { error } = await supabase.from('credentials').insert(cr);
     if (error) console.error("Credential error:", error.message);
  }
  console.log("Credentials created");

  console.log("Seeding complete!");
}

seed().catch(console.error);
