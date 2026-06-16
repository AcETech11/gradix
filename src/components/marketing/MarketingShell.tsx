import Link from "next/link";
import type { ReactNode } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";

const links = [
  { label: "Features", href: "/#features" },
  { label: "Workflow", href: "/#workflow" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Demo", href: "/demo" },
];

export function MarketingShell({ children, variant = "light" }: { children: ReactNode; variant?: "light" | "dark" }) {
  const dark = variant === "dark";

  return (
    <div className={dark ? "min-h-dvh bg-[#050b16] text-slate-950" : "min-h-dvh bg-[#f8fafc] text-slate-950"}>
      <header className={dark ? "sticky top-0 z-30 border-b border-white/10 bg-[#050b16]/85 backdrop-blur" : "sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur"}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link className={dark ? "text-xl font-extrabold text-white" : "text-xl font-extrabold text-[#071225]"} href="/">
            Gradix
          </Link>
          <nav className={dark ? "hidden items-center gap-6 text-sm font-semibold text-slate-300 md:flex" : "hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex"}>
            {links.map((link) => (
              <Link className="transition hover:text-orange-400" href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild className={dark ? "hidden border-white/10 bg-white/5 text-white hover:bg-white/10 sm:inline-flex" : "hidden border-slate-200 sm:inline-flex"} variant="outline">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className={dark ? "bg-orange-500 text-slate-950 hover:bg-orange-400" : "bg-orange-600 text-white hover:bg-orange-700"}>
              <Link href="/demo">Book a Demo</Link>
            </Button>
            <details className="group relative md:hidden">
              <summary className={dark ? "flex size-10 cursor-pointer list-none items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white" : "flex size-10 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900"}>
                <Menu className="size-5" />
              </summary>
              <div className={dark ? "absolute right-0 mt-3 w-52 rounded-2xl border border-white/10 bg-[#071225] p-2 shadow-2xl" : "absolute right-0 mt-3 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"}>
                {[...links, { label: "Login", href: "/login" }].map((link) => (
                  <Link className={dark ? "block rounded-xl px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10" : "block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"} href={link.href} key={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </details>
          </div>
        </div>
      </header>
      {children}
      <footer className={dark ? "border-t border-white/10 bg-[#050b16]" : "border-t border-slate-200 bg-white"}>
        <div className={dark ? "mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-slate-400 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8" : "mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8"}>
          <div>
            <p className={dark ? "font-semibold text-white" : "font-semibold text-slate-900"}>Gradix.ng</p>
            <p className="mt-1 max-w-xl">Online result checker for schools, Excel result upload, report cards, parent access, and audit-ready workflows.</p>
            <p className="mt-2 text-xs">Copyright {new Date().getFullYear()} Gradix. All rights reserved.</p>
          </div>
          <nav className="flex flex-wrap gap-4 font-semibold">
            {links.map((link) => (
              <Link className="hover:text-orange-400" href={link.href} key={link.href}>{link.label}</Link>
            ))}
            <Link className="hover:text-orange-400" href="/login">Login</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export function MarketingSection({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}>{children}</section>;
}

export function PricingCards() {
  const plans = [
    {
      name: "Starter",
      price: "NGN 60,000 / term",
      limit: "Up to 300 students",
      features: ["Excel result upload", "Parent result checker", "PDF report cards", "Basic school branding", "Parent access limit/reset", "Student records", "Template download"],
    },
    {
      name: "Standard",
      price: "NGN 90,000 / term",
      limit: "Up to 700 students",
      badge: "Recommended",
      features: ["Everything in Starter", "Analytics dashboard", "Audit logs", "Parent access monitoring", "Custom report card settings", "Teacher/principal signatures", "Class teacher comments", "Priority setup support"],
    },
    {
      name: "Premium",
      price: "NGN 150,000+ / term",
      limit: "Up to 1,500+ students",
      features: ["Everything in Standard", "Larger student capacity", "Custom report format support", "Data migration assistance", "Dedicated onboarding", "Priority support"],
    },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {plans.map((plan) => (
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-950/5" key={plan.name}>
          {plan.badge ? <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">{plan.badge}</span> : null}
          <h3 className="mt-4 text-2xl font-extrabold text-[#071225]">{plan.name}</h3>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{plan.price}</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{plan.limit}</p>
          <ul className="mt-6 grid gap-3 text-sm text-slate-700">
            {plan.features.map((feature) => (
              <li className="flex gap-2" key={feature}>
                <span className="mt-1 size-2 rounded-full bg-orange-500" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
