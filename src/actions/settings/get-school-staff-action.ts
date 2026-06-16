"use server";

import { createClient } from "@/lib/supabase/server";
import type { SchoolClassAssignment, SchoolStaff } from "@/lib/settings/settings-types";

import { requireSettingsViewer } from "./settings-helpers";

export async function getSchoolStaffAction(): Promise<{ staff: SchoolStaff[]; classes: SchoolClassAssignment[] }> {
  const profile = await requireSettingsViewer();
  const supabase = await createClient();
  const [staffResult, classesResult] = await Promise.all([
    supabase.from("school_staff").select("*").eq("school_id", profile.school_id).order("created_at", { ascending: false }),
    supabase.from("classes").select("id, name, academic_year, teacher_id, is_active").eq("school_id", profile.school_id).order("name"),
  ]);

  if (staffResult.error || classesResult.error) {
    throw new Error(staffResult.error?.message ?? classesResult.error?.message ?? "Staff data could not be loaded.");
  }

  return {
    staff: staffResult.data ?? [],
    classes: (classesResult.data ?? []).map((schoolClass) => ({
      id: schoolClass.id,
      name: schoolClass.name,
      academicYear: schoolClass.academic_year,
      isActive: schoolClass.is_active,
      classTeacherStaffId: schoolClass.teacher_id ?? "",
    })),
  };
}
