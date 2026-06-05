"use server";

import { getValidationContext } from "@/lib/uploads/data";
import { validateResultUpload } from "@/lib/uploads/validate-result-upload";
import { uploadValidationSchema, type UploadActionState } from "@/lib/uploads/upload-types";

export async function validateUploadAction(input: unknown): Promise<UploadActionState> {
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

    return validateResultUpload({
      fileBase64: parsed.data.fileBase64,
      className: context.schoolClass.name,
      term: parsed.data.term,
      academicYear: parsed.data.academicYear,
      duplicateStrategy: parsed.data.duplicateStrategy,
      students: context.students,
      subjects: context.subjects,
      existingResults: context.existingResults,
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "The uploaded file could not be validated.",
    };
  }
}
