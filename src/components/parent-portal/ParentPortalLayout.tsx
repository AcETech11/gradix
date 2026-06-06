import type { ReactNode } from "react";
import { GraduationCap, ShieldCheck } from "lucide-react";

export function ParentPortalLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7faf8] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-200">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <p className="text-lg font-semibold">Gradix</p>
              <p className="text-xs text-slate-500">Verified school results</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-700 shadow-sm sm:flex">
            <ShieldCheck className="size-4" />
            Secure result lookup
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center py-8">{children}</div>
      </div>
    </main>
  );
}
