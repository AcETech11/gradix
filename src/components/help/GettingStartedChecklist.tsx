"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

const items = [
  { id: "profile", label: "Set up school profile", href: "/dashboard/settings" },
  { id: "classes", label: "Add classes", href: "/onboarding" },
  { id: "subjects", label: "Add subjects", href: "/onboarding" },
  { id: "students", label: "Add students", href: "/dashboard/students" },
  { id: "template", label: "Download Excel template", href: "/dashboard/templates" },
  { id: "upload", label: "Upload result sheet", href: "/dashboard/uploads" },
  { id: "publish", label: "Publish result", href: "/dashboard/results" },
  { id: "parent", label: "Test parent checker", href: "/results" },
];

export function GettingStartedChecklist() {
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem("gradix-getting-started");
    try {
      // The checklist is client-only state and is restored after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDone(stored ? JSON.parse(stored) : []);
    } catch {
      setDone([]);
    }
  }, []);

  function toggle(id: string) {
    setDone((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      window.localStorage.setItem("gradix-getting-started", JSON.stringify(next));
      return next;
    });
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5">
      <h2 className="text-lg font-semibold text-slate-50">Getting Started</h2>
      <p className="mt-1 text-sm leading-6 text-slate-400">Track the demo-ready setup steps for a new school workspace.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map((item) => {
          const checked = done.includes(item.id);

          return (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3" key={item.id}>
              <button className="flex min-w-0 items-center gap-3 text-left" type="button" onClick={() => toggle(item.id)}>
                {checked ? <CheckCircle2 className="size-5 shrink-0 text-emerald-300" /> : <Circle className="size-5 shrink-0 text-slate-500" />}
                <span className={checked ? "truncate text-sm text-slate-400 line-through" : "truncate text-sm text-slate-100"}>{item.label}</span>
              </button>
              <Link className="shrink-0 text-xs font-semibold text-orange-200 hover:text-orange-100" href={item.href}>
                Open
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
