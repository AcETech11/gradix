"use client";

import Image from "next/image";
import Link from "next/link";
import { Copy, ExternalLink, GraduationCap } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type ParentPortalCardProps = {
  schoolName: string;
  schoolSlug: string | null;
  logoUrl: string | null;
  portalLink: string | null;
  canManageSettings: boolean;
};

export function ParentPortalCard({ canManageSettings, logoUrl, portalLink, schoolName, schoolSlug }: ParentPortalCardProps) {
  const [message, setMessage] = useState("");

  async function copyPortalLink() {
    if (!portalLink) return;

    await navigator.clipboard.writeText(portalLink);
    setMessage("Portal link copied");
    window.setTimeout(() => setMessage(""), 2200);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
      <div className="flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-orange-200">
          {logoUrl ? <Image alt="" className="size-full rounded-2xl object-cover" height={56} src={logoUrl} unoptimized width={56} /> : <GraduationCap className="size-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-orange-200">Parent Result Portal</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-50">{schoolName}</h2>
          <p className="mt-1 text-sm text-slate-400">Official Result Verification Portal</p>
        </div>
      </div>

      {portalLink && schoolSlug ? (
        <>
          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/70 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Portal link</p>
            <p className="mt-2 truncate font-mono text-sm text-slate-100">{portalLink}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" onClick={copyPortalLink} type="button" variant="outline">
              <Copy className="size-4" />
              Copy Portal Link
            </Button>
            <Button asChild className="bg-orange-500 text-slate-950 hover:bg-orange-400">
              <Link href={portalLink} target="_blank">
                <ExternalLink className="size-4" />
                Open Portal
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-slate-400">School Slug: {schoolSlug}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">Share this link with parents so they can check published results using the student result code.</p>
          <p className="mt-2 text-xs font-medium text-emerald-300">{message || "Your school-branded result portal is ready."}</p>
        </>
      ) : (
        <div className="mt-5 rounded-2xl border border-orange-300/20 bg-orange-500/10 p-4">
          <p className="text-sm font-semibold text-orange-100">Your school portal is not ready yet.</p>
          <p className="mt-2 text-sm leading-6 text-orange-50/80">Add a valid school slug before sharing parent result links.</p>
          {canManageSettings ? (
            <Button asChild className="mt-4 bg-orange-500 text-slate-950 hover:bg-orange-400">
              <Link href="/dashboard/settings">Open Settings</Link>
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
