import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AuthProfile, AuthSchool } from "@/types/auth";

export function SecuritySettings({ profile, school }: { profile: AuthProfile; school: AuthSchool }) {
  return (
    <section className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/75 p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Security</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">Basic account and workspace security information.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Info label="Current user" value={profile.full_name} />
        <Info label="Role" value={profile.role} />
        <Info label="School workspace" value={school.name} />
        <Info label="Account status" value={profile.is_active ? "Active" : "Inactive"} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" variant="outline">
          <Link href="/forgot-password">Send password reset link</Link>
        </Button>
        <Button className="border-white/10 bg-white/5 text-slate-400" disabled type="button" variant="outline">
          Logout all sessions soon
        </Button>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <strong className="mt-2 block text-slate-50">{value}</strong>
    </div>
  );
}
