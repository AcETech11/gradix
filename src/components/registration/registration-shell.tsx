import type { ReactNode } from "react";
import { GraduationCap } from "lucide-react";

import { cn } from "@/lib/utils";

type RegistrationShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

export function RegistrationShell({ title, description, children, className }: RegistrationShellProps) {
  return (
    <main className="min-h-dvh overflow-hidden bg-[#071120] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(249,115,22,0.16),transparent_34%,rgba(15,23,42,0.78))]" />
      <div className="relative mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_28rem] lg:px-8">
        <section className="hidden max-w-2xl lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-950/30">
              <GraduationCap className="size-6" aria-hidden="true" />
            </div>
            <span className="text-lg font-semibold">Gradix</span>
          </div>
          <h1 className="text-5xl font-semibold leading-tight text-white">{title}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">{description}</p>
        </section>
        <section
          className={cn(
            "w-full rounded-2xl border border-white/10 bg-white p-5 text-slate-950 shadow-2xl shadow-orange-950/30 transition-all duration-300 sm:p-7",
            className,
          )}
        >
          {children}
        </section>
      </div>
    </main>
  );
}
