import type { PrintableReportData } from "@/lib/pdf/report-types";

import type { PublicResultPayload } from "@/lib/parent-portal/parent-result-types";
import { DEFAULT_GRADING_SCALE } from "@/lib/settings/default-grading-scale";
import { DEFAULT_REPORT_SETTINGS, type ReportSettings } from "@/lib/settings/report-settings-defaults";
import { getPerformanceBand } from "@/lib/results/performance-scale";
import { isReportFormat, sanitizeRatingMap } from "@/lib/reports/primary-report";
import { resolveClassTeacherSignatureUrl, resolvePrincipalSignatureUrl, resolveSchoolLogoUrl, resolveSchoolSealUrl } from "@/lib/reports/report-assets";

function defaultTeacherComment(result: PublicResultPayload) {
  const total = result.result.rows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const average = result.result.rows.length ? total / result.result.rows.length : 0;

  return getPerformanceBand(average).remark;
}

function getRawReportSetting(settings: unknown, key: string) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return undefined;

  return (settings as Record<string, unknown>)[key];
}

function hasComprehensiveData(result: PublicResultPayload) {
  const resultRecord = result.result as unknown as Record<string, unknown>;
  const attendance = result.result.attendance ?? getRecordValue(resultRecord, ["attendance"]);
  const affectiveDomain = sanitizeRatingMap(getRecordValue(resultRecord, ["affectiveDomain", "affective_domain"]));
  const psychomotorDomain = sanitizeRatingMap(getRecordValue(resultRecord, ["psychomotorDomain", "psychomotor_domain"]));

  return Boolean(
    attendance ||
      Object.keys(affectiveDomain).length > 0 ||
      Object.keys(psychomotorDomain).length > 0,
  );
}

function getRecordValue<T>(record: Record<string, unknown>, keys: string[]): T | null {
  for (const key of keys) {
    const value = record[key];

    if (value !== undefined && value !== null) {
      return value as T;
    }
  }

  return null;
}

function normalizeAttendance(result: PublicResultPayload) {
  const resultRecord = result.result as unknown as Record<string, unknown>;
  const rawAttendance = result.result.attendance as Record<string, unknown> | null | undefined;
  const attendance = rawAttendance && typeof rawAttendance === "object" ? rawAttendance : {};

  return {
    schoolOpenDays: getRecordValue<number>(attendance, ["schoolOpenDays", "school_open_days"]) ?? getRecordValue<number>(resultRecord, ["schoolOpenDays", "school_open_days"]) ?? null,
    daysPresent: getRecordValue<number>(attendance, ["daysPresent", "days_present", "attendancePresent", "attendance_present"]) ?? getRecordValue<number>(resultRecord, ["attendancePresent", "attendance_present"]) ?? null,
    daysAbsent: getRecordValue<number>(attendance, ["daysAbsent", "days_absent", "attendanceAbsent", "attendance_absent"]) ?? getRecordValue<number>(resultRecord, ["attendanceAbsent", "attendance_absent"]) ?? null,
    termEndsOn: getRecordValue<string>(attendance, ["termEndsOn", "term_ends_on"]) ?? getRecordValue<string>(resultRecord, ["termEndsOn", "term_ends_on"]) ?? null,
    nextTermBeginsOn: getRecordValue<string>(attendance, ["nextTermBeginsOn", "next_term_begins_on"]) ?? getRecordValue<string>(resultRecord, ["nextTermBeginsOn", "next_term_begins_on"]) ?? null,
  };
}

function normalizeReportSettings(result: PublicResultPayload): ReportSettings {
  const rawSettings = result.school.reportSettings ?? {};
  const rawFormat =
    getRawReportSetting(rawSettings, "reportFormat") ??
    getRawReportSetting(rawSettings, "report_format") ??
    getRawReportSetting(rawSettings, "format") ??
    getRawReportSetting(rawSettings, "reportType") ??
    getRawReportSetting(rawSettings, "report_type");
  const normalizedFormat =
    rawFormat === "comprehensive-primary" || rawFormat === "comprehensivePrimary" || rawFormat === "primary_comprehensive"
      ? "comprehensive_primary"
      : rawFormat;
  const reportFormat = isReportFormat(normalizedFormat)
    ? normalizedFormat
    : hasComprehensiveData(result)
      ? "comprehensive_primary"
      : DEFAULT_REPORT_SETTINGS.reportFormat;
  const merged = {
    ...DEFAULT_REPORT_SETTINGS,
    ...rawSettings,
    reportFormat,
  };

  if (reportFormat === "comprehensive_primary") {
    return {
      ...merged,
      showAttendanceRecord: true,
      showAffectiveDomain: true,
      showPsychomotorDomain: true,
      showRatingScale: true,
    };
  }

  return merged;
}

export function formatReportData(result: PublicResultPayload): PrintableReportData {
  const reportSettings = normalizeReportSettings(result);
  const resultRecord = result.result as unknown as Record<string, unknown>;
  const attendance = normalizeAttendance(result);
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
    principalComment: reportSettings.principalComment.trim(),
    classTeacherName: result.result.classTeacherName || "Class Teacher",
    classTeacherSignatureUrl: resolveClassTeacherSignatureUrl({ classTeacherSignatureUrl: result.result.classTeacherSignatureUrl ?? null }),
    classTeacherComment: result.result.classTeacherComment || reportSettings.classTeacherComment || defaultTeacherComment(result),
    reportSettings,
    gradingScale: result.school.gradingScale?.length ? result.school.gradingScale : DEFAULT_GRADING_SCALE,
    comprehensive: {
      schoolOpenDays: attendance.schoolOpenDays,
      attendancePresent: attendance.daysPresent,
      attendanceAbsent: attendance.daysAbsent,
      termEndsOn: attendance.termEndsOn,
      nextTermBeginsOn: attendance.nextTermBeginsOn,
      affectiveDomain: sanitizeRatingMap(getRecordValue(resultRecord, ["affectiveDomain", "affective_domain"])),
      psychomotorDomain: sanitizeRatingMap(getRecordValue(resultRecord, ["psychomotorDomain", "psychomotor_domain"])),
    },
  };
}
