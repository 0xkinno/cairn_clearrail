"use client";

import { motion } from "framer-motion";
import { fadeInUp, stagger } from "@/lib/utils/animations";

const FACTS = [
  { value: "$1.8B → $3.8B", label: "Industrial safety-tech market growth", desc: "A rapidly growing sector as construction and factory sites digitize operations globally.", chart: true },
  { value: "14.8% CAGR", label: "Asia-Pacific compliance software", desc: "Unprecedented software adoption rate in ASEAN markets driven by regulatory safety pressures." },
  { value: "68%", label: "Of site inspections done manually", desc: "The persistent gap in modern automation. A massive paper-based opportunity waiting for Cairn." },
];

function GrowthLine() {
  return (
    <svg
      viewBox="0 0 160 48"
      className="absolute -bottom-1 left-0 w-full h-10 pointer-events-none"
      aria-hidden
    >
      <motion.polyline
        points="4,40 40,32 80,24 120,12 156,4"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.6 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

export function MarketOpportunity() {
  return (
    <section className="px-6 md:px-10 py-16 md:py-28 bg-[var(--color-accent-subtle)] relative overflow-hidden border-t border-b border-[var(--color-border-subtle)]">
      <div className="absolute inset-0 pattern-diagonal opacity-[0.15] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          className="flex flex-col items-center text-center mb-10"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="glowing-badge-frame">
            <span className="text-mono-lg font-bold text-[var(--color-accent)] tracking-widest text-[11px] md:text-[12px] uppercase">
              MARKET ANALYSIS
            </span>
          </div>
          <h2 className="text-display-md text-[var(--color-text-primary)]">A market still running on paper</h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-[rgba(20,18,16,0.08)] bg-[rgba(255,255,253,0.4)] border border-[var(--color-border-subtle)] rounded-2xl p-4 md:p-6 backdrop-blur-sm"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {FACTS.map((fact) => (
            <motion.div key={fact.label} variants={fadeInUp} className="relative px-6 py-6 md:py-2 flex flex-col justify-between first:pl-0 last:pr-0 min-h-[150px]">
              <div>
                <p className="text-[34px] md:text-[42px] font-bold text-[var(--color-accent-hover)] mb-1.5 font-serif leading-none tracking-tight">{fact.value}</p>
                <p className="text-heading-sm text-[var(--color-text-primary)] font-semibold mb-1.5">{fact.label}</p>
              </div>
              <p className="text-body-sm text-[var(--color-text-secondary)] leading-relaxed mt-1">{fact.desc}</p>
              {fact.chart && <GrowthLine />}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
