"use client";

import { useRef, useState, DragEvent } from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/utils/animations";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { AIAnalysisResult } from "@/components/worker/AIAnalysisResult";
import { LANDING_IMAGES, unsplashUrl } from "@/lib/utils/images";
import type { HazardAnalysis } from "@/lib/supabase/types";

const RISK_BORDER: Record<string, string> = {
  safe: "var(--color-status-safe)",
  low: "var(--color-status-safe)",
  elevated: "var(--color-status-warning)",
  high: "var(--color-status-critical)",
  critical: "var(--color-status-critical)",
};

export function LiveDemoWidget() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<HazardAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze(base64: string) {
    setAnalyzing(true);
    setAnalysis(null);
    setError(null);
    try {
      const res = await fetch("/api/ai/analyze-hazard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, language: "English" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Analysis failed");
      setAnalysis(body.analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      analyze(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  async function handleSample() {
    const url = unsplashUrl(LANDING_IMAGES.liveDemoSample.id, 800);
    const blob = await fetch(url).then((r) => r.blob());
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      analyze(result.split(",")[1]);
    };
    reader.readAsDataURL(blob);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  return (
    <section className="px-6 md:px-10 py-16 md:py-28 bg-gradient-to-b from-[#FAF9F5] to-[#F6F4EE] relative overflow-hidden">
      <div className="absolute inset-0 pattern-diagonal opacity-[0.25] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-[600px] h-[300px] bg-[radial-gradient(circle,rgba(212,148,10,0.03)_0%,transparent_75%)] pointer-events-none z-0" />
      
      <motion.div
        className="max-w-4xl mx-auto relative z-10"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="glowing-badge-frame">
            <span className="text-mono-lg font-bold text-[var(--color-accent)] tracking-widest text-[11px] md:text-[12px] uppercase">
              LIVE ANALYSIS
            </span>
          </div>
          <h2 className="text-display-md text-[var(--color-text-primary)]">Try it yourself.</h2>
          <p className="text-body-lg text-[var(--color-text-secondary)] max-w-xl">
            Upload a workplace photo — real Gemini AI analysis, no sign-up required.
          </p>
        </div>

        {/* Apple-grade Upload Container */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative p-8 md:p-12 flex flex-col items-center gap-5 text-center transition-all duration-300 rounded-2xl border ${
            dragging 
              ? "bg-[rgba(212,148,10,0.04)] border-[var(--color-accent)] shadow-lg scale-[1.01]" 
              : "bg-[rgba(255,255,253,0.7)] border-[var(--color-border)] shadow-sm hover:shadow-md hover:border-[rgba(212,148,10,0.3)]"
          }`}
          style={{ backdropFilter: "blur(12px)" }}
        >
          {preview ? (
            <div className="relative group/preview max-w-md rounded-xl overflow-hidden border border-[var(--color-border-subtle)] shadow-md bg-[var(--color-bg-secondary)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Uploaded photo" className="max-h-64 w-full object-cover" />
              {analyzing && (
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(212,148,10,0.15)] to-transparent animate-pulse" />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center text-[var(--color-accent)] border border-[rgba(212,148,10,0.15)] mb-2 animate-bounce" style={{ animationDuration: "3s" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-heading-sm text-[var(--color-text-primary)] font-semibold">Drag and drop a workplace photo here</p>
              <p className="text-body-sm text-[var(--color-text-tertiary)] max-w-xs">Supports common image formats. Safe, instant processing with Gemini.</p>
            </div>
          )}
          
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          
          <div className="flex flex-wrap justify-center gap-3 mt-1">
            <Button variant="primary" onClick={() => inputRef.current?.click()} className="shadow-sm">
              Choose photo
            </Button>
            <Button variant="secondary" onClick={handleSample} className="bg-transparent hover:bg-[var(--color-bg-secondary)]">
              Use sample photo
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-5 p-4 rounded-lg bg-[var(--color-status-critical-bg)] border border-[rgba(181,48,42,0.15)] text-center">
            <p className="text-body-sm text-[var(--color-status-critical)] font-medium">{error}</p>
          </div>
        )}

        {analyzing && (
          <div className="flex flex-col gap-3 mt-6 premium-panel p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {analysis && !analyzing && (
          <div
            className="glass-card mt-6 p-6 md:p-8 rounded-2xl shadow-lg border-l-4"
            style={{ borderLeftColor: RISK_BORDER[analysis.overall_risk_level] || "var(--color-accent)" }}
          >
            <AIAnalysisResult analysis={analysis} />
          </div>
        )}
      </motion.div>
    </section>
  );
}
