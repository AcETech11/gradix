import { Skeleton } from "@/components/ui/skeleton";

export function StudentTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-5">
      <div className="hidden space-y-3 lg:block">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton className="h-14 rounded-xl bg-white/10" key={index} />
        ))}
      </div>
      <div className="grid gap-3 lg:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton className="h-28 rounded-2xl bg-white/10" key={index} />
        ))}
      </div>
    </div>
  );
}

export function StudentFormSkeleton() {
  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton className="h-11 rounded-xl bg-white/10" key={index} />
      ))}
    </div>
  );
}

export function StudentProfileSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <Skeleton className="h-96 rounded-2xl bg-white/10" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-24 rounded-2xl bg-white/10" key={index} />
        ))}
      </div>
    </div>
  );
}
