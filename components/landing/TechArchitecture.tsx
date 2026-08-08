"use client";

import { motion } from "framer-motion";
import { fadeInUp, stagger } from "@/lib/utils/animations";

export function TechArchitecture() {
  return (
    <section className="px-6 md:px-10 py-16 md:py-28 max-w-6xl mx-auto relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[radial-gradient(circle,rgba(212,148,10,0.03)_0%,transparent_70%)] rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="glowing-badge-frame">
            <span className="text-mono-lg font-bold text-[var(--color-accent)] tracking-widest text-[11px] md:text-[12px] uppercase">
              SYSTEM INTERACTION
            </span>
          </div>
          <h2 className="text-display-md text-[var(--color-text-primary)]">Built on a real trust layer</h2>
          <p className="text-body-lg text-[var(--color-text-secondary)] max-w-xl">
            How Cairn secures and verifies worker credentials from the client up to the blockchain.
          </p>
        </div>

        {/* Visual architecture box */}
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6 items-center bg-[rgba(255,255,253,0.5)] border border-[var(--color-border)] p-6 md:p-10 rounded-3xl backdrop-blur-sm shadow-sm">
          
          {/* SVG Connection Lines overlay */}
          <div className="hidden md:block absolute inset-0 pointer-events-none z-0">
            <svg className="w-full h-full" viewBox="0 0 1000 300" fill="none">
              {/* Path 1: Next.js -> Gemini */}
              <motion.path 
                d="M200 150 L330 90" 
                stroke="var(--color-border)" 
                strokeWidth="1.5" 
                strokeDasharray="4 4"
              />
              {/* Path 2: Next.js -> Supabase */}
              <motion.path 
                d="M200 150 L330 210" 
                stroke="var(--color-border)" 
                strokeWidth="1.5" 
                strokeDasharray="4 4"
              />
              {/* Path 3: Gemini -> NEAR */}
              <motion.path 
                d="M580 90 C 650 90, 680 150, 750 150" 
                stroke="var(--color-border)" 
                strokeWidth="1.5"
              />
              {/* Path 4: Supabase -> NEAR */}
              <motion.path 
                d="M580 210 C 650 210, 680 150, 750 150" 
                stroke="var(--color-border)" 
                strokeWidth="1.5"
              />
              
              {/* Glowing animated nodes */}
              <motion.circle 
                r="3.5" 
                fill="var(--color-accent)"
                initial={{ offsetDistance: "0%" }}
                animate={{ offsetDistance: "100%" }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                style={{ offsetPath: "path('M200 150 L330 90')" }}
              />
              <motion.circle 
                r="3.5" 
                fill="var(--color-accent)"
                initial={{ offsetDistance: "0%" }}
                animate={{ offsetDistance: "100%" }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 2 }}
                style={{ offsetPath: "path('M200 150 L330 210')" }}
              />
              <motion.circle 
                r="3.5" 
                fill="var(--color-accent)"
                initial={{ offsetDistance: "0%" }}
                animate={{ offsetDistance: "100%" }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                style={{ offsetPath: "path('M580 90 C 650 90, 680 150, 750 150')" }}
              />
              <motion.circle 
                r="3.5" 
                fill="var(--color-accent)"
                initial={{ offsetDistance: "0%" }}
                animate={{ offsetDistance: "100%" }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 2.5 }}
                style={{ offsetPath: "path('M580 210 C 650 210, 680 150, 750 150')" }}
              />
            </svg>
          </div>

          {/* Card 1: Frontend (Next.js) */}
          <div className="relative z-10">
            <div className="premium-panel p-5 text-center hover:scale-[1.03] duration-300">
              <span className="text-[10px] text-mono-sm font-semibold tracking-wider text-[var(--color-text-tertiary)] block mb-2 uppercase">01 / Frontend</span>
              <div className="h-8 flex items-center justify-center mb-2">
                <span className="text-heading-md font-bold">Next.js</span>
              </div>
              <p className="text-body-sm text-[var(--color-text-secondary)]">Vercel Edge Network</p>
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-safe)] mx-auto mt-3 animate-pulse" />
            </div>
          </div>

          {/* Cards 2 & 3 (Stacked middle column) */}
          <div className="md:col-span-2 grid grid-cols-1 gap-5 relative z-10">
            {/* Card 2: AI Engine */}
            <div className="premium-panel p-5 flex items-center justify-between hover:scale-[1.02] duration-300">
              <div className="text-left">
                <span className="text-[10px] text-mono-sm font-semibold tracking-wider text-[var(--color-text-tertiary)] block mb-1 uppercase">02 / AI Engine</span>
                <p className="text-heading-sm font-bold text-[var(--color-text-primary)]">Google Gemini</p>
                <p className="text-body-sm text-[var(--color-text-secondary)]">Automated Hazard Analysis</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[var(--color-status-info-bg)] flex items-center justify-center text-[var(--color-status-info)] font-bold text-[10px]">
                AI
              </div>
            </div>

            {/* Card 3: Data Layer */}
            <div className="premium-panel p-5 flex items-center justify-between hover:scale-[1.02] duration-300">
              <div className="text-left">
                <span className="text-[10px] text-mono-sm font-semibold tracking-wider text-[var(--color-text-tertiary)] block mb-1 uppercase">03 / Data Layer</span>
                <p className="text-heading-sm font-bold text-[var(--color-text-primary)]">Supabase</p>
                <p className="text-body-sm text-[var(--color-text-secondary)]">PostgreSQL & Auth Sync</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[var(--color-status-safe-bg)] flex items-center justify-center text-[var(--color-status-safe)] font-bold text-[10px]">
                DB
              </div>
            </div>
          </div>

          {/* Card 4: Trust Layer (NEAR Protocol, Highlighted) */}
          <div className="relative z-10">
            <div className="glow-accent bg-gradient-to-br from-[var(--color-accent)] to-[#B87E08] text-[var(--color-accent-text)] p-6 rounded-2xl text-center shadow-lg border border-[rgba(212,148,10,0.3)] hover:scale-[1.03] duration-300 min-h-[200px] flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-mono-sm font-bold tracking-widest block mb-1.5 opacity-80 uppercase text-[var(--color-accent-text)]">04 / Trust Layer</span>
                <p className="text-heading-md font-bold tracking-tight">NEAR Protocol</p>
                <p className="text-body-sm opacity-90 mt-1">On-Chain Ledger & Registry</p>
              </div>
              <div className="mt-3 px-3 py-1 bg-[rgba(20,18,16,0.15)] rounded-full text-mono-sm font-bold inline-block mx-auto text-[9px]">
                SECURED & ANCHORED
              </div>
            </div>
          </div>

        </div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex justify-center mt-10"
        >
          <span className="flex items-center gap-2 text-mono-sm font-semibold text-[var(--color-status-safe)] bg-[var(--color-status-safe-bg)] border border-[rgba(61,122,74,0.15)] px-4 py-1.5 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--color-status-safe)] animate-ping" />
            Verified Cryptographically on NEAR Network
          </span>
        </motion.div>
      </div>
    </section>
  );
}
