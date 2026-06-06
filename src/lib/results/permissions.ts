import type { AuthProfile } from "@/types/auth";
import type { TableRow } from "@/types/database";

type UploadOwner = Pick<TableRow<"result_uploads">, "uploaded_by" | "status">;

export function canViewResultUpload(profile: AuthProfile, upload: UploadOwner) {
  if (profile.role === "admin" || profile.role === "headmaster") {
    return true;
  }

  return upload.uploaded_by === profile.id;
}

export function canEditResultScores(profile: AuthProfile) {
  return profile.role === "admin";
}

export function canPublishResultUpload(profile: AuthProfile) {
  return profile.role === "admin" || profile.role === "headmaster";
}

export function canArchiveResultUpload(profile: AuthProfile) {
  return profile.role === "admin";
}
