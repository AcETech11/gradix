"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/authorization";
import { buildStudentName } from "@/lib/parent-access/parent-access-formatters";
import type { ParentAccessActionState } from "@/lib/parent-access/parent-access-types";
import { createClient } from "@/lib/supabase/server";
import type { SchoolTerm } from "@/types/database";

const baseSchema = z.object({
  studentId: z.string().uuid(),
  term: z.enum(["first", "second", "third"]),
  academicYear: z.string().regex(/^[0-9]{4}\/[0-9]{4}$/, "Use academic year format YYYY/YYYY."),
});

const limitSchema = baseSchema.extend({
  maxUses: z.coerce.number().int().min(1).max(100),
});

async function getAccessContext(input: z.infer<typeof baseSchema>) {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, school_id, permanent_code, first_name, middle_name, last_name")
    .eq("id", input.studentId)
    .eq("school_id", profile.school_id)
    .maybeSingle();

  if (studentError || !student) {
    throw new Error(studentError?.message ?? "Student was not found in your school workspace.");
  }

  const { data: result, error: resultError } = await supabase
    .from("results")
    .select("id")
    .eq("school_id", profile.school_id)
    .eq("student_id", student.id)
    .eq("term", input.term)
    .eq("academic_year", input.academicYear)
    .eq("is_published", true)
    .limit(1)
    .maybeSingle();

  if (resultError || !result) {
    throw new Error(resultError?.message ?? "No published result was found for this student and term.");
  }

  const { data: access, error: accessError } = await supabase
    .from("code_term_access")
    .select("*")
    .eq("school_id", profile.school_id)
    .eq("student_id", student.id)
    .eq("term", input.term)
    .eq("academic_year", input.academicYear)
    .maybeSingle();

  if (accessError) {
    throw new Error(accessError.message);
  }

  return {
    profile,
    supabase,
    student,
    studentName: buildStudentName(student),
    access,
  };
}

export async function resetParentAccessViewsAction(input: unknown): Promise<ParentAccessActionState> {
  const parsed = baseSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the selected result access record.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const { profile, supabase, student, studentName, access } = await getAccessContext(parsed.data);
    const oldUseCount = access?.use_count ?? 0;
    const maxUses = access?.max_uses ?? 10;

    if (access) {
      const { error } = await supabase
        .from("code_term_access")
        .update({ use_count: 0, last_used_at: null })
        .eq("id", access.id)
        .eq("school_id", profile.school_id);

      if (error) {
        throw error;
      }
    } else {
      const { error } = await supabase.from("code_term_access").insert({
        school_id: profile.school_id,
        student_id: student.id,
        result_code: student.permanent_code,
        term: parsed.data.term as SchoolTerm,
        academic_year: parsed.data.academicYear,
        is_active: true,
        max_uses: maxUses,
        use_count: 0,
        created_by: profile.id,
      });

      if (error) {
        throw error;
      }
    }

    await supabase.from("audit_logs").insert({
      school_id: profile.school_id,
      actor_id: profile.id,
      actor_role: profile.role,
      action: "update",
      table_name: "code_term_access",
      record_id: access?.id ?? null,
      details: {
        event: "parent_access_reset",
        student_id: student.id,
        student_name: studentName,
        term: parsed.data.term,
        academic_year: parsed.data.academicYear,
        old_use_count: oldUseCount,
        new_use_count: 0,
        max_uses: maxUses,
      },
    });

    revalidatePath("/dashboard/parent-access");

    return { ok: true, message: "Parent access views reset successfully." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Parent access views could not be reset." };
  }
}

export async function increaseParentAccessLimitAction(input: unknown): Promise<ParentAccessActionState> {
  const parsed = limitSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Check the new access limit.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const { profile, supabase, student, studentName, access } = await getAccessContext(parsed.data);
    const currentUseCount = access?.use_count ?? 0;
    const oldMaxUses = access?.max_uses ?? 10;

    if (parsed.data.maxUses < currentUseCount) {
      return { ok: false, message: "New limit must be greater than or equal to current views used." };
    }

    if (access) {
      const { error } = await supabase
        .from("code_term_access")
        .update({ max_uses: parsed.data.maxUses })
        .eq("id", access.id)
        .eq("school_id", profile.school_id);

      if (error) {
        throw error;
      }
    } else {
      const { error } = await supabase.from("code_term_access").insert({
        school_id: profile.school_id,
        student_id: student.id,
        result_code: student.permanent_code,
        term: parsed.data.term as SchoolTerm,
        academic_year: parsed.data.academicYear,
        is_active: true,
        max_uses: parsed.data.maxUses,
        use_count: 0,
        created_by: profile.id,
      });

      if (error) {
        throw error;
      }
    }

    await supabase.from("audit_logs").insert({
      school_id: profile.school_id,
      actor_id: profile.id,
      actor_role: profile.role,
      action: "update",
      table_name: "code_term_access",
      record_id: access?.id ?? null,
      details: {
        event: "parent_access_limit_updated",
        student_id: student.id,
        student_name: studentName,
        term: parsed.data.term,
        academic_year: parsed.data.academicYear,
        old_max_uses: oldMaxUses,
        new_max_uses: parsed.data.maxUses,
        current_use_count: currentUseCount,
      },
    });

    revalidatePath("/dashboard/parent-access");

    return { ok: true, message: "Parent access limit updated successfully." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Parent access limit could not be updated." };
  }
}
