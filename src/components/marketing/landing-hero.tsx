"use client";

import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { GradixHeroVisual } from "./gradix-hero-visual";

const phrases = [
  "Excel result upload",
  "parent result checker",
  "official report cards",
  "access control",
  "school analytics",
];

export function LandingHero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setActive((value) => (value + 1) % phrases.length),
      2500
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#030712] text-white selection:bg-[#F97316]/30">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />
      
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F97316]/20 blur-[120px]" 
      />
      <motion.div 
        animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[100px]" 
      />

      <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl items-center gap-16 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:px-8">
        
        {/* Left Content Area - Scroll Animated */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
          }}
          className="relative z-10"
        >
          <motion.span 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="inline-flex items-center gap-2 rounded-full border border-[#F97316]/30 bg-[#F97316]/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-orange-200 backdrop-blur-md"
          >
            <Sparkles className="size-4 animate-pulse text-[#F97316]" /> Built for Nigerian schools
          </motion.span>
          
          <motion.h1 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="mt-8 max-w-4xl text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Publish school results online without changing{" "}
            <span className="bg-gradient-to-r from-[#F97316] to-amber-400 bg-clip-text text-transparent">
              how your teachers work.
            </span>
          </motion.h1>

          <motion.div 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="mt-6 flex h-12 items-center overflow-hidden text-2xl font-bold text-slate-300 sm:text-3xl"
          >
            <span className="mr-3 opacity-60">Seamless</span>
            <div className="relative h-full w-full">
              <motion.span 
                key={phrases[active]} 
                initial={{ y: 40, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                exit={{ y: -40, opacity: 0 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                className="absolute inset-0 flex items-center text-white"
              >
                {phrases[active]}.
              </motion.span>
            </div>
          </motion.div>

          <motion.p 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400"
          >
            Gradix helps schools upload Excel result sheets, publish official report cards, and let parents check results online using one permanent student code.
          </motion.p>

          <motion.div 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button asChild className="group h-14 w-full rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] px-8 text-base font-semibold text-white shadow-[0_0_40px_-10px_#F97316] transition-all hover:shadow-[0_0_60px_-15px_#F97316] sm:w-auto">
                <Link href="/demo">
                  Book a Demo 
                  <motion.span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                    <ArrowRight className="size-5" />
                  </motion.span>
                </Link>
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button asChild className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.03] px-8 text-base font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/[0.08] sm:w-auto" variant="outline">
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="mt-12 grid gap-4 text-sm font-medium text-slate-400 sm:grid-cols-3"
          >
            {["Teachers keep using Excel", "Parents use one permanent code", "Admin controls publishing"].map((item) => (
              <span className="flex items-center gap-2" key={item}>
                <div className="flex size-5 items-center justify-center rounded-full bg-green-500/20">
                  <CheckCircle2 className="size-3.5 text-green-400" />
                </div>
                {item}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Right Content Area - 3D Visual */}
        <div className="relative z-10 lg:ml-auto lg:w-full">
          <GradixHeroVisual />
        </div>
      </div>
    </section>
  );
}