"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import {
  academicStructureSchema,
  brandingSchema,
  schoolInformationSchema,
  subjectsAssignmentsSchema,
} from "@/lib/onboarding/schema";
import { buildSubjectCode, getCurrentAcademicYear, mergeMetadata, slugifySchoolCode } from "@/lib/onboarding/utils";
import { createClient } from "@/lib/supabase/server";
import type { OnboardingActionState } from "@/types/onboarding";

function validationErrorState<TData = unknown>(
  message: string,
  fieldErrors?: Record<string, string[] | undefined>,
): OnboardingActionState<TData> {
  return {
    ok: false,
    message,
    fieldErrors,
  };
}

function saveErrorState<TData = unknown>(error: { message: string } | null): OnboardingActionState<TData> {
  return {
    ok: false,
    message: error?.message ?? "We could not save this onboarding step. Try again.",
  };
}

function normalizeClassName(name: string) {
  return name.trim().toLowerCase();
}

export async function saveSchoolInformationAction(input: unknown): Promise<OnboardingActionState> {
  const profile = await requireRole(["admin", "headmaster"]);
  const parsed = schoolInformationSchema.safeParse(input);

  if (!parsed.success) {
    return validationErrorState("Check the highlighted school details.", parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const { data: school, error: readError } = await supabase
    .from("schools")
    .select("metadata")
    .eq("id", profile.school_id)
    .single();

  if (readError || !school) {
    return saveErrorState(readError);
  }

  const { error } = await supabase
    .from("schools")
    .update({
      name: parsed.data.schoolName,
      slug: slugifySchoolCode(parsed.data.schoolCode),
      email: parsed.data.schoolEmail,
      phone: parsed.data.schoolPhone,
      address_line_1: parsed.data.schoolAddress,
      motto: parsed.data.schoolMotto || null,
      metadata: mergeMetadata(school.metadata, {
        school_code: parsed.data.schoolCode.trim().toUpperCase(),
        school_type: parsed.data.schoolType,
        principal_name: parsed.data.principalName,
        onboarding_school_information_complete: true,
      }),
    })
    .eq("id", profile.school_id);

  if (error) {
    return saveErrorState(error);
  }

  revalidatePath("/onboarding");

  return {
    ok: true,
    message: "School information saved.",
  };
}

export async function saveBrandingAction(input: unknown): Promise<OnboardingActionState> {
  const profile = await requireRole(["admin", "headmaster"]);
  const parsed = brandingSchema.safeParse(input);

  if (!parsed.success) {
    return validationErrorState("Check the highlighted branding details.", parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const { data: school, error: readError } = await supabase
    .from("schools")
    .select("metadata")
    .eq("id", profile.school_id)
    .single();

  if (readError || !school) {
    return saveErrorState(readError);
  }

  const { error } = await supabase
    .from("schools")
    .update({
      logo_url: parsed.data.logoUrl || null,
      headmaster_signature_url: parsed.data.signatureUrl || null,
      metadata: mergeMetadata(school.metadata, {
        primary_color: parsed.data.primaryColor,
        secondary_color: parsed.data.secondaryColor,
        onboarding_branding_complete: true,
      }),
    })
    .eq("id", profile.school_id);

  if (error) {
    return saveErrorState(error);
  }

  revalidatePath("/onboarding");

  return {
    ok: true,
    message: "Branding saved.",
  };
}

export async function saveAcademicStructureAction(
  input: unknown,
): Promise<OnboardingActionState<{ classes: { id: string; name: string; teacherId: string | null }[] }>> {
  const profile = await requireRole(["admin", "headmaster"]);
  const parsed = academicStructureSchema.safeParse(input);

  if (!parsed.success) {
    return validationErrorState("Review your class rows.", parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const academicYear = getCurrentAcademicYear();
  const incomingIds = parsed.data.classes.map((row) => row.id).filter(Boolean);
  const incomingNames = parsed.data.classes.map((row) => normalizeClassName(row.name));
  const { data: existingClasses, error: existingError } = await supabase
    .from("classes")
    .select("id, name")
    .eq("school_id", profile.school_id)
    .eq("academic_year", academicYear);

  if (existingError) {
    return saveErrorState(existingError);
  }

  const existingClassesByName = new Map(existingClasses.map((row) => [normalizeClassName(row.name), row]));
  const inactiveIds = existingClasses
    .filter((row) => !incomingIds.includes(row.id) && !incomingNames.includes(normalizeClassName(row.name)))
    .map((row) => row.id);

  if (inactiveIds.length > 0) {
    const { error } = await supabase
      .from("classes")
      .update({ is_active: false })
      .eq("school_id", profile.school_id)
      .in("id", inactiveIds);

    if (error) {
      return saveErrorState(error);
    }
  }

  const teacherIds = Array.from(new Set(parsed.data.classes.map((row) => row.teacherId).filter((id): id is string => Boolean(id))));

  if (teacherIds.length > 0) {
    const { data: validTeachers, error: teacherError } = await supabase
      .from("users")
      .select("id")
      .eq("school_id", profile.school_id)
      .eq("role", "teacher")
      .eq("is_active", true)
      .in("id", teacherIds);

    if (teacherError) {
      return saveErrorState(teacherError);
    }

    if ((validTeachers ?? []).length !== teacherIds.length) {
      return validationErrorState("One or more selected teachers were not found in your school workspace.");
    }
  }

  for (const row of parsed.data.classes) {
    const payload = {
      school_id: profile.school_id,
      name: row.name.trim(),
      level: row.name.trim(),
      teacher_id: row.teacherId || null,
      academic_year: academicYear,
      is_active: true,
    };

    const existingClass = row.id ? null : existingClassesByName.get(normalizeClassName(row.name));
    const targetClassId = row.id || existingClass?.id;

    if (targetClassId) {
      const { error } = await supabase
        .from("classes")
        .update(payload)
        .eq("id", targetClassId)
        .eq("school_id", profile.school_id);

      if (error) {
        return saveErrorState(error);
      }
    } else {
      const { error } = await supabase.from("classes").insert(payload);

      if (error) {
        return saveErrorState(error);
      }
    }
  }

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, name, teacher_id")
    .eq("school_id", profile.school_id)
    .eq("academic_year", academicYear)
    .eq("is_active", true)
    .order("name");

  if (classesError) {
    return saveErrorState(classesError);
  }

  revalidatePath("/onboarding");

  return {
    ok: true,
    message: "Academic structure saved.",
    data: {
      classes: classes.map((row) => ({
        id: row.id,
        name: row.name,
        teacherId: row.teacher_id,
      })),
    },
  };
}

export async function saveSubjectsAssignmentsAction(
  input: unknown,
): Promise<OnboardingActionState<{ subjects: { id: string; name: string; code: string; classIds: string[] }[] }>> {
  const profile = await requireRole(["admin", "headmaster"]);
  const parsed = subjectsAssignmentsSchema.safeParse(input);

  if (!parsed.success) {
    return validationErrorState("Review your subjects and assignments.", parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const incomingIds = parsed.data.subjects.map((row) => row.id).filter(Boolean);
  const requestedClassIds = Array.from(new Set(parsed.data.subjects.flatMap((row) => row.classIds)));
  const { data: existingSubjects, error: existingError } = await supabase
    .from("subjects")
    .select("id")
    .eq("school_id", profile.school_id);

  if (existingError) {
    return saveErrorState(existingError);
  }

  if (requestedClassIds.length > 0) {
    const { data: validClasses, error: classesError } = await supabase
      .from("classes")
      .select("id")
      .eq("school_id", profile.school_id)
      .eq("is_active", true)
      .in("id", requestedClassIds);

    if (classesError) {
      return saveErrorState(classesError);
    }

    if ((validClasses ?? []).length !== requestedClassIds.length) {
      return validationErrorState("One or more selected classes were not found in your school workspace.");
    }
  }

  const inactiveIds = existingSubjects.map((row) => row.id).filter((id) => !incomingIds.includes(id));

  if (inactiveIds.length > 0) {
    const { error } = await supabase
      .from("subjects")
      .update({ is_active: false })
      .eq("school_id", profile.school_id)
      .in("id", inactiveIds);

    if (error) {
      return saveErrorState(error);
    }
  }

  for (const row of parsed.data.subjects) {
    const subjectPayload = {
      school_id: profile.school_id,
      name: row.name.trim(),
      code: (row.code?.trim() || buildSubjectCode(row.name)).toUpperCase(),
      is_active: true,
    };

    const subjectResponse = row.id
      ? await supabase.from("subjects").update(subjectPayload).eq("id", row.id).eq("school_id", profile.school_id).select("id").single()
      : await supabase.from("subjects").insert(subjectPayload).select("id").single();

    if (subjectResponse.error || !subjectResponse.data) {
      return saveErrorState(subjectResponse.error);
    }

    const subjectId = subjectResponse.data.id;
    const { error: deactivateError } = await supabase
      .from("class_subjects")
      .update({ is_active: false })
      .eq("school_id", profile.school_id)
      .eq("subject_id", subjectId);

    if (deactivateError) {
      return saveErrorState(deactivateError);
    }

    for (const classId of row.classIds) {
      const { data: existingAssignment, error: assignmentReadError } = await supabase
        .from("class_subjects")
        .select("id")
        .eq("school_id", profile.school_id)
        .eq("class_id", classId)
        .eq("subject_id", subjectId)
        .maybeSingle();

      if (assignmentReadError) {
        return saveErrorState(assignmentReadError);
      }

      const payload = {
        school_id: profile.school_id,
        class_id: classId,
        subject_id: subjectId,
        is_active: true,
      };

      const assignmentResponse = existingAssignment
        ? await supabase.from("class_subjects").update(payload).eq("id", existingAssignment.id).eq("school_id", profile.school_id)
        : await supabase.from("class_subjects").insert(payload);

      if (assignmentResponse.error) {
        return saveErrorState(assignmentResponse.error);
      }
    }
  }

  const [{ data: savedSubjects, error: savedSubjectsError }, { data: savedAssignments, error: savedAssignmentsError }] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name, code")
      .eq("school_id", profile.school_id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("class_subjects")
      .select("class_id, subject_id")
      .eq("school_id", profile.school_id)
      .eq("is_active", true),
  ]);

  if (savedSubjectsError || savedAssignmentsError) {
    return saveErrorState(savedSubjectsError ?? savedAssignmentsError);
  }

  revalidatePath("/onboarding");

  return {
    ok: true,
    message: "Subjects and class assignments saved.",
    data: {
      subjects: savedSubjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        classIds: savedAssignments.filter((assignment) => assignment.subject_id === subject.id).map((assignment) => assignment.class_id),
      })),
    },
  };
}
