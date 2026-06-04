export const STUDENT_PASSPORT_BUCKET = "student-passports";

export const STUDENT_PASSPORT_MAX_SIZE = 2 * 1024 * 1024;
export const STUDENT_PASSPORT_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export function getPassportStoragePath(schoolId: string, fileName: string) {
  const safeFileName = fileName.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");

  return `${schoolId}/passports/${safeFileName}`;
}

export function validatePassportFile(file: File) {
  if (!STUDENT_PASSPORT_ALLOWED_TYPES.includes(file.type as (typeof STUDENT_PASSPORT_ALLOWED_TYPES)[number])) {
    return "Use a PNG, JPG, or WebP image.";
  }

  if (file.size > STUDENT_PASSPORT_MAX_SIZE) {
    return "Passport photo must be 2MB or smaller.";
  }

  return null;
}
