"use server";

import { revalidatePath } from "next/cache";

import { requireActiveBillingForSchool } from "@/lib/billing/guards";
import { getValidationContext } from "@/lib/uploads/data";
import { uploadValidationSchema, type SaveUploadState } from "@/lib/uploads/upload-types";
import { getSavableRows, validateResultUpload } from "@/lib/uploads/validate-result-upload";
import type { UploadStatus } from "@/types/database";

export async function saveUploadAction(input: unknown): Promise<SaveUploadState> {
  const parsed = uploadValidationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the upload options and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const context = await getValidationContext(parsed.data.classId, parsed.data.term, parsed.data.academicYear);
    await requireActiveBillingForSchool(context.profile.school_id);
    const validation = validateResultUpload({
      fileBase64: parsed.data.fileBase64,
      className: context.schoolClass.name,
      term: parsed.data.term,
      academicYear: parsed.data.academicYear,
      duplicateStrategy: parsed.data.duplicateStrategy,
      students: context.students,
      subjects: context.subjects,
      existingResults: context.existingResults,
    });

    if (validation.summary.invalidRows > 0) {
      return {
        ok: false,
        message: "Fix invalid rows before saving this upload.",
      };
    }

    const rows = getSavableRows(validation);
    const rowsToInsert = rows.filter((row) => !row.isExistingDuplicate);
    const rowsToReplace = parsed.data.duplicateStrategy === "replace" ? rows.filter((row) => row.isExistingDuplicate) : [];
    const skippedRows = parsed.data.duplicateStrategy === "skip" ? rows.filter((row) => row.isExistingDuplicate).length : 0;
    const uploadStatus: UploadStatus = "validated";
    const subjectSummary = context.subjects.map((subject) => subject.name).join(", ");
    const uploadPayload = {
      school_id: context.profile.school_id,
      class_id: parsed.data.classId,
      class_name: context.schoolClass.name,
      subject: subjectSummary,
      term: parsed.data.term,
      academic_year: parsed.data.academicYear,
      status: uploadStatus,
      file_name: parsed.data.fileName,
      source_filename: parsed.data.fileName,
      total_rows: validation.summary.totalRows,
      valid_rows: rows.length,
      invalid_rows: 0,
      validation_errors: validation.summary.messages,
      uploaded_by: context.profile.id,
      validated_by: uploadStatus === "validated" ? context.profile.id : null,
      validated_at: uploadStatus === "validated" ? new Date().toISOString() : null,
      metadata: {
        duplicate_strategy: parsed.data.duplicateStrategy,
        duplicate_skipped: skippedRows,
        duplicate_replaced: rowsToReplace.length,
      },
    };
    const { data: upload, error: uploadError } = await context.supabase
      .from("result_uploads")
      .insert(uploadPayload)
      .select("id")
      .single();

    if (uploadError || !upload) {
      return {
        ok: false,
        message: uploadError?.message ?? "The upload record could not be created.",
      };
    }

    if (rowsToInsert.length > 0) {
      const { error } = await context.supabase.from("results").insert(
        rowsToInsert.map((row) => ({
          school_id: context.profile.school_id,
          upload_id: upload.id,
          student_id: row.studentId as string,
          class_id: parsed.data.classId,
          subject_id: row.subjectId as string,
          term: parsed.data.term,
          academic_year: parsed.data.academicYear,
          continuous_assessment: row.ca ?? 0,
          exam_score: row.exam ?? 0,
          grade: row.grade,
          remark: row.remark || null,
          metadata: row.classTeacherComment
            ? {
                class_teacher_comment: row.classTeacherComment,
              }
            : {},
          is_published: false,
        })),
      );

      if (error) {
        return {
          ok: false,
          message: error.message,
        };
      }
    }

    for (const row of rowsToReplace) {
      const { error } = await context.supabase
        .from("results")
        .update({
          upload_id: upload.id,
          continuous_assessment: row.ca ?? 0,
          exam_score: row.exam ?? 0,
          grade: row.grade,
          remark: row.remark || null,
          metadata: row.classTeacherComment
            ? {
                class_teacher_comment: row.classTeacherComment,
              }
            : {},
          is_published: false,
        })
        .eq("school_id", context.profile.school_id)
        .eq("student_id", row.studentId as string)
        .eq("subject_id", row.subjectId as string)
        .eq("term", parsed.data.term)
        .eq("academic_year", parsed.data.academicYear)
        .eq("is_published", false);

      if (error) {
        return {
          ok: false,
          message: error.message,
        };
      }
    }

    const commentByStudent = new Map<string, string>();
    rows.forEach((row) => {
      if (row.studentId && row.classTeacherComment.trim() && !commentByStudent.has(row.studentId)) {
        commentByStudent.set(row.studentId, row.classTeacherComment.trim());
      }
    });

    if (commentByStudent.size > 0) {
      const { error } = await context.supabase.from("student_term_reports").upsert(
        Array.from(commentByStudent.entries()).map(([studentId, comment]) => ({
          school_id: context.profile.school_id,
          student_id: studentId,
          class_id: parsed.data.classId,
          academic_year: parsed.data.academicYear,
          term: parsed.data.term,
          upload_id: upload.id,
          class_teacher_comment: comment,
          class_teacher_id: context.schoolClass.teacher_id || null,
          updated_at: new Date().toISOString(),
        })),
        {
          onConflict: "school_id,student_id,class_id,academic_year,term",
        },
      );

      if (error) {
        return { ok: false, message: error.message };
      }
    }

    await context.supabase.from("audit_logs").insert({
      school_id: context.profile.school_id,
      actor_id: context.profile.id,
      actor_role: context.profile.role,
      action: "validate",
      table_name: "result_uploads",
      record_id: upload.id,
      details: {
        security_event: "result_upload_saved",
        class_id: parsed.data.classId,
        class_name: context.schoolClass.name,
        term: parsed.data.term,
        academic_year: parsed.data.academicYear,
        inserted_rows: rowsToInsert.length,
        replaced_rows: rowsToReplace.length,
        skipped_rows: skippedRows,
      },
    });

    revalidatePath("/dashboard/uploads");

    return {
      ok: true,
      message: uploadStatus === "validated" ? "Upload saved and validated." : "Upload saved as draft.",
      uploadId: upload.id,
      insertedRows: rowsToInsert.length,
      replacedRows: rowsToReplace.length,
      skippedRows,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "The upload could not be saved.",
    };
  }
}
