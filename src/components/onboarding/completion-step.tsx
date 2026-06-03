"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CheckCircle2, School } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { OnboardingClass, OnboardingSubject } from "@/types/onboarding";

type CompletionStepProps = {
  schoolName: string;
  schoolCode: string;
  classes: OnboardingClass[];
  subjects: OnboardingSubject[];
};

export function CompletionStep({ schoolName, schoolCode, classes, subjects }: CompletionStepProps) {
  return (
    <div className="space-y-7 text-center">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 15 }}
        className="mx-auto flex size-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
      >
        <CheckCircle2 className="size-12" aria-hidden="true" />
      </motion.div>
      <div>
        <h2 className="text-3xl font-semibold text-slate-950">Your school workspace is ready.</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          Gradix has the institution profile, branding, classes, subjects, and class-subject relationships needed for onboarding.
        </p>
      </div>
      <div className="grid gap-3 text-left sm:grid-cols-3">
        <SummaryCard label="School" value={schoolName || "Configured"} detail={schoolCode} />
        <SummaryCard label="Classes" value={String(classes.length)} detail="Active class rows" />
        <SummaryCard label="Subjects" value={String(subjects.length)} detail="Assigned subjects" />
      </div>
      <Button asChild className="h-12 rounded-xl bg-orange-600 px-6 text-white hover:bg-orange-700">
        <Link href="/dashboard">Go to Dashboard</Link>
      </Button>
    </div>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
        <School className="size-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
      {detail ? <p className="mt-1 text-sm text-slate-500">{detail}</p> : null}
    </div>
  );
}
