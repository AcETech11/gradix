import { Skeleton } from "@/components/ui/skeleton";

export default function TemplatesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28 rounded-full bg-white/10" />
        <Skeleton className="h-10 w-full max-w-3xl rounded-full bg-white/10" />
        <Skeleton className="h-5 w-full max-w-2xl rounded-full bg-white/10" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Skeleton className="h-96 rounded-2xl bg-white/10" />
        <Skeleton className="h-80 rounded-2xl bg-white/10" />
      </div>
      <Skeleton className="h-64 rounded-2xl bg-white/10" />
    </div>
  );
}
