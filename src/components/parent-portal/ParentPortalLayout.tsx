import type { ReactNode } from "react";
import Image from "next/image";
import { GraduationCap, ShieldCheck } from "lucide-react";

import type { PublicSchoolPortal } from "@/lib/parent-portal/school-portal";

export function ParentPortalLayout({ children, school }: { children: ReactNode; school?: PublicSchoolPortal | null }) {
  const isBranded = Boolean(school);

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm">
              {school?.logoUrl ? (
                <Image alt="" className="size-full rounded-2xl object-cover" height={48} src={school.logoUrl} unoptimized width={48} />
              ) : (
                <GraduationCap className="size-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{school?.name ?? "Gradix"}</p>
              <p className="truncate text-xs text-slate-500">{isBranded ? "Official Result Verification Portal" : "Verified school results"}</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm sm:flex">
            <ShieldCheck className="size-4" />
            Secure school result verification
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center py-8">{children}</div>
      </div>
    </main>
  );
}
