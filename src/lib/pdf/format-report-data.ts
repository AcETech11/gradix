import type { PrintableReportData } from "@/lib/pdf/report-types";

import type { PublicResultPayload } from "@/lib/parent-portal/parent-result-types";
import { DEFAULT_GRADING_SCALE } from "@/lib/settings/default-grading-scale";
import { DEFAULT_REPORT_SETTINGS } from "@/lib/settings/report-settings-defaults";

export function formatReportData(result: PublicResultPayload): PrintableReportData {
  return {
    ...result,
    printedAt: new Date().toISOString(),
    principalName: result.school.principalName || "Principal",
    principalSignatureUrl: result.school.principalSignatureUrl,
    reportSettings: {
      ...DEFAULT_REPORT_SETTINGS,
      ...(result.school.reportSettings ?? {}),
    },
    gradingScale: result.school.gradingScale?.length ? result.school.gradingScale : DEFAULT_GRADING_SCALE,
  };
}
