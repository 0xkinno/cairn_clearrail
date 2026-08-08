import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { HAZARD_ANALYSIS_PROMPT } from "@/lib/ai/prompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, textNote, language } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: "Image required" }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const userMessage = textNote
      ? `Analyze this workplace photo for safety hazards. The worker also noted: "${textNote}". Respond in ${language || "English"}.`
      : `Analyze this workplace photo for safety hazards. Respond in ${language || "English"}.`;

    const result = await model.generateContent([
      { text: HAZARD_ANALYSIS_PROMPT + "\n\n" + userMessage },
      { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
    ]);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch)
      return NextResponse.json({ error: "Failed to parse AI response", raw: responseText }, { status: 500 });

    const analysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ analysis, success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Analysis failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
