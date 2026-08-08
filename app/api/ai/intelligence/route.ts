import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { orgId, dateRange } = await req.json();
    const supabase = await createClient();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: hazards }, { data: incidents }, { data: checkins }] = await Promise.all([
      supabase
        .from("hazard_flags")
        .select("*")
        .eq("org_id", orgId)
        .gte("created_at", dateRange?.start || thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("incidents")
        .select("*")
        .eq("org_id", orgId)
        .gte("created_at", dateRange?.start || thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("checkins")
        .select("id, overall_risk, hazards_count, zone, created_at")
        .eq("org_id", orgId)
        .gte("created_at", dateRange?.start || thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const riskDist = (checkins || []).reduce((acc: Record<string, number>, c) => {
      acc[c.overall_risk] = (acc[c.overall_risk] || 0) + 1;
      return acc;
    }, {});

    const prompt = `You are Cairn's Predictive Safety Intelligence Engine. Analyze this safety data and generate a comprehensive intelligence brief.
Hazard flags (${hazards?.length || 0}): ${JSON.stringify(hazards?.slice(0, 50) || [])}
Incidents (${incidents?.length || 0}): ${JSON.stringify(incidents?.slice(0, 20) || [])}
Check-in risk distribution: ${JSON.stringify(riskDist)}
Respond ONLY with valid JSON: { "risk_forecast": { "overall_trend": "improving|stable|deteriorating", "risk_level": "low|moderate|elevated|high", "confidence": 0.0-1.0, "summary": "string" }, "patterns_detected": [{ "pattern": "string", "frequency": "string", "affected_zones": ["string"], "severity": "string", "recommendation": "string" }], "top_risks": [{ "risk": "string", "probability": "low|medium|high", "impact": "low|medium|high|critical", "mitigation": "string" }], "weekly_brief": "string (3-5 sentence executive summary)", "positive_trends": ["string"] }`;

    const result = await model.generateContent(prompt);
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Failed to parse" }, { status: 500 });
    return NextResponse.json({ intelligence: JSON.parse(jsonMatch[0]), success: true });
  } catch {
    return NextResponse.json({ error: "Intelligence generation failed" }, { status: 500 });
  }
}
