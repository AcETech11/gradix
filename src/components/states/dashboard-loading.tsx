import { Skeleton } from "@/components/ui/skeleton";

export function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-full max-w-lg" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton className="h-28" key={index} />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
