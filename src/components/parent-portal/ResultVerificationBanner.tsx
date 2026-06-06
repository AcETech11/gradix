import { ShieldCheck } from "lucide-react";

export function ResultVerificationBanner() {
  return (
    <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
      <div className="flex gap-3">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-semibold">Result Verified</p>
          <p className="mt-1 text-sm leading-6">This result was published by the school.</p>
        </div>
      </div>
    </section>
  );
}
