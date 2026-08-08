create extension if not exists "uuid-ossp";

-- Workers
create table public.workers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  near_account text unique,
  full_name text not null,
  email text,
  phone text,
  role text not null default 'general',
  trade text,
  preferred_language text default 'en',
  safety_score numeric(5,2) default 50.00,
  score_breakdown jsonb default '{"consistency": 50, "incidents": 50, "credentials": 50, "hazard_rate": 50}'::jsonb,
  total_checkins integer default 0,
  current_streak integer default 0,
  longest_streak integer default 0,
  profile_photo_url text,
  qr_code_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Organizations / Sites
create table public.organizations (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  site_name text,
  industry text not null,
  country text default 'Malaysia',
  city text,
  near_account text,
  logo_url text,
  worker_count integer default 0,
  site_safety_score numeric(5,2) default 50.00,
  invite_code text unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Organization Members
create table public.org_members (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'manager',
  can_issue_credentials boolean default false,
  created_at timestamptz default now(),
  unique(org_id, user_id)
);

-- Worker Assignments
create table public.worker_assignments (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid references public.workers(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  assigned_at timestamptz default now(),
  released_at timestamptz,
  status text default 'active',
  unique(worker_id, org_id, status)
);

-- Credentials
create table public.credentials (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid references public.workers(id) on delete cascade,
  issuer_org_id uuid references public.organizations(id) on delete cascade,
  issued_by uuid references auth.users(id),
  credential_type text not null,
  title text not null,
  description text,
  issued_at timestamptz default now(),
  expires_at timestamptz,
  status text default 'active',
  metadata jsonb default '{}'::jsonb,
  near_tx_hash text,
  certificate_url text,
  created_at timestamptz default now()
);

-- Daily Check-Ins
create table public.checkins (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid references public.workers(id) on delete cascade,
  org_id uuid references public.organizations(id),
  photo_url text,
  text_note text,
  voice_transcript text,
  language text default 'en',
  ai_analysis jsonb,
  overall_risk text default 'low',
  hazards_count integer default 0,
  near_attestation_hash text,
  zone text,
  created_at timestamptz default now()
);

-- Incidents
create table public.incidents (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references public.organizations(id) on delete cascade,
  reported_by uuid references public.workers(id),
  affected_worker_id uuid references public.workers(id),
  title text not null,
  description text,
  severity text not null default 'near_miss',
  ai_classification jsonb,
  root_cause_categories text[] default '{}',
  corrective_actions jsonb default '[]'::jsonb,
  status text default 'open',
  resolution_notes text,
  near_tx_hash text,
  photos text[] default '{}',
  zone text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- Hazard Flags
create table public.hazard_flags (
  id uuid primary key default uuid_generate_v4(),
  checkin_id uuid references public.checkins(id) on delete cascade,
  worker_id uuid references public.workers(id),
  org_id uuid references public.organizations(id),
  hazard_type text not null,
  description text,
  severity text not null,
  confidence numeric(3,2),
  iso_category text,
  zone text,
  created_at timestamptz default now()
);

-- Safety Score History
create table public.score_history (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid references public.workers(id) on delete cascade,
  score numeric(5,2) not null,
  breakdown jsonb,
  near_checkpoint_hash text,
  recorded_at timestamptz default now()
);

-- Shift Wage Records
create table public.wage_records (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid references public.workers(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  pay_period_start date not null,
  pay_period_end date not null,
  shifts_worked integer not null,
  hours_total numeric(6,2) not null,
  overtime_hours numeric(6,2) default 0,
  base_rate numeric(10,2) not null,
  overtime_rate numeric(10,2) default 0,
  gross_pay numeric(12,2) not null,
  deductions numeric(12,2) default 0,
  net_pay numeric(12,2) not null,
  currency text default 'MYR',
  status text default 'pending',
  approved_by uuid references auth.users(id),
  near_tx_hash text,
  pay_hash text,
  notes text,
  created_at timestamptz default now(),
  paid_at timestamptz
);

-- Indexes
create index idx_workers_user_id on public.workers(user_id);
create index idx_workers_near_account on public.workers(near_account);
create index idx_checkins_worker_id on public.checkins(worker_id);
create index idx_checkins_org_id on public.checkins(org_id);
create index idx_checkins_created_at on public.checkins(created_at desc);
create index idx_credentials_worker_id on public.credentials(worker_id);
create index idx_incidents_org_id on public.incidents(org_id);
create index idx_incidents_status on public.incidents(status);
create index idx_hazard_flags_org_id on public.hazard_flags(org_id);
create index idx_hazard_flags_severity on public.hazard_flags(severity);
create index idx_score_history_worker_id on public.score_history(worker_id);
create index idx_worker_assignments_worker_id on public.worker_assignments(worker_id);
create index idx_worker_assignments_org_id on public.worker_assignments(org_id);
create index idx_wage_records_worker_id on public.wage_records(worker_id);
create index idx_wage_records_org_id on public.wage_records(org_id);
create index idx_wage_records_status on public.wage_records(status);
create index idx_wage_records_period on public.wage_records(pay_period_start, pay_period_end);

-- Enable RLS on all tables
alter table public.workers enable row level security;
alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.worker_assignments enable row level security;
alter table public.credentials enable row level security;
alter table public.checkins enable row level security;
alter table public.incidents enable row level security;
alter table public.hazard_flags enable row level security;
alter table public.score_history enable row level security;
alter table public.wage_records enable row level security;

-- RLS Policies
create policy "Workers read own" on public.workers for select using (auth.uid() = user_id);
create policy "Workers update own" on public.workers for update using (auth.uid() = user_id);
create policy "Workers insert own" on public.workers for insert with check (auth.uid() = user_id);
create policy "Public worker verification" on public.workers for select using (is_active = true);

create policy "Org members read" on public.organizations for select using (
  owner_id = auth.uid() or id in (select org_id from public.org_members where user_id = auth.uid())
);
create policy "Org owner manage" on public.organizations for all using (owner_id = auth.uid());

create policy "Workers read own credentials" on public.credentials for select using (
  worker_id in (select id from public.workers where user_id = auth.uid())
);
create policy "Public credential verification" on public.credentials for select using (true);
create policy "Issuers manage credentials" on public.credentials for all using (
  issuer_org_id in (select org_id from public.org_members where user_id = auth.uid() and can_issue_credentials = true)
);

create policy "Workers read own checkins" on public.checkins for select using (
  worker_id in (select id from public.workers where user_id = auth.uid())
);
create policy "Workers create checkins" on public.checkins for insert with check (
  worker_id in (select id from public.workers where user_id = auth.uid())
);
create policy "Managers read site checkins" on public.checkins for select using (
  org_id in (select org_id from public.org_members where user_id = auth.uid())
);

create policy "Managers manage incidents" on public.incidents for all using (
  org_id in (select org_id from public.org_members where user_id = auth.uid())
);

create policy "Managers read hazard flags" on public.hazard_flags for select using (
  org_id in (select org_id from public.org_members where user_id = auth.uid())
);

create policy "Workers read own score history" on public.score_history for select using (
  worker_id in (select id from public.workers where user_id = auth.uid())
);

create policy "Workers read own wages" on public.wage_records for select using (
  worker_id in (select id from public.workers where user_id = auth.uid())
);
create policy "Managers manage wages" on public.wage_records for all using (
  org_id in (select org_id from public.org_members where user_id = auth.uid())
);
create policy "Public wage verification" on public.wage_records for select using (true);

-- Real-time
alter publication supabase_realtime add table public.checkins;
alter publication supabase_realtime add table public.incidents;
alter publication supabase_realtime add table public.hazard_flags;

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger workers_updated_at before update on public.workers for each row execute function public.handle_updated_at();
create trigger organizations_updated_at before update on public.organizations for each row execute function public.handle_updated_at();
