"use server";

import type { UploadActivity } from "@/lib/analytics/analytics-types";

import { getAnalyticsSourceData } from "./analytics-source";

export async function getUploadActivityAction(input?: unknown): Promise<UploadActivity> {
  const data = await getAnalyticsSourceData(input);
  const academicYear = data.filters.academicYear ?? data.filterOptions.defaults.academicYear;
  const term = data.filters.term ?? data.filterOptions.defaults.term;
  const scopedUploads = data.uploads.filter((upload) => {
    if (academicYear && upload.academic_year !== academicYear) {
      return false;
    }

    if (term && upload.term !== term) {
      return false;
    }

    if (data.filters.classId && upload.class_id !== data.filters.classId) {
      return false;
    }

    return true;
  });

  return {
    uploadsThisTerm: scopedUploads.length,
    publishedUploads: scopedUploads.filter((upload) => upload.status === "published").length,
    draftUploads: scopedUploads.filter((upload) => upload.status === "draft" || upload.status === "validating" || upload.status === "validated").length,
    archivedUploads: scopedUploads.filter((upload) => upload.status === "archived").length,
    recentUploads: scopedUploads.slice(0, 5).map((upload) => ({
      id: upload.id,
      className: upload.class_name,
      term: upload.term,
      academicYear: upload.academic_year,
      status: upload.status,
      uploadedAt: upload.created_at,
      fileName: upload.source_filename ?? upload.file_name,
    })),
  };
}
