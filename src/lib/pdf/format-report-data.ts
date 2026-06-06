import type { PrintableReportData } from "@/lib/pdf/report-types";

import type { PublicResultPayload } from "@/lib/parent-portal/parent-result-types";
import { DEFAULT_GRADING_SCALE } from "@/lib/settings/default-grading-scale";
import { DEFAULT_REPORT_SETTINGS } from "@/lib/settings/report-settings-defaults";
import { getPerformanceBand } from "@/lib/results/performance-scale";

function defaultTeacherComment(result: PublicResultPayload) {
  const total = result.result.rows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const average = result.result.rows.length ? total / result.result.rows.length : 0;

  return getPerformanceBand(average).remark;
}

export function formatReportData(result: PublicResultPayload): PrintableReportData {
  const reportSettings = {
    ...DEFAULT_REPORT_SETTINGS,
    ...(result.school.reportSettings ?? {}),
  };

  return {
    ...result,
    printedAt: new Date().toISOString(),
    principalName: result.school.principalName || "Principal",
    principalSignatureUrl: result.school.principalSignatureUrl,
    classTeacherName: result.result.classTeacherName || "Class Teacher",
    classTeacherSignatureUrl: result.result.classTeacherSignatureUrl ?? null,
    classTeacherComment: result.result.classTeacherComment || reportSettings.classTeacherComment || defaultTeacherComment(result),
    reportSettings,
    gradingScale: result.school.gradingScale?.length ? result.school.gradingScale : DEFAULT_GRADING_SCALE,
  };
}
