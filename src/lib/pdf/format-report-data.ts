import type { PrintableReportData } from "@/lib/pdf/report-types";

import type { PublicResultPayload } from "@/lib/parent-portal/parent-result-types";
import { DEFAULT_GRADING_SCALE } from "@/lib/settings/default-grading-scale";
import { DEFAULT_REPORT_SETTINGS } from "@/lib/settings/report-settings-defaults";
import { getPerformanceBand } from "@/lib/results/performance-scale";
import { resolveClassTeacherSignatureUrl, resolvePrincipalSignatureUrl, resolveSchoolLogoUrl, resolveSchoolSealUrl } from "@/lib/reports/report-assets";

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
  const school = {
    ...result.school,
    logoUrl: resolveSchoolLogoUrl(result.school) ?? null,
    sealUrl: resolveSchoolSealUrl(result.school) ?? null,
  };

  return {
    ...result,
    school,
    printedAt: new Date().toISOString(),
    principalName: school.principalName || "Principal / Head Teacher",
    principalSignatureUrl: resolvePrincipalSignatureUrl(school),
    classTeacherName: result.result.classTeacherName || "Class Teacher",
    classTeacherSignatureUrl: resolveClassTeacherSignatureUrl({ classTeacherSignatureUrl: result.result.classTeacherSignatureUrl ?? null }),
    classTeacherComment: result.result.classTeacherComment || reportSettings.classTeacherComment || defaultTeacherComment(result),
    reportSettings,
    gradingScale: result.school.gradingScale?.length ? result.school.gradingScale : DEFAULT_GRADING_SCALE,
  };
}
