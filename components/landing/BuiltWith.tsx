"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/utils/animations";

const TOOLS = ["NEAR Protocol", "Google Gemini", "Supabase", "Next.js", "Vercel"];

export function BuiltWith() {
  return (
    <section className="py-12 border-t border-b border-[var(--color-border-subtle)] bg-[#FAF9F5] overflow-hidden relative">
      <motion.div
        className="max-w-6xl mx-auto flex flex-col items-center gap-3 px-6 md:px-10 mb-4"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <p className="text-mono-sm text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold">Integrations & Frameworks</p>
      </motion.div>

      {/* Marquee with fade overlays */}
      <div className="relative w-full overflow-hidden py-3">
        {/* Left fade overlay */}
        <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-[#FAF9F5] to-transparent z-10 pointer-events-none" />
        
        {/* Right fade overlay */}
        <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-[#FAF9F5] to-transparent z-10 pointer-events-none" />

        <div className="marquee-track flex items-center gap-20 w-max">
          {[...TOOLS, ...TOOLS, ...TOOLS].map((tool, i) => (
            <span
              key={`${tool}-${i}`}
              className="text-heading-md font-bold tracking-tight text-[var(--color-text-secondary)] opacity-40 transition-all duration-300 hover:scale-105 hover:opacity-90 hover:text-[var(--color-accent)] cursor-default select-none font-serif"
            >
              {tool}
            </span>
          ))}
        </div>
      </div>

      <div className="text-center mt-4">
        <span className="text-mono-sm text-[var(--color-text-tertiary)] opacity-60">Created for ChainHack 2026</span>
      </div>
    </section>
  );
}
