"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { BookOpen, Palette, School, ScrollText, ShieldCheck, SlidersHorizontal, UsersRound } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { id: "profile", label: "School Profile", icon: School },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "report", label: "Report Settings", icon: ScrollText },
  { id: "grading", label: "Grading System", icon: SlidersHorizontal },
  { id: "subjects", label: "Subjects", icon: BookOpen },
  { id: "users", label: "User Management", icon: UsersRound },
  { id: "security", label: "Security", icon: ShieldCheck },
] as const;

export type SettingsTabId = (typeof tabs)[number]["id"];

type SettingsTabsProps = {
  sections: Record<SettingsTabId, ReactNode>;
};

export function SettingsTabs({ sections }: SettingsTabsProps) {
  const [active, setActive] = useState<SettingsTabId>("profile");

  return (
    <div className="grid gap-5 xl:grid-cols-[18rem_1fr]">
      <aside className="rounded-2xl border border-white/10 bg-slate-900/75 p-3">
        <select
          className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-100 xl:hidden"
          value={active}
          onChange={(event) => setActive(event.target.value as SettingsTabId)}
        >
          {tabs.map((tab) => (
            <option value={tab.id} key={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
        <nav className="hidden space-y-2 xl:block" aria-label="Settings sections">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition",
                  active === tab.id ? "bg-orange-500 text-slate-950" : "text-slate-300 hover:bg-white/5 hover:text-slate-50",
                )}
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
              >
                <Icon className="size-4" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <div>{sections[active]}</div>
    </div>
  );
}
