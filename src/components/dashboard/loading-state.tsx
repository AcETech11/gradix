import { Skeleton } from "@/components/ui/skeleton";

type LoadingStateProps = {
  variant?: "dashboard" | "card" | "table";
};

export function CardSkeleton() {
  return <Skeleton className="h-32 rounded-2xl bg-white/10" />;
}

export function TableSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-40 rounded-full bg-white/10" />
        <Skeleton className="h-8 w-24 rounded-full bg-white/10" />
      </div>
      <div className="space-y-3 pt-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton className="h-14 rounded-xl bg-white/10" key={index} />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28 rounded-full bg-white/10" />
        <Skeleton className="h-10 w-full max-w-3xl rounded-full bg-white/10" />
        <Skeleton className="h-5 w-full max-w-2xl rounded-full bg-white/10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <TableSkeleton />
        <TableSkeleton />
      </div>
    </div>
  );
}

export function LoadingState({ variant = "dashboard" }: LoadingStateProps) {
  if (variant === "card") {
    return <CardSkeleton />;
  }

  if (variant === "table") {
    return <TableSkeleton />;
  }

  return <DashboardSkeleton />;
}
