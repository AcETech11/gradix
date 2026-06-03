"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, School } from "lucide-react";

import { Button } from "@/components/ui/button";

type SuccessCardProps = {
  schoolCode?: string;
};

export function SuccessCard({ schoolCode }: SuccessCardProps) {
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
        <h2 className="text-3xl font-semibold text-slate-950">Your school tenant is ready.</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          The admin account and school record were created successfully. Your next step is onboarding the institution details.
        </p>
      </div>
      {schoolCode ? (
        <div className="mx-auto max-w-sm rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
          <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <School className="size-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-slate-500">School code</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{schoolCode}</p>
        </div>
      ) : null}
      <Button asChild className="h-12 rounded-xl bg-orange-600 px-6 text-white hover:bg-orange-700">
        <Link href="/onboarding">
          Continue to onboarding
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
