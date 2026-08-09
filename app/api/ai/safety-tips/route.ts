import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { workerRole, siteType, recentHazards, language } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `You are ClearRail's Safety Advisor. Generate 3-5 contextual safety tips.
Worker role: ${workerRole || "general worker"}
Site type: ${siteType || "construction"}
Recent hazards: ${JSON.stringify(recentHazards || [])}
Respond ONLY with valid JSON: { "tips": [{ "title": "string", "description": "string (2-3 sentences)", "priority": "high|medium|low", "category": "ppe|ergonomics|environment|equipment|procedures|awareness" }] }
Respond in ${language || "English"}. Make tips specific, not generic.`;
    const result = await model.generateContent(prompt);
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Failed to parse" }, { status: 500 });
    return NextResponse.json({ tips: JSON.parse(jsonMatch[0]), success: true });
  } catch {
    return NextResponse.json({ error: "Tips generation failed" }, { status: 500 });
  }
}
