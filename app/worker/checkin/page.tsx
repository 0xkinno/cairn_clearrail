"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckInCamera } from "@/components/worker/CheckInCamera";
import { VoiceRecorder } from "@/components/worker/VoiceRecorder";
import { AIAnalysisResult } from "@/components/worker/AIAnalysisResult";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { HazardAnalysis } from "@/lib/supabase/types";
import { useNearWallet } from "@/lib/blockchain/wallet-context";

const LANGUAGE_OPTIONS = [
  { label: "English", value: "en" },
  { label: "Bahasa Malaysia", value: "ms" },
  { label: "ไทย (Thai)", value: "th" },
  { label: "Tiếng Việt", value: "vi" },
];

type Step = "capture" | "analyzing" | "result" | "submitting";

export default function CheckInPage() {
  const router = useRouter();
  const { accountId } = useNearWallet();
  const [step, setStep] = useState<Step>("capture");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [textNote, setTextNote] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [zone, setZone] = useState("");
  const [language, setLanguage] = useState("en");
  const [analysis, setAnalysis] = useState<HazardAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!imageBase64) {
      setError("Take a photo first.");
      return;
    }
    setError(null);
    setStep("analyzing");

    try {
      const res = await fetch("/api/ai/analyze-hazard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, textNote, language }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error || "Analysis failed. Try again.");
        setStep("capture");
        return;
      }

      setAnalysis(body.analysis);
      setStep("result");
    } catch (err: any) {
      setError(err.message || "Failed to analyze.");
      setStep("capture");
    }
  }

  async function handleSubmit() {
    if (!analysis) return;
    setError(null);
    setStep("submitting");

    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          textNote,
          voiceTranscript,
          language,
          zone,
          analysis,
          skipAttestation: false,
        }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error || "Could not save check-in.");
        setStep("result");
        return;
      }

      router.push(`/worker/checkin/${body.checkin.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Attestation saving failed.");
      setStep("result");
    }
  }

  return (
    <div className="px-6 md:px-10 py-12 max-w-2xl mx-auto flex flex-col gap-8">
      <h1 className="text-display-md">Daily check-in</h1>
      {error && <ErrorState message={error} />}

      {(step === "capture" || step === "analyzing") && (
        <div className="flex flex-col gap-6">
          <CheckInCamera onCapture={(_file, base64) => setImageBase64(base64)} />
          <Textarea
            placeholder="Add a note about site conditions (optional)"
            value={textNote}
            onChange={(e) => setTextNote(e.target.value)}
          />
          <VoiceRecorder language={language} onTranscript={setVoiceTranscript} />
          <Input placeholder="Zone / area (optional)" value={zone} onChange={(e) => setZone(e.target.value)} />
          <Dropdown options={LANGUAGE_OPTIONS} value={language} onChange={setLanguage} placeholder="Language" />

          {step === "analyzing" ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-32 w-full" />
              <p className="text-body-sm text-[var(--color-text-tertiary)]">
                Analyzing photo with AI safety engine…
              </p>
            </div>
          ) : (
            <Button onClick={handleAnalyze}>Analyze photo</Button>
          )}
        </div>
      )}

      {(step === "result" || step === "submitting") && analysis && (
        <div className="flex flex-col gap-8">
          <AIAnalysisResult analysis={analysis} />
          <Button onClick={handleSubmit} disabled={step === "submitting"}>
            {step === "submitting" ? "Saving check-in…" : "Submit check-in"}
          </Button>
        </div>
      )}
    </div>
  );
}
