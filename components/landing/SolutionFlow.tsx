"use client";

import { motion } from "framer-motion";
import { fadeInUp, stagger } from "@/lib/utils/animations";
import { LANDING_IMAGES, unsplashUrl } from "@/lib/utils/images";

const STEPS = [
  {
    image: LANDING_IMAGES.solutionCreateProfile,
    heading: "Create Profile",
    description: "Workers build a portable identity in minutes — no paperwork, no employer lock-in.",
  },
  {
    image: LANDING_IMAGES.solutionCheckIn,
    heading: "Daily Check-In",
    description: "A photo and a note get real AI hazard analysis in seconds, not a compliance form.",
  },
  {
    image: LANDING_IMAGES.solutionCredentials,
    heading: "Earn Credentials & Verified Pay",
    description: "Training certs, clearances, and wage records get anchored on-chain as they happen.",
  },
  {
    image: LANDING_IMAGES.solutionVerified,
    heading: "Verified Everywhere",
    description: "One QR code proves safety history and income to any future employer, instantly.",
  },
];

export function SolutionFlow() {
  return (
    <section id="solution" className="grain-texture px-6 md:px-10 py-16 md:py-28 max-w-7xl mx-auto relative">
      <div className="flex flex-col items-center text-center mb-10 mx-auto">
        <div className="glowing-badge-frame">
          <span className="text-mono-lg font-bold text-[var(--color-accent)] tracking-widest text-[11px] md:text-[12px] uppercase">
            WORKFLOW
          </span>
        </div>
        <h2 className="text-display-md text-[var(--color-text-primary)]">How it works</h2>
      </div>

      <motion.div
        className="relative grid grid-cols-1 md:grid-cols-4 gap-6"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* Elegant horizontal connecting line for desktop */}
        <div
          className="hidden md:block absolute left-4 right-4 pointer-events-none"
          style={{ top: "30%", height: "2px", background: "linear-gradient(to right, var(--color-border-subtle) 0%, var(--color-accent) 50%, var(--color-border-subtle) 100%)", opacity: 0.4 }}
        />

        {STEPS.map((step, i) => (
          <motion.div 
            key={step.heading} 
            variants={fadeInUp} 
            className="group premium-panel relative flex flex-col gap-4 p-5 hover:-translate-y-1.5 hover:shadow-xl duration-300"
          >
            {/* Step indicator node */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="flex items-center justify-center w-7.5 h-7.5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-mono text-xs font-bold border border-[rgba(212,148,10,0.15)] shadow-sm">
                0{i + 1}
              </span>
              <span className="text-[9px] text-mono-md font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest bg-[var(--color-bg-secondary)] px-2 py-0.5 rounded border border-[var(--color-border-subtle)]">
                Stage {i + 1}
              </span>
            </div>

            {/* Framed Image Container */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-[var(--color-border-subtle)] shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={unsplashUrl(step.image.id, 500, 375)}
                alt={step.image.alt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] group-hover:saturate-[1.05]"
                style={{ filter: "saturate(0.9) brightness(1.02)", willChange: "transform" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,18,16,0.1)] to-transparent pointer-events-none" />
            </div>

            {/* Title & Description */}
            <div className="flex flex-col gap-1.5">
              <p className="text-heading-sm text-[var(--color-text-primary)] font-semibold transition-colors duration-200 group-hover:text-[var(--color-accent)]">
                {step.heading}
              </p>
              <p className="text-body-sm text-[var(--color-text-secondary)] leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Decorative bottom hover bar */}
            <div className="absolute bottom-0 left-5 right-5 h-0.5 bg-[var(--color-accent)] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full" />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
