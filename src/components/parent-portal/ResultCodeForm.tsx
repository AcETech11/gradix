"use client";

import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { lookupResultCodeAction } from "@/actions/parent-portal/lookup-result-code-action";
import { normalizeResultCode } from "@/lib/parent-portal/normalize-result-code";
import type { PublicSchoolPortal } from "@/lib/parent-portal/school-portal";

type ResultCodeFormProps = {
  errorMessage?: string;
  school?: PublicSchoolPortal | null;
  routeScope?: "path" | "host" | "generic";
};

export function ResultCodeForm({ errorMessage, school, routeScope = "generic" }: ResultCodeFormProps) {
  const [code, setCode] = useState("");
  const isBranded = Boolean(school);

  return (
    <form
      action={lookupResultCodeAction}
      className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.38)] sm:p-8"
    >
      <input name="schoolSlug" type="hidden" value={school?.slug ?? ""} />
      <input name="routeScope" type="hidden" value={routeScope} />
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-900">
        <ShieldCheck className="size-7" />
      </div>
      <div className="mt-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
          {isBranded ? "Official Result Verification Portal" : "Secure Result Verification"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Check Student Result</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          {school ? `Enter the result code issued by ${school.name}.` : "Enter the result code provided by your school. Only published results can be viewed."}
        </p>
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
          className="h-13 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          id="code"
          name="code"
          onChange={(event) => setCode(normalizeResultCode(event.target.value))}
          placeholder="Enter your student result code"
          value={code}
        />
        <p className="text-xs text-slate-500">Example: GDXDE-4DBBC1FBB8</p>
      </div>

      <button className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-100" type="submit">
        Check Result
        <ArrowRight className="size-4" />
      </button>
      <p className="mt-5 text-center text-xs leading-5 text-slate-500">
        {school ? "Securely powered by Gradix" : "Secure school result verification powered by Gradix"}
      </p>
    </form>
  );
}
