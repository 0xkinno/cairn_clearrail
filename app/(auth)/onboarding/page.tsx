"use client";

import { useEffect, useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/shared/ErrorState";

type Role = "worker" | "manager";

const LANGUAGE_OPTIONS = [
  { label: "English", value: "en" },
  { label: "Bahasa Malaysia", value: "ms" },
  { label: "ไทย (Thai)", value: "th" },
  { label: "Tiếng Việt", value: "vi" },
];

const INDUSTRY_OPTIONS = [
  { label: "Construction", value: "construction" },
  { label: "Manufacturing", value: "manufacturing" },
  { label: "Oil & Gas", value: "oil_gas" },
  { label: "Logistics", value: "logistics" },
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const walletAddress = searchParams.get("wallet_address") || "";

  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [trade, setTrade] = useState("");
  const [language, setLanguage] = useState("en");

  const [orgName, setOrgName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [industry, setIndustry] = useState("construction");
  const [city, setCity] = useState("");

  useEffect(() => {
    async function checkExisting() {
      try {
        const res = await fetch("/api/auth/status");
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        if (data.onboarded) {
          if (data.role === "worker") {
            router.replace("/worker");
          } else if (data.role === "manager") {
            router.replace("/manager");
          }
          return;
        }
      } catch (err) {
        console.error("Auth status check failed", err);
      }
      setChecking(false);
    }
    checkExisting();
  }, [router]);

  async function handleWorkerSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          trade,
          preferredLanguage: language,
          nearAccount: walletAddress || null,
        }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error || "Could not save onboarding profile.");
        setLoading(false);
        return;
      }

      setLoading(false);
      router.push("/worker");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit profile.");
      setLoading(false);
    }
  }

  async function handleManagerSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName,
          siteName,
          industry,
          city,
          nearAccount: walletAddress || null,
        }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error || "Could not create organization.");
        setLoading(false);
        return;
      }

      setLoading(false);
      router.push("/manager");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organization.");
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="premium-bg min-h-screen flex flex-col items-center justify-center gap-4 px-6 relative">
        <div className="absolute inset-0 grid-pattern opacity-[0.25] pointer-events-none" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-80" />
      </div>
    );
  }

  return (
    <div className="premium-bg min-h-screen flex flex-col items-center justify-center px-6 py-12 relative">
      <div className="absolute inset-0 grid-pattern opacity-[0.25] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-4xl bg-[rgba(255,255,253,0.7)] backdrop-blur-md border border-[var(--color-border)] rounded-3xl p-6 md:p-10 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Onboarding Form Column */}
        <div className="md:col-span-7 flex flex-col justify-center">
          {!role ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                <span className="text-mono-sm text-[var(--color-accent)] font-semibold tracking-wider">ONBOARDING</span>
              </div>
              <h1 className="text-display-md text-[var(--color-text-primary)] font-serif leading-tight">Who are you here as?</h1>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setRole("worker")}
                  className="text-left p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[rgba(255,255,253,0.85)] hover:shadow-lg hover:border-[rgba(212,148,10,0.4)] hover:scale-[1.01] transition-all duration-300 shadow-sm w-full sm:w-64 flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <span className="text-heading-sm font-bold block mb-2 text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                      I&apos;m a worker
                    </span>
                    <span className="text-body-sm text-[var(--color-text-secondary)] leading-relaxed">
                      Build a portable safety record and get verified pay history.
                    </span>
                  </div>
                  <span className="text-mono-sm text-[var(--color-accent)] font-semibold mt-4 block">Select →</span>
                </button>
 
                <button
                  type="button"
                  onClick={() => setRole("manager")}
                  className="text-left p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[rgba(255,255,253,0.85)] hover:shadow-lg hover:border-[rgba(212,148,10,0.4)] hover:scale-[1.01] transition-all duration-300 shadow-sm w-full sm:w-64 flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <span className="text-heading-sm font-bold block mb-2 text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                      I manage a site
                    </span>
                    <span className="text-body-sm text-[var(--color-text-secondary)] leading-relaxed">
                      Get an AI compliance co-pilot for your organization.
                    </span>
                  </div>
                  <span className="text-mono-sm text-[var(--color-accent)] font-semibold mt-4 block">Select →</span>
                </button>
              </div>
            </div>
          ) : role === "worker" ? (
            <form onSubmit={handleWorkerSubmit} className="w-full max-w-sm flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRole(null)}
                  className="text-mono-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  &larr; Back
                </button>
                <span className="text-mono-sm text-[var(--color-text-tertiary)] font-semibold">/ Profile Setup</span>
              </div>
              <h1 className="text-display-md text-[var(--color-text-primary)] font-serif leading-tight">Set up your profile</h1>
              
              {walletAddress && (
                <div className="flex items-center gap-2 bg-[rgba(212,148,10,0.06)] border border-[rgba(212,148,10,0.2)] px-3 py-2 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                  <span className="text-mono-sm text-[var(--color-text-secondary)]">Prefilled wallet: <strong className="break-all">{walletAddress}</strong></span>
                </div>
              )}
 
              {error && <ErrorState message={error} />}
              <Input placeholder="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <Input placeholder="Trade (e.g. Electrician)" value={trade} onChange={(e) => setTrade(e.target.value)} />
              <Dropdown options={LANGUAGE_OPTIONS} value={language} onChange={setLanguage} placeholder="Preferred language" />
              <Button type="submit" disabled={loading} className="shadow-md">
                {loading ? "Saving…" : "Continue"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleManagerSubmit} className="w-full max-w-sm flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRole(null)}
                  className="text-mono-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  &larr; Back
                </button>
                <span className="text-mono-sm text-[var(--color-text-tertiary)] font-semibold">/ Organization Setup</span>
              </div>
              <h1 className="text-display-md text-[var(--color-text-primary)] font-serif leading-tight">Set up your organization</h1>
              
              {walletAddress && (
                <div className="flex items-center gap-2 bg-[rgba(212,148,10,0.06)] border border-[rgba(212,148,10,0.2)] px-3 py-2 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                  <span className="text-mono-sm text-[var(--color-text-secondary)]">Prefilled wallet: <strong className="break-all">{walletAddress}</strong></span>
                </div>
              )}
 
              {error && <ErrorState message={error} />}
              <Input placeholder="Organization name" required value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              <Input placeholder="Site name" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
              <Dropdown options={INDUSTRY_OPTIONS} value={industry} onChange={setIndustry} placeholder="Industry" />
              <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <Button type="submit" disabled={loading} className="shadow-md">
                {loading ? "Saving…" : "Continue"}
              </Button>
            </form>
          )}
        </div>
 
        {/* Premium Graphic/Artwork Column */}
        <div className="md:col-span-5 hidden md:block h-full relative min-h-[400px]">
          <div className="absolute inset-0 rounded-2xl overflow-hidden border border-[var(--color-border-subtle)] shadow-lg bg-[rgba(242,240,235,0.5)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/onboarding_equipment.jpg"
              alt="Premium construction site equipment artwork"
              className="w-full h-full object-cover select-none filter saturate-[0.8] brightness-[0.95]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,18,16,0.35)] to-transparent pointer-events-none" />
            <div className="absolute bottom-6 left-6 right-6 text-white text-left">
              <p className="text-mono-sm text-[rgba(255,255,255,0.7)] tracking-widest font-semibold uppercase mb-1">Industrial Safety</p>
              <p className="font-serif text-heading-md font-medium leading-snug">Anchored on Arbitrum Sepolia, protected forever.</p>
            </div>
          </div>
        </div>
 
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  );
}
