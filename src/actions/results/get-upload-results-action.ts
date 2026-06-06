"use server";

import { requireCanManageResultOperations } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { canArchiveResultUpload, canEditResultScores, canPublishResultUpload, canViewResultUpload } from "@/lib/results/permissions";
import { getMetadataObject, getMetadataString } from "@/lib/settings/settings-types";
import type { ResultReviewRow, ResultUploadDetail } from "@/lib/results/result-types";

export async function getUploadResultsAction(uploadId: string): Promise<{ upload: ResultUploadDetail; rows: ResultReviewRow[] }> {
  const profile = await requireCanManageResultOperations();
  const supabase = await createClient();
  const { data: upload, error: uploadError } = await supabase
    .from("result_uploads")
    .select("*")
    .eq("id", uploadId)
    .eq("school_id", profile.school_id)
    .maybeSingle();

  if (uploadError || !upload) {
    throw new Error(uploadError?.message ?? "Result upload was not found.");
  }

  if (!canViewResultUpload(profile, upload)) {
    throw new Error("You do not have access to this result upload.");
  }

  const { data: results, error: resultsError } = await supabase
    .from("results")
    .select("id, student_id, subject_id, continuous_assessment, exam_score, total_score, grade, remark, is_published, edited_by, edited_at, edit_count, metadata")
    .eq("school_id", profile.school_id)
    .eq("upload_id", upload.id)
    .order("created_at", { ascending: true });

  if (resultsError) {
    throw new Error(resultsError.message);
  }

  const studentIds = Array.from(new Set((results ?? []).map((result) => result.student_id)));
  const subjectIds = Array.from(new Set((results ?? []).map((result) => result.subject_id)));
  const userIds = Array.from(new Set([upload.uploaded_by].filter((id): id is string => Boolean(id))));
  const [studentsResult, subjectsResult, usersResult] = await Promise.all([
    studentIds.length > 0
      ? supabase.from("students").select("id, permanent_code, admission_number, first_name, middle_name, last_name").eq("school_id", profile.school_id).in("id", studentIds)
      : Promise.resolve({ data: [], error: null }),
    subjectIds.length > 0
      ? supabase.from("subjects").select("id, name").eq("school_id", profile.school_id).in("id", subjectIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length > 0
      ? supabase.from("users").select("id, full_name").eq("school_id", profile.school_id).in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (studentsResult.error || subjectsResult.error || usersResult.error) {
    throw new Error(studentsResult.error?.message ?? subjectsResult.error?.message ?? usersResult.error?.message ?? "Result rows could not be loaded.");
  }

  const studentsById = new Map(
    (studentsResult.data ?? []).map((student) => [
      student.id,
      {
        code: student.permanent_code,
        admissionNumber: student.admission_number,
        name: [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" "),
      },
    ]),
  );
  const subjectsById = new Map((subjectsResult.data ?? []).map((subject) => [subject.id, subject.name]));
  const usersById = new Map((usersResult.data ?? []).map((user) => [user.id, user.full_name]));
  const canEdit = canEditResultScores(profile);
  const canPublish = canPublishResultUpload(profile);
  const publishedDate = upload.published_at;

  return {
    upload: {
      id: upload.id,
      classId: upload.class_id,
      className: upload.class_name,
      term: upload.term,
      academicYear: upload.academic_year,
      status: upload.status,
      sourceFilename: upload.source_filename ?? upload.file_name ?? "Result upload",
      totalRows: upload.total_rows,
      validRows: upload.valid_rows,
      invalidRows: upload.invalid_rows,
      uploadedBy: upload.uploaded_by ? usersById.get(upload.uploaded_by) ?? "Unknown user" : "Unknown user",
      uploadedDate: upload.created_at,
      publishedDate,
      canEdit,
      canPublish: canPublish && upload.status !== "published" && upload.status !== "archived",
      canUnpublish: canPublish && upload.status === "published",
      canArchive: canArchiveResultUpload(profile) && upload.status !== "archived",
    },
    rows: (results ?? []).map((result) => {
      const student = studentsById.get(result.student_id);

      return {
        id: result.id,
        studentId: result.student_id,
        studentCode: student?.code ?? "Unknown",
        studentName: student?.name ?? "Unknown student",
        admissionNumber: student?.admissionNumber ?? null,
        subjectId: result.subject_id,
        subjectName: subjectsById.get(result.subject_id) ?? "Unknown subject",
        continuousAssessment: result.continuous_assessment,
        examScore: result.exam_score,
        totalScore: result.total_score,
        grade: result.grade,
        remark: result.remark,
        isPublished: result.is_published,
        editedBy: result.edited_by,
        editedAt: result.edited_at,
        editCount: result.edit_count,
        editedAfterPublish: Boolean(result.edited_at && publishedDate && new Date(result.edited_at) > new Date(publishedDate)),
        classTeacherComment: getMetadataString(getMetadataObject(result.metadata), "class_teacher_comment") || null,
      };
    }),
  };
}
