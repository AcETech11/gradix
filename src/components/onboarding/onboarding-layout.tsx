import type { ReactNode } from "react";
import { GraduationCap } from "lucide-react";

type OnboardingLayoutProps = {
  children: ReactNode;
};

export function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <main className="min-h-dvh bg-[#071120] text-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(249,115,22,0.16),transparent_34%,rgba(15,23,42,0.78))]" />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-950/30">
              <GraduationCap className="size-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-base font-semibold">Gradix onboarding</p>
              <p className="text-sm text-slate-300">Configure your school workspace</p>
            </div>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
