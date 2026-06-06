import { requireAdminOrHeadmaster, requireCanManageStudents } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import type { TableRow } from "@/types/database";
import type {
  StudentFilters,
  StudentFormValues,
  StudentListItem,
  StudentRecord,
  StudentStatus,
} from "@/types/students";

import { studentFiltersSchema } from "./schema";

const PAGE_SIZE = 10;

type ClassRecord = TableRow<"classes">;

function escapeSearchTerm(value: string) {
  return value.replace(/[%_]/g, "\\$&");
}

function mapStudent(student: StudentRecord, classesById: Map<string, ClassRecord>) {
  const classRecord = student.class_id ? classesById.get(student.class_id) : null;
  const studentCode = student.permanent_code;
  const parentName = student.parent_full_name;

  return {
    ...student,
    student_code: studentCode,
    parent_name: parentName,
    class_name: classRecord?.name ?? null,
    class_level: classRecord?.level ?? null,
  } satisfies StudentListItem;
}

function mapStudentProfile(student: StudentRecord, classesById: Map<string, ClassRecord>) {
  const classRecord = student.class_id ? classesById.get(student.class_id) : null;

  return {
    ...student,
    student_code: student.permanent_code,
    parent_name: student.parent_full_name,
    class_name: classRecord?.name ?? null,
    class_level: classRecord?.level ?? null,
  } satisfies StudentListItem;
}

export function toStudentWritePayload(values: StudentFormValues, schoolId: string) {
  const trimmedMiddleName = values.middleName.trim();
  const trimmedParentEmail = values.parentEmail.trim();
  const trimmedAdmissionNumber = values.admissionNumber.trim();
  const trimmedPassportUrl = values.passportUrl.trim();
  const isGraduated = values.status === "graduated";
  const today = new Date().toISOString().slice(0, 10);

  return {
    school_id: schoolId,
    class_id: values.classId,
    first_name: values.firstName.trim(),
    middle_name: trimmedMiddleName || null,
    last_name: values.lastName.trim(),
    gender: values.gender,
    date_of_birth: values.dateOfBirth.trim() || null,
    parent_full_name: values.parentName.trim(),
    parent_phone: values.parentPhone.trim(),
    parent_email: trimmedParentEmail || null,
    admission_number: trimmedAdmissionNumber || null,
    passport_url: trimmedPassportUrl || null,
    status: values.status as StudentStatus,
    is_active: values.status === "active",
    graduated_at: isGraduated ? today : null,
    metadata: {
      source: "manual",
    },
  };
}

export async function getStudentsPageData(searchParams?: Partial<StudentFilters>) {
  const profile = await requireAdminOrHeadmaster();
  const supabase = await createClient();
  const filters = studentFiltersSchema.parse(searchParams ?? {});
  const offset = (filters.page - 1) * PAGE_SIZE;

  let studentsQuery = supabase
    .from("students")
    .select("*", { count: "exact" })
    .eq("school_id", profile.school_id);

  if (filters.status && filters.status !== "all") {
    studentsQuery = studentsQuery.eq("status", filters.status);
  }

  if (filters.classId) {
    studentsQuery = studentsQuery.eq("class_id", filters.classId);
  }

  if (filters.query) {
    const term = escapeSearchTerm(filters.query);
    studentsQuery = studentsQuery.or(
      `first_name.ilike.%${term}%,middle_name.ilike.%${term}%,last_name.ilike.%${term}%,admission_number.ilike.%${term}%,permanent_code.ilike.%${term}%`,
    );
  }

  const [studentsResult, classesResult, existingStudentsResult] = await Promise.all([
    studentsQuery.order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1),
    supabase
      .from("classes")
      .select("*")
      .eq("school_id", profile.school_id)
      .order("name", { ascending: true }),
    supabase
      .from("students")
      .select("admission_number, permanent_code")
      .eq("school_id", profile.school_id),
  ]);

  if (studentsResult.error) {
    throw new Error(studentsResult.error.message);
  }

  if (classesResult.error) {
    throw new Error(classesResult.error.message);
  }

  if (existingStudentsResult.error) {
    throw new Error(existingStudentsResult.error.message);
  }

  const classesById = new Map<string, ClassRecord>((classesResult.data ?? []).map((classRecord) => [classRecord.id, classRecord]));
  const students = (studentsResult.data ?? []).map((student) => mapStudent(student, classesById));
  const existingAdmissions = (existingStudentsResult.data ?? [])
    .map((student) => student.admission_number)
    .filter((value): value is string => Boolean(value));
  const existingStudentCodes = (existingStudentsResult.data ?? []).map((student) => student.permanent_code);
  const total = studentsResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    profile,
    students,
    classes: classesResult.data ?? [],
    existingAdmissions,
    existingStudentCodes,
    filters,
    pagination: {
      page: filters.page,
      pageSize: PAGE_SIZE,
      total,
      totalPages,
      hasNextPage: filters.page < totalPages,
      hasPreviousPage: filters.page > 1,
    },
  };
}

export async function getStudentDetailData(studentId: string) {
  const profile = await requireAdminOrHeadmaster();
  const supabase = await createClient();

  const [studentResult, classesResult] = await Promise.all([
    supabase.from("students").select("*").eq("school_id", profile.school_id).eq("id", studentId).maybeSingle(),
    supabase
      .from("classes")
      .select("*")
      .eq("school_id", profile.school_id)
      .order("name", { ascending: true }),
  ]);

  if (studentResult.error) {
    throw new Error(studentResult.error.message);
  }

  if (classesResult.error) {
    throw new Error(classesResult.error.message);
  }

  if (!studentResult.data) {
    return null;
  }

  const classesById = new Map<string, ClassRecord>((classesResult.data ?? []).map((classRecord) => [classRecord.id, classRecord]));

  return {
    profile,
    student: mapStudentProfile(studentResult.data, classesById),
    classes: classesResult.data ?? [],
  };
}

export async function getStudentFormData() {
  const profile = await requireCanManageStudents();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("classes")
    .select("id, name, level, arm, is_active, academic_year")
    .eq("school_id", profile.school_id)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return {
    profile,
    classes: data ?? [],
  };
}

export async function getStudentEditData(studentId: string) {
  const profile = await requireCanManageStudents();
  const supabase = await createClient();

  const [studentResult, classesResult] = await Promise.all([
    supabase.from("students").select("*").eq("school_id", profile.school_id).eq("id", studentId).maybeSingle(),
    supabase
      .from("classes")
      .select("id, name, level, arm, is_active, academic_year")
      .eq("school_id", profile.school_id)
      .order("name", { ascending: true }),
  ]);

  if (studentResult.error) {
    throw new Error(studentResult.error.message);
  }

  if (classesResult.error) {
    throw new Error(classesResult.error.message);
  }

  return {
    profile,
    student: studentResult.data,
    classes: classesResult.data ?? [],
  };
}

export async function getStudentFilterOptions() {
  const profile = await requireAdminOrHeadmaster();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("classes")
    .select("id, name, level, arm")
    .eq("school_id", profile.school_id)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return {
    profile,
    classes: data ?? [],
  };
}
