"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const links = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "Workflow" },
  { href: "#pricing", label: "Pricing" },
  { href: "/demo", label: "Demo" },
];

export function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070D1A]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link className="text-xl font-extrabold tracking-tight text-white" href="/">
          Gradix<span className="text-[#F97316]">.ng</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-300 md:flex">
          {links.map((link) => (
            <Link className="transition hover:text-white" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Button asChild className="border-white/10 bg-white/5 text-white hover:bg-white/10" variant="outline">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="bg-[#F97316] text-white hover:bg-[#EA580C]">
            <Link href="/demo">Book a Demo</Link>
          </Button>
        </div>
        <button className="rounded-xl border border-white/10 p-2 text-white md:hidden" type="button" onClick={() => setOpen((value) => !value)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-white/10 bg-[#0B1220] px-4 py-4 md:hidden">
          <nav className="grid gap-2 text-sm font-semibold text-slate-200">
            {links.map((link) => (
              <Link className="rounded-xl px-3 py-3 hover:bg-white/5" href={link.href} key={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link className="rounded-xl px-3 py-3 hover:bg-white/5" href="/login" onClick={() => setOpen(false)}>
              Login
            </Link>
            <Button asChild className="mt-2 bg-[#F97316] text-white hover:bg-[#EA580C]">
              <Link href="/demo" onClick={() => setOpen(false)}>
                Book a Demo
              </Link>
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
