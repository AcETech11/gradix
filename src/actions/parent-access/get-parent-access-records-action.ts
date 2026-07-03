"use server";

import { requireCanViewAnalytics } from "@/lib/auth/authorization";
import { calculateAccessStatus, matchesAccessStatus } from "@/lib/parent-access/calculate-access-status";
import { buildStudentName } from "@/lib/parent-access/parent-access-formatters";
import type {
  ParentAccessActivity,
  ParentAccessFilters,
  ParentAccessOverview,
  ParentAccessPageData,
  ParentAccessRecord,
  ParentAccessStatus,
} from "@/lib/parent-access/parent-access-types";
import { createClient } from "@/lib/supabase/server";
import type { SchoolTerm } from "@/types/database";

const termRank: Record<SchoolTerm, number> = {
  first: 1,
  second: 2,
  third: 3,
};

function isTerm(value: unknown): value is SchoolTerm {
  return value === "first" || value === "second" || value === "third";
}

function isStatus(value: unknown): value is ParentAccessStatus {
  return value === "all" || value === "not_checked" || value === "checked" || value === "limit_reached" || value === "no_published_result";
}

function normalizeFilters(input?: unknown): ParentAccessFilters {
  const params = input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  return {
    academicYear: typeof params.academicYear === "string" && params.academicYear ? params.academicYear : undefined,
    term: isTerm(params.term) ? params.term : undefined,
    classId: typeof params.classId === "string" && params.classId ? params.classId : undefined,
    status: isStatus(params.status) ? params.status : "all",
  };
}

function getLatestPublishedGroup(groups: { academic_year: string; term: SchoolTerm; published_at: string | null }[]) {
  return [...groups].sort((first, second) => {
    const yearCompare = second.academic_year.localeCompare(first.academic_year);
    if (yearCompare !== 0) return yearCompare;

    const termCompare = termRank[second.term] - termRank[first.term];
    if (termCompare !== 0) return termCompare;

    return new Date(second.published_at ?? 0).getTime() - new Date(first.published_at ?? 0).getTime();
  })[0];
}

export async function getParentAccessRecordsAction(input?: unknown): Promise<ParentAccessPageData> {
  const profile = await requireCanViewAnalytics();
  const supabase = await createClient();
  const requestedFilters = normalizeFilters(input);

  const [classesResult, publishedResult] = await Promise.all([
    supabase.from("classes").select("id, name").eq("school_id", profile.school_id).eq("is_active", true).order("name"),
    supabase
      .from("results")
      .select("student_id, class_id, term, academic_year, published_at")
      .eq("school_id", profile.school_id)
      .eq("is_published", true),
  ]);

  if (classesResult.error || publishedResult.error) {
    throw new Error(classesResult.error?.message ?? publishedResult.error?.message ?? "Parent access data could not be loaded.");
  }

  const classOptions = classesResult.data ?? [];
  if (requestedFilters.classId && !classOptions.some((schoolClass) => schoolClass.id === requestedFilters.classId)) {
    throw new Error("The selected class was not found in your school workspace.");
  }

  const publishedGroups = publishedResult.data ?? [];
  const latest = getLatestPublishedGroup(publishedGroups);
  const academicYear = requestedFilters.academicYear ?? latest?.academic_year;
  const term = requestedFilters.term ?? latest?.term;
  const status = requestedFilters.status ?? "all";

  const academicYears = Array.from(new Set(publishedGroups.map((result) => result.academic_year))).sort().reverse();
  const termOptions = Array.from(new Set(publishedGroups.map((result) => result.term))).sort((first, second) => termRank[first] - termRank[second]);

  if (!academicYear || !term) {
    return {
      profile: { id: profile.id, role: profile.role, schoolId: profile.school_id },
      filters: { academicYear, term, classId: requestedFilters.classId, status },
      overview: { totalViews: 0, studentsChecked: 0, studentsNotChecked: 0, limitReached: 0, activeResultCodes: 0 },
      records: [],
      recentActivity: [],
      classOptions,
      academicYears,
      termOptions,
      hasPublishedResults: false,
    };
  }

  const publishedForFilter = publishedGroups.filter(
    (result) =>
      result.academic_year === academicYear &&
      result.term === term &&
      (!requestedFilters.classId || result.class_id === requestedFilters.classId),
  );
  const publishedStudentIds = Array.from(new Set(publishedForFilter.map((result) => result.student_id)));

  const [studentsResult, accessResult] = await Promise.all([
    publishedStudentIds.length > 0
      ? supabase
          .from("students")
          .select("id, permanent_code, admission_number, first_name, middle_name, last_name, class_id")
          .eq("school_id", profile.school_id)
          .in("id", publishedStudentIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("code_term_access")
      .select("id, student_id, result_code, term, academic_year, use_count, max_uses, last_used_at")
      .eq("school_id", profile.school_id)
      .eq("term", term)
      .eq("academic_year", academicYear)
      .eq("is_active", true),
  ]);

  if (studentsResult.error || accessResult.error) {
    throw new Error(studentsResult.error?.message ?? accessResult.error?.message ?? "Parent access data could not be loaded.");
  }

  const classesById = new Map(classOptions.map((schoolClass) => [schoolClass.id, schoolClass.name]));
  const accessByStudentId = new Map((accessResult.data ?? []).map((access) => [access.student_id, access]));
  const records = (studentsResult.data ?? [])
    .map<ParentAccessRecord>((student) => {
      const access = accessByStudentId.get(student.id);
      const viewsUsed = access?.use_count ?? 0;
      const maxViews = access ? access.max_uses : 10;
      const viewsRemaining = maxViews === null ? null : Math.max(maxViews - viewsUsed, 0);

      return {
        studentId: student.id,
        studentName: buildStudentName(student),
        studentCode: student.permanent_code,
        admissionNumber: student.admission_number,
        classId: student.class_id,
        className: student.class_id ? classesById.get(student.class_id) ?? "Class" : "Unassigned",
        term,
        academicYear,
        viewsUsed,
        maxViews,
        viewsRemaining,
        lastCheckedAt: access?.last_used_at ?? null,
        status: calculateAccessStatus({ hasPublishedResult: true, viewsUsed, maxViews }),
        accessId: access?.id ?? null,
      };
    })
    .filter((record) => matchesAccessStatus(record, status));

  const overview: ParentAccessOverview = {
    totalViews: records.reduce((sum, record) => sum + record.viewsUsed, 0),
    studentsChecked: records.filter((record) => record.viewsUsed > 0).length,
    studentsNotChecked: records.filter((record) => record.status === "not_checked").length,
    limitReached: records.filter((record) => record.status === "limit_reached").length,
    activeResultCodes: records.filter((record) => record.studentCode).length,
  };

  const recentActivity: ParentAccessActivity[] = records
    .filter((record): record is ParentAccessRecord & { lastCheckedAt: string } => Boolean(record.lastCheckedAt))
    .sort((first, second) => new Date(second.lastCheckedAt).getTime() - new Date(first.lastCheckedAt).getTime())
    .slice(0, 8)
    .map((record) => ({
      studentId: record.studentId,
      studentName: record.studentName,
      studentCode: record.studentCode,
      className: record.className,
      term: record.term,
      academicYear: record.academicYear,
      useCount: record.viewsUsed,
      lastCheckedAt: record.lastCheckedAt,
    }));

  return {
    profile: { id: profile.id, role: profile.role, schoolId: profile.school_id },
    filters: { academicYear, term, classId: requestedFilters.classId, status },
    overview,
    records,
    recentActivity,
    classOptions,
    academicYears,
    termOptions,
    hasPublishedResults: publishedGroups.length > 0,
  };
}
