interface ScoreInput {
  totalCheckins: number;
  currentStreak: number;
  daysSinceRegistration: number;
  incidentCount: number;
  incidentSeverities: string[];
  credentialsRequired: number;
  credentialsHeld: number;
  credentialsExpired: number;
  hazardFlagRate: number;
}

export function computeSafetyScore(input: ScoreInput): {
  score: number;
  breakdown: { consistency: number; incidents: number; credentials: number; hazard_rate: number };
} {
  const expectedCheckins = Math.max(input.daysSinceRegistration * 0.7, 1);
  const checkinRate = Math.min(input.totalCheckins / expectedCheckins, 1);
  const streakBonus = Math.min(input.currentStreak / 30, 1) * 0.3;
  const consistency = Math.round((checkinRate * 0.7 + streakBonus) * 100);

  const severityWeights: Record<string, number> = {
    near_miss: 5,
    first_aid: 15,
    medical_treatment: 30,
    lost_time: 50,
    serious: 75,
    fatality: 100,
  };
  const totalSeverityPoints = input.incidentSeverities.reduce(
    (sum, sev) => sum + (severityWeights[sev] || 10),
    0
  );
  const incidents = Math.round((1 - Math.min(totalSeverityPoints / 100, 1)) * 100);

  const requiredHeld = input.credentialsRequired > 0 ? input.credentialsHeld / input.credentialsRequired : 1;
  const expiryPenalty =
    input.credentialsHeld > 0 ? (input.credentialsExpired / input.credentialsHeld) * 0.3 : 0;
  const credentials = Math.round(Math.max(requiredHeld - expiryPenalty, 0) * 100);

  const hazard_rate = Math.round((1 - Math.min(input.hazardFlagRate / 100, 1)) * 100);

  const breakdown = {
    consistency: Math.min(consistency, 100),
    incidents: Math.min(incidents, 100),
    credentials: Math.min(credentials, 100),
    hazard_rate: Math.min(hazard_rate, 100),
  };
  const score = Math.round(
    breakdown.consistency * 0.25 +
      breakdown.incidents * 0.3 +
      breakdown.credentials * 0.25 +
      breakdown.hazard_rate * 0.2
  );
  return { score: Math.min(Math.max(score, 0), 100), breakdown };
}
