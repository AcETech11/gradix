import { LoaderCircle } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

export function AuthSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function AuthPageSkeleton() {
  return (
    <main className="min-h-dvh bg-[#08111f] px-4 py-8 text-white">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_28rem]">
        <div className="hidden space-y-5 lg:block">
          <Skeleton className="h-5 w-28 bg-white/10" />
          <Skeleton className="h-14 w-96 bg-white/10" />
          <Skeleton className="h-6 w-[32rem] bg-white/10" />
        </div>
        <div className="rounded-lg border border-white/10 bg-white p-6 shadow-2xl shadow-orange-950/30">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-72" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
