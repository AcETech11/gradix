"use server";

import { requireAdminOrHeadmaster } from "@/lib/auth/authorization";
import { getCurrentAcademicYear } from "@/lib/onboarding/utils";
import { buildStudentName } from "@/lib/parent-access/parent-access-formatters";
import type { PromotionActivity, PromotionClassOption, PromotionPageData, PromotionStudent } from "@/lib/promotion/promotion-types";
import { promotionQuerySchema } from "@/lib/promotion/promotion-validation";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

function nextAcademicYear(year: string) {
  const [start, end] = year.split("/").map((part) => Number(part));

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return getCurrentAcademicYear();
  }

  return `${start + 1}/${end + 1}`;
}

function getDetails(value: Json): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export async function getPromotionOverviewAction(input?: unknown): Promise<PromotionPageData> {
  const profile = await requireAdminOrHeadmaster();
  const supabase = await createClient();
  const parsed = promotionQuerySchema.safeParse(input);
  const query = parsed.success ? parsed.data : {};

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, name, academic_year")
    .eq("school_id", profile.school_id)
    .eq("is_active", true)
    .order("academic_year", { ascending: false })
    .order("name");

  if (classesError) {
    throw new Error(classesError.message);
  }

  const currentAcademicYear = query.fromAcademicYear ?? classes?.[0]?.academic_year ?? getCurrentAcademicYear();
  const toAcademicYear = query.toAcademicYear ?? nextAcademicYear(currentAcademicYear);
  const fromClassId = query.fromClassId ?? classes?.find((schoolClass) => schoolClass.academic_year === currentAcademicYear)?.id ?? classes?.[0]?.id ?? "";
  const toClassId = query.toClassId ?? "";
  const classIds = (classes ?? []).map((schoolClass) => schoolClass.id);

  const [studentsCountResult, classStudentCountsResult, selectedStudentsResult, targetEnrollmentsResult, auditResult] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", profile.school_id).eq("is_active", true),
    classIds.length
      ? supabase.from("students").select("class_id").eq("school_id", profile.school_id).eq("is_active", true).in("class_id", classIds)
      : Promise.resolve({ data: [], error: null }),
    fromClassId
      ? supabase
          .from("students")
          .select("id, permanent_code, first_name, middle_name, last_name, class_id, status, is_active")
          .eq("school_id", profile.school_id)
          .eq("class_id", fromClassId)
          .in("status", ["active", "repeated"])
          .order("last_name")
          .order("first_name")
      : Promise.resolve({ data: [], error: null }),
    fromClassId
      ? supabase
          .from("student_class_enrollments")
          .select("student_id")
          .eq("school_id", profile.school_id)
          .eq("academic_year", toAcademicYear)
          .in("status", ["active", "repeated"])
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("audit_logs")
      .select("id, action, details, created_at")
      .eq("school_id", profile.school_id)
      .eq("table_name", "student_class_enrollments")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (
    studentsCountResult.error ||
    classStudentCountsResult.error ||
    selectedStudentsResult.error ||
    targetEnrollmentsResult.error ||
    auditResult.error
  ) {
    throw new Error(
      studentsCountResult.error?.message ??
        classStudentCountsResult.error?.message ??
        selectedStudentsResult.error?.message ??
        targetEnrollmentsResult.error?.message ??
        auditResult.error?.message ??
        "Promotion data could not be loaded.",
    );
  }

  const countsByClass = new Map<string, number>();
  for (const row of classStudentCountsResult.data ?? []) {
    if (row.class_id) {
      countsByClass.set(row.class_id, (countsByClass.get(row.class_id) ?? 0) + 1);
    }
  }

  const classNames = new Map((classes ?? []).map((schoolClass) => [schoolClass.id, schoolClass.name]));
  const targetEnrollmentIds = new Set((targetEnrollmentsResult.data ?? []).map((row) => row.student_id));
  const classOptions: PromotionClassOption[] = (classes ?? []).map((schoolClass) => ({
    id: schoolClass.id,
    name: schoolClass.name,
    academicYear: schoolClass.academic_year,
    studentCount: countsByClass.get(schoolClass.id) ?? 0,
  }));
  const students: PromotionStudent[] = (selectedStudentsResult.data ?? []).map((student) => ({
    id: student.id,
    studentCode: student.permanent_code,
    name: buildStudentName(student),
    classId: student.class_id,
    className: student.class_id ? classNames.get(student.class_id) ?? "Class" : "Unassigned",
    status: student.status,
    isActive: student.is_active,
    hasTargetEnrollment: targetEnrollmentIds.has(student.id),
  }));
  const recentActivity: PromotionActivity[] = (auditResult.data ?? []).map((log) => ({
    id: log.id,
    action: log.action,
    details: getDetails(log.details),
    createdAt: log.created_at,
  }));

  return {
    overview: {
      currentAcademicYear,
      currentTerm: "third",
      nextAcademicYear: toAcademicYear,
      activeStudents: studentsCountResult.count ?? 0,
      activeClasses: classes?.length ?? 0,
    },
    classes: classOptions,
    students,
    recentActivity,
    selected: {
      fromAcademicYear: currentAcademicYear,
      toAcademicYear,
      fromClassId,
      toClassId,
    },
  };
}
