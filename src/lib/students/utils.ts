import type { StudentFormValues, StudentListItem, StudentProfile, StudentRecord, StudentStatus } from "@/types/students";

export function formatStudentName(student: Pick<StudentProfile, "first_name" | "middle_name" | "last_name">) {
  return [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ");
}

export function mapStudentRecord(student: StudentListItem | StudentProfile) {
  return {
    ...student,
    student_code: student.student_code,
    parent_name: student.parent_name,
  };
}

export function buildStudentFormDefaults(student?: StudentRecord | StudentListItem | StudentProfile | null): StudentFormValues {
  const parentName = (student && "parent_name" in student ? student.parent_name : student?.parent_full_name) ?? "";

  return {
    firstName: student?.first_name ?? "",
    lastName: student?.last_name ?? "",
    middleName: student?.middle_name ?? "",
    gender: (student?.gender ?? "male") as StudentFormValues["gender"],
    dateOfBirth: student?.date_of_birth ?? "",
    classId: student?.class_id ?? "",
    parentName,
    parentPhone: student?.parent_phone ?? "",
    parentEmail: student?.parent_email ?? "",
    admissionNumber: student?.admission_number ?? "",
    status: (student?.status ?? "active") as StudentFormValues["status"],
    passportUrl: student?.passport_url ?? "",
  };
}

export function getStudentStatusLabel(status: StudentStatus) {
  switch (status) {
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";
    case "repeated":
      return "Repeated";
    case "graduated":
      return "Graduated";
    case "transferred":
      return "Transferred";
    case "withdrawn":
      return "Withdrawn";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}

export function getStudentStatusTone(status: StudentStatus) {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "warning";
    case "repeated":
      return "info";
    case "graduated":
      return "info";
    case "transferred":
      return "warning";
    case "withdrawn":
      return "warning";
    case "archived":
      return "neutral";
    default:
      return "neutral";
  }
}

export function getStudentInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
