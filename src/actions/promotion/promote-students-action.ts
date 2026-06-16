"use server";

import { revalidatePath } from "next/cache";

import { requireAdminOrHeadmaster } from "@/lib/auth/authorization";
import type { PromotionActionState } from "@/lib/promotion/promotion-types";
import { promoteStudentsSchema, updateStudentStatusSchema } from "@/lib/promotion/promotion-validation";
import { createClient } from "@/lib/supabase/server";
import type { StudentEnrollmentStatus, StudentStatus } from "@/types/database";

async function verifyClass(supabase: Awaited<ReturnType<typeof createClient>>, schoolId: string, classId: string) {
  const { data, error } = await supabase
    .from("classes")
    .select("id, name")
    .eq("id", classId)
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Selected class was not found in your school workspace.");
  }

  return data;
}

async function verifyStudents(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolId: string,
  studentIds: string[],
  classId?: string,
) {
  let query = supabase
    .from("students")
    .select("id, first_name, middle_name, last_name, class_id, status")
    .eq("school_id", schoolId)
    .in("id", studentIds);

  if (classId) {
    query = query.eq("class_id", classId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  if ((data ?? []).length !== studentIds.length) {
    throw new Error("One or more selected students were not found in your school workspace.");
  }

  return data ?? [];
}

async function logPromotionAudit(input: {
  schoolId: string;
  actorId: string;
  actorRole: "admin" | "headmaster" | "teacher" | "parent";
  event: string;
  studentIds: string[];
  details: Record<string, unknown>;
}) {
  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    school_id: input.schoolId,
    actor_id: input.actorId,
    actor_role: input.actorRole,
    action: "update",
    table_name: "student_class_enrollments",
    details: {
      event: input.event,
      student_count: input.studentIds.length,
      student_ids: input.studentIds,
      performed_by: input.actorId,
      timestamp: new Date().toISOString(),
      ...input.details,
    },
  });
}

export async function promoteStudentsAction(input: unknown): Promise<PromotionActionState<{ promoted: number; skipped: number }>> {
  const parsed = promoteStudentsSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the promotion details.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const profile = await requireAdminOrHeadmaster();
    const supabase = await createClient();
    const [fromClass, toClass] = await Promise.all([
      verifyClass(supabase, profile.school_id, parsed.data.fromClassId),
      verifyClass(supabase, profile.school_id, parsed.data.toClassId),
    ]);
    await verifyStudents(supabase, profile.school_id, parsed.data.studentIds, parsed.data.fromClassId);

    const { data: existingTargets, error: existingError } = await supabase
      .from("student_class_enrollments")
      .select("student_id")
      .eq("school_id", profile.school_id)
      .eq("academic_year", parsed.data.toAcademicYear)
      .in("status", ["active", "repeated"])
      .in("student_id", parsed.data.studentIds);

    if (existingError) {
      throw existingError;
    }

    const existingIds = new Set((existingTargets ?? []).map((row) => row.student_id));
    const promotableIds = parsed.data.studentIds.filter((studentId) => !existingIds.has(studentId));

    if (promotableIds.length > 0) {
      const now = new Date().toISOString();
      const { error: sourceUpdateError } = await supabase
        .from("student_class_enrollments")
        .update({
          status: "promoted" satisfies StudentEnrollmentStatus,
          promoted_to_class_id: parsed.data.toClassId,
          promoted_at: now,
          promoted_by: profile.id,
        })
        .eq("school_id", profile.school_id)
        .eq("academic_year", parsed.data.fromAcademicYear)
        .eq("class_id", parsed.data.fromClassId)
        .in("student_id", promotableIds);

      if (sourceUpdateError) {
        throw sourceUpdateError;
      }

      const { error: targetInsertError } = await supabase.from("student_class_enrollments").insert(
        promotableIds.map((studentId) => ({
          school_id: profile.school_id,
          student_id: studentId,
          class_id: parsed.data.toClassId,
          academic_year: parsed.data.toAcademicYear,
          status: "active" satisfies StudentEnrollmentStatus,
          promoted_from_class_id: parsed.data.fromClassId,
          promoted_to_class_id: parsed.data.toClassId,
          promoted_at: now,
          promoted_by: profile.id,
        })),
      );

      if (targetInsertError) {
        throw targetInsertError;
      }

      const { error: studentUpdateError } = await supabase
        .from("students")
        .update({
          class_id: parsed.data.toClassId,
          status: "active" satisfies StudentStatus,
          is_active: true,
          graduated_at: null,
        })
        .eq("school_id", profile.school_id)
        .in("id", promotableIds);

      if (studentUpdateError) {
        throw studentUpdateError;
      }
    }

    await logPromotionAudit({
      schoolId: profile.school_id,
      actorId: profile.id,
      actorRole: profile.role,
      event: "students_promoted",
      studentIds: promotableIds,
      details: {
        from_class_id: fromClass.id,
        from_class_name: fromClass.name,
        to_class_id: toClass.id,
        to_class_name: toClass.name,
        from_academic_year: parsed.data.fromAcademicYear,
        to_academic_year: parsed.data.toAcademicYear,
        skipped_existing_target_enrollments: existingIds.size,
      },
    });

    revalidatePath("/dashboard/promotion");
    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/templates");
    revalidatePath("/dashboard/uploads");

    return {
      ok: true,
      message: `${promotableIds.length} student${promotableIds.length === 1 ? "" : "s"} promoted. ${existingIds.size} skipped because they already have target-year enrollment.`,
      data: { promoted: promotableIds.length, skipped: existingIds.size },
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Students could not be promoted." };
  }
}

export async function updatePromotionStudentStatusAction(input: unknown): Promise<PromotionActionState<{ updated: number }>> {
  const parsed = updateStudentStatusSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the selected student status.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const profile = await requireAdminOrHeadmaster();
    const supabase = await createClient();
    await verifyStudents(supabase, profile.school_id, parsed.data.studentIds, parsed.data.classId);

    const activeStatus = parsed.data.status === "active" || parsed.data.status === "repeated";
    const now = new Date().toISOString();
    const { error: studentError } = await supabase
      .from("students")
      .update({
        status: parsed.data.status,
        is_active: activeStatus,
        graduated_at: parsed.data.status === "graduated" ? now.slice(0, 10) : null,
      })
      .eq("school_id", profile.school_id)
      .in("id", parsed.data.studentIds);

    if (studentError) {
      throw studentError;
    }

    if (parsed.data.classId) {
      const { error: enrollmentError } = await supabase.from("student_class_enrollments").insert(
        parsed.data.studentIds.map((studentId) => ({
          school_id: profile.school_id,
          student_id: studentId,
          class_id: parsed.data.classId as string,
          academic_year: parsed.data.academicYear,
          status: parsed.data.status === "active" ? "active" : (parsed.data.status as StudentEnrollmentStatus),
          promoted_at: now,
          promoted_by: profile.id,
        })),
      );

      if (enrollmentError && !enrollmentError.message.toLowerCase().includes("duplicate")) {
        throw enrollmentError;
      }
    }

    await logPromotionAudit({
      schoolId: profile.school_id,
      actorId: profile.id,
      actorRole: profile.role,
      event: `student_${parsed.data.status}`,
      studentIds: parsed.data.studentIds,
      details: {
        class_id: parsed.data.classId,
        academic_year: parsed.data.academicYear,
        new_status: parsed.data.status,
      },
    });

    revalidatePath("/dashboard/promotion");
    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/templates");
    revalidatePath("/dashboard/uploads");

    return {
      ok: true,
      message: `${parsed.data.studentIds.length} student${parsed.data.studentIds.length === 1 ? "" : "s"} marked as ${parsed.data.status}.`,
      data: { updated: parsed.data.studentIds.length },
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Student status could not be updated." };
  }
}
