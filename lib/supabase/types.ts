export type ScoreBreakdown = {
  consistency: number;
  incidents: number;
  credentials: number;
  hazard_rate: number;
};

export type WorkerRow = {
  id: string;
  user_id: string | null;
  near_account: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  trade: string | null;
  preferred_language: string;
  safety_score: number;
  score_breakdown: ScoreBreakdown;
  total_checkins: number;
  current_streak: number;
  longest_streak: number;
  profile_photo_url: string | null;
  qr_code_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type OrganizationRow = {
  id: string;
  owner_id: string | null;
  name: string;
  site_name: string | null;
  industry: string;
  country: string;
  city: string | null;
  near_account: string | null;
  logo_url: string | null;
  worker_count: number;
  site_safety_score: number;
  invite_code: string;
  created_at: string;
  updated_at: string;
};

export type OrgMemberRow = {
  id: string;
  org_id: string;
  user_id: string;
  role: string;
  can_issue_credentials: boolean;
  created_at: string;
};

export type WorkerAssignmentRow = {
  id: string;
  worker_id: string;
  org_id: string;
  assigned_at: string;
  released_at: string | null;
  status: string;
};

export type CredentialRow = {
  id: string;
  worker_id: string;
  issuer_org_id: string;
  issued_by: string | null;
  credential_type: string;
  title: string;
  description: string | null;
  issued_at: string;
  expires_at: string | null;
  status: string;
  metadata: Record<string, unknown>;
  near_tx_hash: string | null;
  certificate_url: string | null;
  created_at: string;
};

export type HazardDetected = {
  type: string;
  item: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  location_in_image: string;
  recommended_action: string;
};

export type HazardAnalysis = {
  hazards_detected: HazardDetected[];
  overall_risk_level: "safe" | "low" | "elevated" | "high" | "critical";
  summary: string;
  iso_45001_categories: string[];
  immediate_action_required: boolean;
  positive_observations: string[];
  environmental_factors: {
    lighting: string;
    weather_conditions: string;
    crowding: string;
  };
};

export type CheckinRow = {
  id: string;
  worker_id: string;
  org_id: string | null;
  photo_url: string | null;
  text_note: string | null;
  voice_transcript: string | null;
  language: string;
  ai_analysis: HazardAnalysis | null;
  overall_risk: string;
  hazards_count: number;
  near_attestation_hash: string | null;
  zone: string | null;
  created_at: string;
};

export type IncidentClassification = {
  severity: string;
  severity_score: number;
  root_cause_categories: string[];
  contributing_factors: string[];
  affected_body_parts: string[];
  equipment_involved: string[];
  iso_45001_clause: string;
  recommended_corrective_actions: {
    action: string;
    priority: string;
    responsible_party: string;
  }[];
  investigation_questions: string[];
  similar_incident_prevention: string;
  summary: string;
};

export type IncidentRow = {
  id: string;
  org_id: string;
  reported_by: string | null;
  affected_worker_id: string | null;
  title: string;
  description: string | null;
  severity: string;
  ai_classification: IncidentClassification | null;
  root_cause_categories: string[];
  corrective_actions: Record<string, unknown>[];
  status: string;
  resolution_notes: string | null;
  near_tx_hash: string | null;
  photos: string[];
  zone: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type HazardFlagRow = {
  id: string;
  checkin_id: string;
  worker_id: string | null;
  org_id: string | null;
  hazard_type: string;
  description: string | null;
  severity: string;
  confidence: number;
  iso_category: string | null;
  zone: string | null;
  created_at: string;
};

export type ScoreHistoryRow = {
  id: string;
  worker_id: string;
  score: number;
  breakdown: ScoreBreakdown;
  near_checkpoint_hash: string | null;
  recorded_at: string;
};

export type WageRecordRow = {
  id: string;
  worker_id: string;
  org_id: string;
  pay_period_start: string;
  pay_period_end: string;
  shifts_worked: number;
  hours_total: number;
  overtime_hours: number;
  base_rate: number;
  overtime_rate: number;
  gross_pay: number;
  deductions: number;
  net_pay: number;
  currency: string;
  status: string;
  approved_by: string | null;
  near_tx_hash: string | null;
  pay_hash: string | null;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
};

type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };

export interface Database {
  public: {
    Tables: {
      workers: Table<WorkerRow>;
      organizations: Table<OrganizationRow>;
      org_members: Table<OrgMemberRow>;
      worker_assignments: Table<WorkerAssignmentRow>;
      credentials: Table<CredentialRow>;
      checkins: Table<CheckinRow>;
      incidents: Table<IncidentRow>;
      hazard_flags: Table<HazardFlagRow>;
      score_history: Table<ScoreHistoryRow>;
      wage_records: Table<WageRecordRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
