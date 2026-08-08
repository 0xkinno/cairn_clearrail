"use client";

import { useEffect, useRef, useState } from "react";
import { motion, animate, useInView } from "framer-motion";
import { fadeInUp, stagger } from "@/lib/utils/animations";

const STATS = [
  { prefix: "", target: 2.3, decimals: 1, suffix: "M", label: "Workplace deaths annually", desc: "Global industrial and construction accidents highlight critical gaps in portable safety records." },
  { prefix: "<", target: 8, decimals: 0, suffix: "%", label: "Safety digitized in SE Asia", desc: "A massive gap in modern compliance, where paper certificates remain the fragile status quo." },
  { prefix: "$", target: 2, decimals: 0, suffix: "T", label: "ASEAN infrastructure pipeline", desc: "Huge investment volume demands verified, real-time safety and workforce transparency." },
];

function CountUpStat({ prefix, target, decimals, suffix }: { prefix: string; target: number; decimals: number; suffix: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (inView) {
      const controls = animate(0, target, {
        duration: 1.8,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (v) => setDisplay(v.toFixed(decimals)),
      });
      return controls.stop;
    }
  }, [inView, target, decimals]);

  return (
    <p ref={ref} className="text-[52px] md:text-[62px] font-semibold text-[var(--color-text-primary)] tracking-tight leading-none mb-2 font-serif">
      {prefix && <span className="text-[var(--color-accent)] font-sans mr-1 text-[32px] align-super">{prefix}</span>}
      {display}
      {suffix && <span className="text-[var(--color-accent)] font-sans ml-0.5 text-[32px] align-super">{suffix}</span>}
    </p>
  );
}

export function ProblemSection() {
  return (
    <section className="grain-texture px-6 md:px-10 pt-2 pb-16 md:pt-4 md:pb-24 max-w-7xl mx-auto relative">
      {/* Subtle light graphic */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[radial-gradient(circle,rgba(253,246,231,0.4)_0%,transparent_70%)] pointer-events-none z-0" />
      
      <div className="relative z-10">
        {/* Premium Container in Editorial Style */}
        <motion.div
          className="premium-panel p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border)]"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeInUp}
              className="px-6 md:px-8 py-6 md:py-2 flex flex-col justify-between first:pl-0 last:pr-0"
            >
              <div>
                <CountUpStat prefix={stat.prefix} target={stat.target} decimals={stat.decimals} suffix={stat.suffix} />
                <p className="text-heading-sm text-[var(--color-text-primary)] font-semibold mb-2">{stat.label}</p>
              </div>
              <p className="text-body-sm text-[var(--color-text-secondary)] leading-relaxed mt-1">{stat.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Quote write-up framed in a magazine glass-like box that glows on hover */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mt-12 glass-card p-8 md:p-10 rounded-2xl shadow-sm border border-[var(--color-border-subtle)] hover:shadow-lg hover:border-[rgba(212,148,10,0.4)] transition-all duration-300 bg-[rgba(255,255,253,0.85)] hover:scale-[1.01]"
        >
          {/* Subtle line separator */}
          <div className="w-12 h-1 bg-[var(--color-accent)] mx-auto mb-6 rounded-full opacity-60 animate-pulse" />
          <p className="text-body-lg text-[var(--color-text-secondary)] leading-relaxed italic font-serif">
            &ldquo;In Southeast Asia alone, over 50 million construction and factory workers carry paper certificates that get
            lost, forged, and siloed by each employer. There is no portable, verified record of a worker&apos;s competency.&rdquo;
          </p>
        </motion.div>
      </div>
    </section>
  );
}
