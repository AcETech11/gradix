import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-dvh bg-[#071120] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <Skeleton className="h-14 w-64 bg-white/10" />
        <Skeleton className="h-36 rounded-2xl bg-white/10" />
        <Skeleton className="h-[32rem] rounded-2xl bg-white/10" />
      </div>
    </main>
  );
}
