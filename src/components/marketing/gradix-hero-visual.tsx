"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { BarChart3, FileSpreadsheet, LockKeyhole, Smartphone } from "lucide-react";
import { useRef } from "react";

const workflow = ["Excel Upload", "Validate", "Publish", "Parent Checks"];

export function GradixHeroVisual() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Scroll-based parallax for the whole visual
  const yParallax = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <div ref={containerRef} className="perspective-[2000px] relative w-full">
      <motion.div
        aria-label="Gradix product workflow preview"
        style={{ y: yParallax }}
        initial={{ opacity: 0, rotateX: 25, rotateY: -15, scale: 0.9 }}
        whileInView={{ opacity: 1, rotateX: 0, rotateY: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, type: "spring", bounce: 0.3 }}
        className="relative mx-auto w-full max-w-[40rem] transform-gpu"
      >
        {/* Continuous 3D Floating Effect */}
        <motion.div
          animate={{ 
            y: [-10, 10, -10],
            rotateX: [1, -1, 1],
            rotateY: [-1, 1, -1]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#ffffff05] p-5 shadow-[0_0_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-6"
        >
          {/* Inner Glow Orbs */}
          <div className="absolute -left-20 -top-20 size-64 rounded-full bg-[#F97316]/20 blur-[80px]" />
          <div className="absolute -bottom-20 -right-20 size-64 rounded-full bg-blue-500/10 blur-[80px]" />

          <div className="relative grid gap-5 lg:grid-cols-[1.1fr_.8fr]">
            {/* Left Column */}
            <div className="space-y-5">
              <Panel className="relative overflow-hidden">
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-white/[0.02] to-transparent" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#F97316]">
                      Gradix Results
                    </p>
                    <h3 className="mt-2 text-xl font-extrabold text-white">Second Term Results</h3>
                    <p className="text-sm font-medium text-slate-400">JSS 1A · Ready to Publish</p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-400">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex size-2 rounded-full bg-green-500"></span>
                    </span>
                    Ready
                  </span>
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Metric value="32" label="students validated" />
                  <Metric value="8" label="subjects processed" />
                </div>
                
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  {workflow.map((step, index) => (
                    <span className="rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-sm" key={step}>
                      <span className="text-slate-500">{index + 1}.</span> {step}
                    </span>
                  ))}
                </div>
              </Panel>

              <Panel className="lg:ml-6">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[#F97316]/20 bg-gradient-to-br from-[#F97316]/20 to-transparent text-orange-300 shadow-inner">
                    <FileSpreadsheet className="size-5" />
                  </span>
                  <div>
                    <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-orange-300">Excel Upload</p>
                    <p className="mt-1 text-sm leading-snug text-slate-400">Template includes CA, exam, remarks, and comments.</p>
                  </div>
                </div>
              </Panel>

              <div className="grid grid-cols-2 gap-4">
                <FloatingCard delay={0} icon={<BarChart3 className="size-4" />} title="Analytics" text="78% class avg" />
                <FloatingCard delay={1} icon={<LockKeyhole className="size-4" />} title="Secure" text="Private access" />
              </div>
            </div>

            {/* Right Column */}
            <div className="grid gap-5">
              <ReportPreview />
              <PhonePreview />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[1.5rem] border border-white/5 bg-[#0A0F1C]/80 p-5 shadow-2xl backdrop-blur-xl transition-all hover:border-white/10 ${className}`}>
      {children}
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]">
      <p className="text-2xl font-extrabold text-white">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-400">{label}</p>
    </div>
  );
}

function ReportPreview() {
  return (
    <Panel className="relative overflow-hidden">
      <div className="absolute right-0 top-0 size-32 bg-blue-500/10 blur-[40px]" />
      <div className="flex items-center gap-3">
        <span className="size-10 rounded-xl border border-slate-200/20 bg-gradient-to-br from-slate-100 to-slate-300 shadow-inner" />
        <div>
          <p className="text-sm font-bold text-white">Official Report Card</p>
          <p className="text-xs text-slate-400">Signed & Standardized</p>
        </div>
      </div>
      <div className="mt-5 space-y-2 text-xs">
        {["Mathematics · A", "English Language · B", "Basic Science · A"].map((row) => (
          <div className="flex justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 text-slate-300 transition-colors hover:bg-white/[0.05]" key={row}>
            <span className="font-medium">{row.split(" · ")[0]}</span>
            <strong className="text-white">{row.split(" · ")[1]}</strong>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-xl border border-[#F97316]/20 bg-[#F97316]/10 p-3 text-xs leading-relaxed text-orange-100">
        <span className="font-bold text-[#F97316]">Comment:</span> Good performance. Keep improving on English.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-[0.65rem] font-medium uppercase tracking-wider text-slate-500">
        <span className="border-t border-white/10 pt-2">Teacher Sign</span>
        <span className="border-t border-white/10 pt-2">Principal Sign</span>
      </div>
    </Panel>
  );
}

function PhonePreview() {
  return (
    <motion.div 
      animate={{ y: [0, -8, 0] }} 
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      className="relative rounded-[2rem] border-[6px] border-slate-800 bg-slate-900 shadow-2xl shadow-black/50"
    >
      {/* Phone Notch */}
      <div className="absolute left-1/2 top-0 h-4 w-24 -translate-x-1/2 rounded-b-xl bg-slate-800" />
      
      <div className="m-1 rounded-[1.4rem] bg-white p-5 text-[#0F172A]">
        <div className="flex items-center gap-2 text-xs font-bold text-[#2563EB]">
          <Smartphone className="size-4" /> Parent Portal
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">Enter Code</p>
        <div className="mt-2 flex items-center justify-between rounded-xl border-2 border-slate-100 bg-slate-50 px-3 py-2.5 font-mono text-sm font-bold text-slate-700">
          GDX-AB12CD
          <div className="size-2 rounded-full bg-green-500 animate-pulse" />
        </div>
        <button className="mt-4 w-full rounded-xl bg-[#2563EB] py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-transform active:scale-95">
          Check Result
        </button>
      </div>
    </motion.div>
  );
}

function FloatingCard({ icon, title, text, delay }: { icon: React.ReactNode; title: string; text: string, delay: number }) {
  return (
    <motion.div 
      animate={{ y: [0, -6, 0] }} 
      transition={{ repeat: Infinity, duration: 4, delay, ease: "easeInOut" }}
      className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-md"
    >
      <div className="flex items-center gap-2 text-orange-300">
        {icon}
        <span className="text-sm font-bold text-white">{title}</span>
      </div>
      <p className="mt-2 text-xs font-medium text-slate-400">{text}</p>
    </motion.div>
  );
}