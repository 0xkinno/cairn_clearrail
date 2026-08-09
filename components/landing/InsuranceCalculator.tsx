"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/utils/animations";
import { Dropdown } from "@/components/ui/Dropdown";

const INDUSTRY_MULTIPLIER: Record<string, number> = {
  construction: 1.4,
  manufacturing: 1.1,
  oil_gas: 1.8,
  logistics: 1.0,
};

const INDUSTRY_OPTIONS = [
  { label: "Construction", value: "construction" },
  { label: "Manufacturing", value: "manufacturing" },
  { label: "Oil & Gas", value: "oil_gas" },
  { label: "Logistics", value: "logistics" },
];

const AVG_INCIDENT_COST = 42000; // MYR, blended cost per lost-time incident (medical, downtime, claims)

function rangeStyle(value: number, min: number, max: number): React.CSSProperties {
  const pct = ((value - min) / (max - min)) * 100;
  return { ["--range-progress" as string]: `${pct}%` };
}

export function InsuranceCalculator() {
  const [workers, setWorkers] = useState(250);
  const [industry, setIndustry] = useState("construction");
  const [incidentRate, setIncidentRate] = useState(8);

  const savings = useMemo(() => {
    const multiplier = INDUSTRY_MULTIPLIER[industry] || 1;
    const annualIncidents = (workers * (incidentRate / 100)) * multiplier;
    const currentCost = annualIncidents * AVG_INCIDENT_COST;
    const estimatedReduction = currentCost * 0.32; // AI early-detection + digitized compliance, conservative estimate
    return Math.round(estimatedReduction);
  }, [workers, industry, incidentRate]);

  return (
    <section className="px-6 md:px-10 py-16 md:py-28 max-w-5xl mx-auto relative">
      <div className="absolute top-1/2 right-1/4 w-[400px] h-[200px] bg-[radial-gradient(circle,rgba(212,148,10,0.02)_0%,transparent_75%)] pointer-events-none z-0" />
      
      <motion.div 
        variants={fadeInUp} 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true, margin: "-100px" }}
        className="relative z-10"
      >
        <div className="flex flex-col items-center md:items-start text-center md:text-left mb-10">
          <div className="glowing-badge-frame">
            <span className="text-mono-lg font-bold text-[var(--color-accent)] tracking-widest text-[11px] md:text-[12px] uppercase">
              CALCULATOR
            </span>
          </div>
          <h2 className="text-display-md text-[var(--color-text-primary)]">What could ClearRail save your site?</h2>
          <p className="text-body-lg text-[var(--color-text-secondary)] max-w-xl">
            Estimated annual savings from reduced incident costs and insurance premiums.
          </p>
        </div>

        {/* Enterprise Grade Inputs Panel */}
        <div className="premium-panel p-6 md:p-10 mb-6 bg-[rgba(255,255,253,0.75)] shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            
            {/* Sliders 1: Workers */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-mono-sm text-[var(--color-text-tertiary)] uppercase tracking-wider font-semibold">Workers on site</label>
                <span className="text-mono-md font-bold text-[var(--color-text-primary)] px-2.5 py-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-lg text-xs">
                  {workers}
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={2000}
                step={10}
                value={workers}
                onChange={(e) => setWorkers(Number(e.target.value))}
                style={rangeStyle(workers, 10, 2000)}
                className="w-full"
              />
            </div>

            {/* Sliders 2: Industry */}
            <div className="flex flex-col gap-3">
              <label className="text-mono-sm text-[var(--color-text-tertiary)] uppercase tracking-wider font-semibold mb-1">Industry vertical</label>
              <Dropdown options={INDUSTRY_OPTIONS} value={industry} onChange={setIndustry} className="w-full" />
            </div>

            {/* Sliders 3: Incident Rate */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-mono-sm text-[var(--color-text-tertiary)] uppercase tracking-wider font-semibold">Current Incident Rate</label>
                <span className="text-mono-md font-bold text-[var(--color-text-primary)] px-2.5 py-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-lg text-xs">
                  {incidentRate}%
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={25}
                step={1}
                value={incidentRate}
                onChange={(e) => setIncidentRate(Number(e.target.value))}
                style={rangeStyle(incidentRate, 1, 25)}
                className="w-full"
              />
            </div>

          </div>
        </div>

        {/* Dark Result Panel (Unchanged background color as requested, but upgraded layout styling) */}
        <div className="pattern-dots bg-[var(--color-bg-inverse)] text-[var(--color-text-inverse)] p-8 md:p-10 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-[var(--color-border)]">
          <div>
            <p className="text-mono-sm text-[var(--color-text-inverse-secondary)] uppercase tracking-widest mb-1.5 font-semibold">Estimated Annual Savings</p>
            <p className="text-score text-[var(--color-accent)] font-bold tracking-tight">
              MYR <span key={savings} className="number-flash font-serif">{savings.toLocaleString()}</span>
            </p>
          </div>
          <div className="max-w-xs md:border-l md:border-[rgba(250,250,247,0.15)] md:pl-8 py-1">
            <p className="text-body-sm text-[var(--color-text-inverse-secondary)] leading-relaxed">
              Calculations assume a conservative <strong className="text-[var(--color-text-inverse)] font-semibold">32% compliance overhead reduction</strong>, based on Gemini AI hazard mitigation and real-time Arbitrum Sepolia blockchain credential logging.
            </p>
          </div>
        </div>

      </motion.div>
    </section>
  );
}
