import Link from "next/link";
import { ArrowRight, Home, LayoutDashboard, SearchCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-dvh bg-[#06111f] px-4 py-8 text-slate-50">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-5xl items-center justify-center">
        <section className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-slate-950/40 backdrop-blur sm:p-10">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:36px_36px]" />
          <div className="absolute -right-28 -top-28 size-64 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="flex aspect-square max-w-xs items-center justify-center rounded-3xl border border-orange-400/20 bg-orange-500/10 text-orange-200">
              <SearchCheck className="size-24" aria-hidden="true" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Gradix</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">Page not found</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                The page you&apos;re looking for doesn&apos;t exist or may have been moved.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild className="bg-orange-500 text-slate-950 hover:bg-orange-400">
                  <Link href="/">
                    <Home className="size-4" />
                    Go Home
                  </Link>
                </Button>
                <Button asChild className="border-white/10 bg-white/5 text-white hover:bg-white/10" variant="outline">
                  <Link href="/dashboard">
                    <LayoutDashboard className="size-4" />
                    Go to Dashboard
                  </Link>
                </Button>
                <Button asChild className="border-white/10 bg-white/5 text-white hover:bg-white/10" variant="outline">
                  <Link href="/results">
                    Parent Result Checker
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
