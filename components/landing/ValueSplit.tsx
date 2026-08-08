"use client";

import { motion } from "framer-motion";
import { slideInLeft, slideInRight } from "@/lib/utils/animations";
import { LANDING_IMAGES, unsplashUrl } from "@/lib/utils/images";

const WORKER_ITEMS = [
  "Portable credentials that follow you between employers",
  "AI-scored safety record you own and control",
  "One QR code for instant verification anywhere",
  "Verified pay records for every site you've worked",
];

const SITE_ITEMS = [
  "Real-time hazard feed from every worker check-in",
  "Credential issuance and management, on-chain",
  "One-click compliance reports for audits",
  "Predictive safety intelligence, wage management",
];

export function ValueSplit() {
  return (
    <section className="grain-texture px-6 md:px-10 py-16 md:py-28 max-w-7xl mx-auto relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,148,10,0.025)_0%,transparent_70%)] rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* For Workers Panel */}
        <motion.div
          className="premium-panel relative overflow-hidden p-6 md:p-10 flex flex-col justify-between min-h-[440px]"
          variants={slideInLeft}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Subtle editorial watermark */}
          <span className="watermark bottom-4 right-6 text-[rgba(20,18,16,0.04)] select-none pointer-events-none font-serif text-[150px] leading-none" aria-hidden>
            01
          </span>
          
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="glowing-badge-frame !mb-0">
                <span className="text-mono-lg font-bold text-[var(--color-accent)] tracking-widest text-[11px] md:text-[12px] uppercase">INDIVIDUALS</span>
              </div>
              <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
            </div>
            <h3 className="text-display-md text-[var(--color-text-primary)] mb-6 font-serif leading-tight">Your record. Your career.</h3>
            
            <ul className="flex flex-col gap-4 max-w-md relative z-10">
              {WORKER_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-body-md text-[var(--color-text-secondary)]">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[rgba(212,148,10,0.15)] flex-shrink-0 text-xs font-bold mt-0.5">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex justify-between items-end relative z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={unsplashUrl(LANDING_IMAGES.solutionVerified.id, 240, 180)}
              alt="Workers wearing safety vests"
              loading="lazy"
              className="w-[160px] h-[100px] object-cover rounded-lg border border-[var(--color-border-subtle)] shadow-sm filter saturate-[0.85] brightness-[1.02]"
            />
          </div>
        </motion.div>

        {/* For Sites Panel */}
        <motion.div
          className="premium-panel relative overflow-hidden p-6 md:p-10 flex flex-col justify-between min-h-[440px]"
          variants={slideInRight}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Subtle editorial watermark */}
          <span className="watermark bottom-4 right-6 text-[rgba(20,18,16,0.04)] select-none pointer-events-none font-serif text-[150px] leading-none" aria-hidden>
            02
          </span>

          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="glowing-badge-frame !mb-0">
                <span className="text-mono-lg font-bold text-[var(--color-accent)] tracking-widest text-[11px] md:text-[12px] uppercase">ENTERPRISES</span>
              </div>
              <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
            </div>
            <h3 className="text-display-md text-[var(--color-text-primary)] mb-6 font-serif leading-tight">An AI compliance co-pilot.</h3>
            
            <ul className="flex flex-col gap-4 max-w-md relative z-10">
              {SITE_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-body-md text-[var(--color-text-secondary)]">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[rgba(212,148,10,0.15)] flex-shrink-0 text-xs font-bold mt-0.5">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex justify-between items-end relative z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={unsplashUrl(LANDING_IMAGES.valueSplit.id, 240, 180)}
              alt="Site supervisor safety management"
              loading="lazy"
              className="w-[160px] h-[100px] object-cover rounded-lg border border-[var(--color-border-subtle)] shadow-sm filter saturate-[0.85] brightness-[1.02]"
            />
          </div>
        </motion.div>

      </div>
    </section>
  );
}
