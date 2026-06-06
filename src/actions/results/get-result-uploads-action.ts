"use server";

import { requireCanManageResultOperations } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { canArchiveResultUpload, canPublishResultUpload, canViewResultUpload } from "@/lib/results/permissions";
import type { ResultUploadListItem } from "@/lib/results/result-types";

export async function getResultUploadsAction(): Promise<ResultUploadListItem[]> {
  const profile = await requireCanManageResultOperations();
  const supabase = await createClient();
  const query = supabase
    .from("result_uploads")
    .select("id, class_id, class_name, term, academic_year, status, source_filename, file_name, total_rows, uploaded_by, created_at, published_at")
    .eq("school_id", profile.school_id)
    .order("created_at", { ascending: false });

  const { data: uploads, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const uploadedByIds = Array.from(new Set((uploads ?? []).map((upload) => upload.uploaded_by).filter((id): id is string => Boolean(id))));
  const classIds = Array.from(new Set((uploads ?? []).map((upload) => upload.class_id)));
  const [usersResult, studentsResult] = await Promise.all([
    uploadedByIds.length > 0
      ? supabase.from("users").select("id, full_name").eq("school_id", profile.school_id).in("id", uploadedByIds)
      : Promise.resolve({ data: [], error: null }),
    classIds.length > 0
      ? supabase.from("students").select("class_id").eq("school_id", profile.school_id).eq("is_active", true).in("class_id", classIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (usersResult.error || studentsResult.error) {
    throw new Error(usersResult.error?.message ?? studentsResult.error?.message ?? "Result uploads could not be loaded.");
  }

  const usersById = new Map((usersResult.data ?? []).map((user) => [user.id, user.full_name]));

  return (uploads ?? []).filter((upload) => canViewResultUpload(profile, upload)).map((upload) => ({
    id: upload.id,
    classId: upload.class_id,
    className: upload.class_name,
    term: upload.term,
    academicYear: upload.academic_year,
    status: upload.status,
    totalRows: upload.total_rows,
    totalStudents: (studentsResult.data ?? []).filter((student) => student.class_id === upload.class_id).length,
    uploadedBy: upload.uploaded_by ? usersById.get(upload.uploaded_by) ?? "Unknown user" : "Unknown user",
    uploadedDate: upload.created_at,
    publishedDate: upload.published_at,
    sourceFilename: upload.source_filename ?? upload.file_name ?? "Result upload",
    canReview: true,
    canPublish: canPublishResultUpload(profile) && upload.status !== "published" && upload.status !== "archived",
    canUnpublish: canPublishResultUpload(profile) && upload.status === "published",
    canArchive: canArchiveResultUpload(profile) && upload.status !== "archived",
  }));
}
