import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { INCIDENT_CLASSIFICATION_PROMPT } from "@/lib/ai/prompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { description, language } = await req.json();
    if (!description) return NextResponse.json({ error: "Incident description required" }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `${INCIDENT_CLASSIFICATION_PROMPT}\n\nIncident description: "${description}"\nRespond in ${language || "English"}.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });

    const classification = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ classification, success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Classification failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
