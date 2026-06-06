"use client";

import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

import { lookupResultCodeAction } from "@/actions/parent-portal/lookup-result-code-action";
import { normalizeResultCode } from "@/lib/parent-portal/normalize-result-code";

type ResultCodeFormProps = {
  errorMessage?: string;
};

export function ResultCodeForm({ errorMessage }: ResultCodeFormProps) {
  const [code, setCode] = useState("");
  const normalizedCode = normalizeResultCode(code);

  return (
    <motion.form
      action={lookupResultCodeAction}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.35)] sm:p-8"
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <ShieldCheck className="size-7" />
      </div>
      <div className="mt-5 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Check Student Result</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">Enter the result code provided by your school.</p>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{errorMessage}</div>
      ) : null}

      <div className="mt-6 space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="code">
          Result code
        </label>
        <input
          autoComplete="off"
          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center font-mono text-xl font-semibold tracking-[0.16em] text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white"
          id="code"
          name="code"
          onChange={(event) => setCode(normalizeResultCode(event.target.value))}
          placeholder="GRX-AB12CD"
          value={code}
        />
        <p className="text-center text-xs text-slate-500">Formatted preview: {normalizedCode || "GRX-AB12CD"}</p>
      </div>

      <button className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800" type="submit">
        Check Result
        <ArrowRight className="size-4" />
      </button>
    </motion.form>
  );
}
