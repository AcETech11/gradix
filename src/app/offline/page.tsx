import { WifiOff } from "lucide-react";

import { ReloadPageButton } from "@/components/pwa/reload-page-button";

export const metadata = {
  title: "You are offline",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#070d1a] px-4 py-10 text-slate-50">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl shadow-slate-950/40 sm:p-8">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-200">
          <WifiOff className="size-6" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">You are offline</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Gradix needs an internet connection to load live school data. Please reconnect and try again.
        </p>
        <ReloadPageButton />
      </section>
    </main>
  );
}
