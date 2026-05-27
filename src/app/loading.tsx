import { DashboardLoading } from "@/components/states/dashboard-loading";

export default function Loading() {
  return (
    <main className="min-h-dvh bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <DashboardLoading />
      </div>
    </main>
  );
}
