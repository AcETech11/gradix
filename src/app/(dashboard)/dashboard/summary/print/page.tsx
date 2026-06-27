import { DashboardSummaryPrint } from "@/components/dashboard/dashboard-summary-print";
import { getDashboardSummaryData } from "@/lib/dashboard/dashboard-summary";

export default async function DashboardSummaryPrintPage() {
  const summary = await getDashboardSummaryData();

  return <DashboardSummaryPrint summary={summary} />;
}
