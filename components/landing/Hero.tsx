"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { fadeInUp, stagger } from "@/lib/utils/animations";

export function Hero() {
  return (
    <section className="relative flex flex-col bg-gradient-to-b from-[#FAF9F5] via-[#F6F4EE] to-[#EFECE5] overflow-hidden pt-0 pb-0">
      {/* Subtly animated geometric reflections in background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[radial-gradient(circle,rgba(212,148,10,0.06)_0%,transparent_70%)] rounded-full blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(253,246,231,0.5)_0%,transparent_60%)] rounded-full blur-2xl" />
        <div className="absolute inset-0 grid-pattern opacity-[0.25]" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-30 w-full bg-[rgba(250,250,247,0.75)] backdrop-blur-md border-b border-[var(--color-border-subtle)] px-6 md:px-10 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-heading-md font-bold tracking-tight text-[var(--color-text-primary)] hover:opacity-90 transition-opacity flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
            Cairn
          </Link>
          
          {/* Refined Premium Capsule Navbar */}
          <div className="hidden md:flex items-center bg-[rgba(242,240,235,0.8)] border border-[var(--color-border-subtle)] rounded-full p-1 shadow-sm">
            <Link href="/register" className="text-mono-md text-[var(--color-text-secondary)] px-4 py-1.5 rounded-full hover:bg-[var(--color-bg-primary)] hover:text-[var(--color-text-primary)] transition-all duration-200">
              For Workers
            </Link>
            <Link href="/register" className="text-mono-md text-[var(--color-text-secondary)] px-4 py-1.5 rounded-full hover:bg-[var(--color-bg-primary)] hover:text-[var(--color-text-primary)] transition-all duration-200">
              For Sites
            </Link>
            <Link href="/worker/profile" className="text-mono-md text-[var(--color-text-secondary)] px-4 py-1.5 rounded-full hover:bg-[var(--color-bg-primary)] hover:text-[var(--color-text-primary)] transition-all duration-200">
              Verify
            </Link>
            <a
              href="https://github.com/0xkinno/cairn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-mono-md text-[var(--color-text-secondary)] px-4 py-1.5 rounded-full hover:bg-[var(--color-bg-primary)] hover:text-[var(--color-text-primary)] transition-all duration-200"
            >
              GitHub
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-mono-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-3 py-2 transition-colors">
              Log In
            </Link>
            <Link href="/register">
              <Button variant="primary" className="!py-2 !px-4.5 !text-xs !rounded-full">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-10 pb-0 flex flex-col items-center justify-center text-center">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center w-full"
        >
          {/* NEAR verified on-chain trust badge */}
          <motion.div
            variants={fadeInUp}
            className="flex items-center gap-2 px-3 py-1 bg-[var(--color-accent-subtle)] border border-[rgba(212,148,10,0.2)] rounded-full mb-5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-ping" />
            <span className="text-mono-sm text-[var(--color-accent-text)] font-semibold">Portable Trust Layer</span>
          </motion.div>

          <motion.h1 
            variants={fadeInUp} 
            className="text-display-xl text-[var(--color-text-primary)] mb-4 max-w-4xl tracking-tight leading-[1.02]"
          >
            The safety record that follows the worker, not the employer.
          </motion.h1>
          
          <motion.p 
            variants={fadeInUp} 
            className="text-body-lg text-[var(--color-text-secondary)] mb-8 max-w-2xl font-normal leading-relaxed"
          >
            AI-powered safety compliance. On-chain credentials anchored on NEAR Protocol. Portable forever.
          </motion.p>
          
          <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 justify-center mb-10">
            <Link href="/register">
              <Button variant="primary" className="!py-3 !px-7 shadow-md">Get Started</Button>
            </Link>
            <a href="#solution">
              <Button variant="secondary" className="!py-3 !px-7 bg-transparent hover:bg-[rgba(20,18,16,0.05)] border-[var(--color-text-primary)] text-[var(--color-text-primary)]">
                See How It Works
              </Button>
            </a>
          </motion.div>

          {/* Premium Hero Image with Floating Keynote UI Cards */}
          <motion.div 
            variants={fadeInUp} 
            className="relative w-full max-w-4xl rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.4)] p-2 shadow-2xl backdrop-blur-sm mb-4"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-[var(--color-border-subtle)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/cairn_hero.jpg" 
                alt="Construction Safety & AI inspection platform mockup" 
                className="w-full h-full object-cover select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(250,250,247,0.15)] to-transparent pointer-events-none" />
            </div>

            {/* Floating Card 1: Verified Credentials */}
            <motion.div 
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="keynote-card absolute -left-6 md:-left-12 top-10 flex items-center gap-3 w-48 md:w-56"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--color-status-safe-bg)] flex items-center justify-center text-[var(--color-status-safe)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              </div>
              <div className="text-left">
                <p className="text-mono-sm text-[var(--color-text-tertiary)] text-[10px]">VERIFIED CREDENTIALS</p>
                <p className="text-body-sm font-semibold text-[var(--color-text-primary)]">12 Active Badges</p>
              </div>
            </motion.div>

            {/* Floating Card 2: Today's Safety Score */}
            <motion.div 
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="keynote-card absolute -right-6 md:-right-10 top-6 flex items-center gap-3 w-48 md:w-56"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-subtle)] flex items-center justify-center text-[var(--color-accent)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              </div>
              <div className="text-left">
                <p className="text-mono-sm text-[var(--color-text-tertiary)] text-[10px]">TODAY&apos;S SAFETY SCORE</p>
                <p className="text-body-sm font-semibold text-[var(--color-text-primary)]">98 / 100 — Excellent</p>
              </div>
            </motion.div>

            {/* Floating Card 3: AI Hazard Detection */}
            <motion.div 
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="keynote-card absolute -left-4 md:-left-8 bottom-12 flex items-center gap-3 w-48 md:w-56"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--color-status-info-bg)] flex items-center justify-center text-[var(--color-status-info)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l-7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
              </div>
              <div className="text-left">
                <p className="text-mono-sm text-[var(--color-text-tertiary)] text-[10px]">AI HAZARD DETECTION</p>
                <p className="text-body-sm font-semibold text-[var(--color-text-primary)]">Scanning Real-time Feed</p>
              </div>
            </motion.div>

            {/* Floating Card 4: Worker Trust Score */}
            <motion.div 
              animate={{ y: [0, 7, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              className="keynote-card absolute -right-4 md:-right-8 bottom-10 flex items-center gap-3 w-48 md:w-56"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--color-status-safe-bg)] flex items-center justify-center text-[var(--color-status-safe)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
              </div>
              <div className="text-left">
                <p className="text-mono-sm text-[var(--color-text-tertiary)] text-[10px]">WORKER TRUST SCORE</p>
                <p className="text-body-sm font-semibold text-[var(--color-text-primary)]">Portable Identity: Active</p>
              </div>
            </motion.div>

            {/* Floating Card 5: NEAR Verified */}
            <motion.div 
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              className="keynote-card absolute left-1/2 -translate-x-1/2 -bottom-6 flex items-center gap-3 w-44 md:w-52 border-[rgba(212,148,10,0.3)] bg-gradient-to-r from-[rgba(255,255,253,0.95)] to-[rgba(253,246,231,0.95)] shadow-xl"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] animate-ping" />
              <p className="text-mono-sm text-[var(--color-text-primary)] text-center font-bold tracking-wider">NEAR PROTOCOL VERIFIED</p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
