import type { PrintableReportData } from "@/lib/pdf/report-types";

import type { PublicResultPayload } from "@/lib/parent-portal/parent-result-types";

export function formatReportData(result: PublicResultPayload): PrintableReportData {
  return {
    ...result,
    printedAt: new Date().toISOString(),
    principalName: result.school.principalName || "Principal",
    principalSignatureUrl: result.school.principalSignatureUrl,
  };
}
