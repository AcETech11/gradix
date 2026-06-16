"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { requireCanManageStudents } from "@/lib/auth/authorization";
import { assertStudentLimitAvailable } from "@/lib/billing/guards";
import { createClient } from "@/lib/supabase/server";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { studentFormSchema, studentImportRowsSchema, type StudentFormInput, type StudentImportRowsInput } from "@/lib/students/schema";
import { toStudentWritePayload } from "@/lib/students/data";
import type { AuthActionState } from "@/types/auth";
import type { TableInsert } from "@/types/database";

function mapZodErrors(error: ZodError) {
  return error.issues.reduce<Record<string, string[]>>((accumulator, issue) => {
    const field = issue.path.map((part) => String(part)).join(".");

    if (!accumulator[field]) {
      accumulator[field] = [];
    }

    accumulator[field].push(issue.message);
    return accumulator;
  }, {});
}

function buildFieldErrorState(message: string, errors: Record<string, string[]>) {
  return {
    ok: false,
    message,
    fieldErrors: errors,
  } satisfies AuthActionState;
}

function normalizeGeneralError(error: unknown) {
  if (error instanceof Error) {
    return getAuthErrorMessage(error.message);
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return getAuthErrorMessage(message);
    }
  }

  return "Something went wrong while saving the student.";
}

function splitStudentName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() ?? "";
  const lastName = parts.length ? parts.pop() ?? "" : firstName;
  const middleName = parts.length ? parts.join(" ") : null;

  return {
    firstName,
    middleName,
    lastName,
  };
}

async function ensureStudentAccess() {
  return requireCanManageStudents();
}

async function generateStudentCode(supabase: Awaited<ReturnType<typeof createClient>>, schoolId: string) {
  const { data, error } = await supabase.rpc("generate_student_code", {
    target_school_id: schoolId,
  });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("A permanent student code could not be generated.");
  }

  return data;
}

export async function createStudentAction(input: StudentFormInput): Promise<AuthActionState<{ studentId: string; studentCode: string; redirectTo: string }>> {
  const parsed = studentFormSchema.safeParse(input);

  if (!parsed.success) {
    return buildFieldErrorState("Check the highlighted fields and try again.", mapZodErrors(parsed.error));
  }

  try {
    const profile = await ensureStudentAccess();
    const supabase = await createClient();
    await assertStudentLimitAvailable(profile.school_id, 1);
    const { data: classRecord, error: classError } = await supabase
      .from("classes")
      .select("id, academic_year")
      .eq("id", parsed.data.classId)
      .eq("school_id", profile.school_id)
      .maybeSingle();

    if (classError || !classRecord) {
      throw new Error("This record was not found in your school workspace.");
    }

    const studentCode = await generateStudentCode(supabase, profile.school_id);

    const { data, error } = await supabase
      .from("students")
      .insert({
        ...toStudentWritePayload(parsed.data, profile.school_id),
        permanent_code: studentCode,
      })
      .select("id, permanent_code")
      .single();

    if (error) {
      throw error;
    }

    await supabase.from("audit_logs").insert({
      school_id: profile.school_id,
      actor_id: profile.id,
      actor_role: profile.role,
      action: "insert",
      table_name: "students",
      record_id: data.id,
      details: {
        security_event: "student_created",
        student_id: data.id,
        student_code: data.permanent_code,
        class_id: parsed.data.classId,
      },
    });

    await supabase.from("student_class_enrollments").insert({
      school_id: profile.school_id,
      student_id: data.id,
      class_id: parsed.data.classId,
      academic_year: classRecord.academic_year,
      status: "active",
      promoted_by: profile.id,
    });

    revalidatePath("/dashboard/students");
    revalidatePath(`/dashboard/students/${data.id}`);

    return {
      ok: true,
      message: "Student created successfully.",
      data: {
        studentId: data.id,
        studentCode: data.permanent_code,
        redirectTo: `/dashboard/students/${data.id}`,
      },
    };
  } catch (error) {
    return {
      ok: false,
      message: normalizeGeneralError(error),
    };
  }
}

export async function updateStudentAction(
  studentId: string,
  input: StudentFormInput,
): Promise<AuthActionState<{ studentId: string; redirectTo: string }>> {
  const parsed = studentFormSchema.safeParse(input);

  if (!parsed.success) {
    return buildFieldErrorState("Check the highlighted fields and try again.", mapZodErrors(parsed.error));
  }

  try {
    const profile = await ensureStudentAccess();
    const supabase = await createClient();
    const { data: classRecord, error: classError } = await supabase
      .from("classes")
      .select("id")
      .eq("id", parsed.data.classId)
      .eq("school_id", profile.school_id)
      .maybeSingle();

    if (classError || !classRecord) {
      throw new Error("This record was not found in your school workspace.");
    }

    const { data, error } = await supabase
      .from("students")
      .update(toStudentWritePayload(parsed.data, profile.school_id))
      .eq("id", studentId)
      .eq("school_id", profile.school_id)
      .select("id, permanent_code")
      .single();

    if (error) {
      throw error;
    }

    await supabase.from("audit_logs").insert({
      school_id: profile.school_id,
      actor_id: profile.id,
      actor_role: profile.role,
      action: "update",
      table_name: "students",
      record_id: data.id,
      details: {
        security_event: "student_updated",
        student_id: data.id,
        student_code: data.permanent_code,
        class_id: parsed.data.classId,
      },
    });

    revalidatePath("/dashboard/students");
    revalidatePath(`/dashboard/students/${data.id}`);
    revalidatePath(`/dashboard/students/${data.id}/edit`);

    return {
      ok: true,
      message: "Student updated successfully.",
      data: {
        studentId: data.id,
        redirectTo: `/dashboard/students/${data.id}`,
      },
    };
  } catch (error) {
    return {
      ok: false,
      message: normalizeGeneralError(error),
    };
  }
}

export async function archiveStudentAction(studentId: string): Promise<AuthActionState<{ studentId: string }>> {
  try {
    const profile = await ensureStudentAccess();
    const supabase = await createClient();

    const { error } = await supabase
      .from("students")
      .update({
        school_id: profile.school_id,
        status: "archived",
        is_active: false,
        graduated_at: null,
      })
      .eq("id", studentId)
      .eq("school_id", profile.school_id);

    if (error) {
      throw error;
    }

    await supabase.from("audit_logs").insert({
      school_id: profile.school_id,
      actor_id: profile.id,
      actor_role: profile.role,
      action: "delete",
      table_name: "students",
      record_id: studentId,
      details: {
        security_event: "student_archived",
        student_id: studentId,
      },
    });

    revalidatePath("/dashboard/students");
    revalidatePath(`/dashboard/students/${studentId}`);

    return {
      ok: true,
      message: "Student archived successfully.",
      data: { studentId },
    };
  } catch (error) {
    return {
      ok: false,
      message: normalizeGeneralError(error),
    };
  }
}

export async function importStudentsAction(
  input: StudentImportRowsInput,
): Promise<
  AuthActionState<{
    imported: number;
    skipped: number;
    redirectTo: string;
  }>
> {
  const parsed = studentImportRowsSchema.safeParse(input);

  if (!parsed.success) {
    return buildFieldErrorState("Review the import file and try again.", mapZodErrors(parsed.error));
  }

  try {
    const profile = await ensureStudentAccess();
    const supabase = await createClient();
    await assertStudentLimitAvailable(profile.school_id, parsed.data.length);

    const [classesResult, existingStudentsResult] = await Promise.all([
      supabase.from("classes").select("id, name, academic_year").eq("school_id", profile.school_id),
      supabase
        .from("students")
        .select("id, admission_number, permanent_code")
        .eq("school_id", profile.school_id),
    ]);

    if (classesResult.error) {
      throw classesResult.error;
    }

    if (existingStudentsResult.error) {
      throw existingStudentsResult.error;
    }

    const classMap = new Map((classesResult.data ?? []).map((classRecord) => [classRecord.name.trim().toLowerCase(), classRecord]));
    const existingAdmissionNumbers = new Set(
      (existingStudentsResult.data ?? [])
        .map((student) => student.admission_number?.trim().toLowerCase())
        .filter((value): value is string => Boolean(value)),
    );
    const uniqueAdmissions = new Set<string>();
    const normalizedRows = parsed.data.map((row, index) => {
      const issues: string[] = [];
      const admissionNumber = row.admissionNumber.trim();
      const className = row.className.trim().toLowerCase();
      const classRecord = classMap.get(className) ?? null;
      const classId = classRecord?.id ?? null;

      if (!classId) {
        issues.push(`Row ${index + 1}: class "${row.className}" was not found.`);
      }

      if (existingAdmissionNumbers.has(admissionNumber.toLowerCase()) || uniqueAdmissions.has(admissionNumber.toLowerCase())) {
        issues.push(`Row ${index + 1}: duplicate admission number "${admissionNumber}".`);
      }

      uniqueAdmissions.add(admissionNumber.toLowerCase());

      return {
        ...row,
        classId,
        academicYear: classRecord?.academic_year ?? null,
        issues,
      };
    });

    const validRows = normalizedRows.filter((row) => row.classId && row.issues.length === 0);
    const skipped = normalizedRows.length - validRows.length;

    if (!validRows.length) {
      return {
        ok: false,
        message: "No valid student rows were found in the import file.",
      };
    }

    const rowsToInsert: TableInsert<"students">[] = [];

    for (const row of validRows) {
      const name = splitStudentName(row.studentName);

      rowsToInsert.push({
        school_id: profile.school_id,
        class_id: row.classId as string,
        permanent_code: await generateStudentCode(supabase, profile.school_id),
        first_name: name.firstName,
        middle_name: name.middleName,
        last_name: name.lastName,
        gender: row.gender || null,
        date_of_birth: row.dateOfBirth || null,
        parent_full_name: row.parentName?.trim() || null,
        parent_phone: row.parentPhone?.trim() || null,
        parent_email: row.parentEmail?.trim() || null,
        address: row.address?.trim() || null,
        admission_number: row.admissionNumber.trim(),
        status: "active",
        is_active: true,
        metadata: {
          source: "bulk_import",
          imported_at: new Date().toISOString(),
        },
      });
    }

    const { data: insertedStudents, error } = await supabase
      .from("students")
      .insert(rowsToInsert)
      .select("id, class_id");

    if (error) {
      throw error;
    }

    const academicYearByClass = new Map((classesResult.data ?? []).map((classRecord) => [classRecord.id, classRecord.academic_year]));
    if (insertedStudents?.length) {
      await supabase.from("student_class_enrollments").insert(
        insertedStudents
          .filter((student) => student.class_id && academicYearByClass.has(student.class_id))
          .map((student) => ({
            school_id: profile.school_id,
            student_id: student.id,
            class_id: student.class_id as string,
            academic_year: academicYearByClass.get(student.class_id as string) as string,
            status: "active",
            promoted_by: profile.id,
          })),
      );
    }

    await supabase.from("audit_logs").insert({
      school_id: profile.school_id,
      actor_id: profile.id,
      actor_role: profile.role,
      action: "insert",
      table_name: "students",
      details: {
        security_event: "students_imported",
        imported: validRows.length,
        skipped,
      },
    });

    revalidatePath("/dashboard/students");

    return {
      ok: true,
      message: "Students imported successfully.",
      data: {
        imported: validRows.length,
        skipped,
        redirectTo: "/dashboard/students",
      },
    };
  } catch (error) {
    return {
      ok: false,
      message: normalizeGeneralError(error),
    };
  }
}
