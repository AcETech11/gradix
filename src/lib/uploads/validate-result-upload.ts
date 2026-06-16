import { calculateGrade } from "@/lib/uploads/grading";
import { normalizeTemplateSubjectName, parseResultTemplate } from "@/lib/uploads/parse-result-template";
import type {
  ParsedSubjectColumns,
  UploadPreviewRow,
  UploadStudent,
  UploadSubject,
  UploadValidationResult,
} from "@/lib/uploads/upload-types";
import type { SchoolTerm } from "@/types/database";

type ExistingResultKey = {
  student_id: string;
  subject_id: string;
};

type ValidateResultUploadOptions = {
  fileBase64: string;
  className: string;
  term: SchoolTerm;
  academicYear: string;
  duplicateStrategy: "skip" | "replace";
  students: UploadStudent[];
  subjects: UploadSubject[];
  existingResults: ExistingResultKey[];
};

function numberFromCell(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : Number.NaN;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function textFromCell(value: string | number | null | undefined) {
  return String(value ?? "").trim();
}

function findSubjectColumns(subject: UploadSubject, columns: ParsedSubjectColumns[]) {
  const subjectKey = normalizeTemplateSubjectName(subject.name);

  return columns.find((column) => normalizeTemplateSubjectName(column.subjectName) === subjectKey);
}

function getBaseRowErrors({
  className,
  duplicateStudentCodes,
  rowStudentCodes,
  student,
  studentCode,
  admissionNumber,
  uploadedClassName,
}: {
  className: string;
  duplicateStudentCodes: Set<string>;
  rowStudentCodes: Map<string, number>;
  student?: UploadStudent;
  studentCode: string;
  admissionNumber: string;
  uploadedClassName: string;
}) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!studentCode) {
    errors.push("Student Code is required.");
  }

  if (studentCode && !student) {
    errors.push("Student Code does not belong to a student in this class.");
  }

  if (studentCode && duplicateStudentCodes.has(studentCode) && (rowStudentCodes.get(studentCode) ?? 0) > 1) {
    errors.push("Duplicate Student Code appears in this file.");
  }

  if (student?.admissionNumber && admissionNumber && student.admissionNumber.toLowerCase() !== admissionNumber.toLowerCase()) {
    warnings.push("Admission Number does not match the existing student record.");
  }

  if (uploadedClassName && uploadedClassName.toLowerCase() !== className.toLowerCase()) {
    errors.push("Class does not match the selected class.");
  }

  return { errors, warnings };
}

function scoreErrors(ca: number | null, exam: number | null) {
  const errors: string[] = [];

  if (ca === null && exam !== null) {
    errors.push("CA is required when Exam is filled.");
  }

  if (exam === null && ca !== null) {
    errors.push("Exam is required when CA is filled.");
  }

  if (ca === null && exam === null) {
    errors.push("CA and Exam are required.");
  }

  if (Number.isNaN(ca)) {
    errors.push("CA must be a number.");
  }

  if (Number.isNaN(exam)) {
    errors.push("Exam must be a number.");
  }

  if (ca !== null && !Number.isNaN(ca) && (ca < 0 || ca > 40)) {
    errors.push("CA must be between 0 and 40.");
  }

  if (exam !== null && !Number.isNaN(exam) && (exam < 0 || exam > 60)) {
    errors.push("Exam must be between 0 and 60.");
  }

  if (ca !== null && exam !== null && !Number.isNaN(ca) && !Number.isNaN(exam) && ca + exam > 100) {
    errors.push("Total must not exceed 100.");
  }

  return errors;
}

export function validateResultUpload(options: ValidateResultUploadOptions): UploadValidationResult {
  const parsed = parseResultTemplate(options.fileBase64);
  const studentsByCode = new Map(options.students.map((student) => [student.permanentCode.toLowerCase(), student]));
  const existingKeys = new Set(options.existingResults.map((result) => `${result.student_id}:${result.subject_id}`));
  const rowStudentCodes = new Map<string, number>();
  const messages: string[] = [];

  parsed.rows.forEach((row) => {
    const key = row.studentCode.toLowerCase();

    if (key) {
      rowStudentCodes.set(key, (rowStudentCodes.get(key) ?? 0) + 1);
    }
  });

  const duplicateStudentCodes = new Set(Array.from(rowStudentCodes.entries()).filter(([, count]) => count > 1).map(([code]) => code));

  if (parsed.missingIdentityHeaders.length > 0) {
    messages.push(`Missing required headers: ${parsed.missingIdentityHeaders.join(", ")}.`);
  }

  if (parsed.unknownSubjectColumns.length > 0) {
    messages.push(`Unknown subject columns were ignored: ${parsed.unknownSubjectColumns.join(", ")}.`);
  }

  const missingSubjectColumns = options.subjects.flatMap((subject) => {
    const columns = findSubjectColumns(subject, parsed.subjectColumns);
    const missing: string[] = [];

    if (!columns?.caHeader) missing.push(`${subject.name} CA (0-40)`);
    if (!columns?.examHeader) missing.push(`${subject.name} Exam (0-60)`);
    if (!columns?.remarkHeader) missing.push(`${subject.name} Remark`);

    return missing;
  });

  if (missingSubjectColumns.length > 0) {
    messages.push(`Missing subject columns: ${missingSubjectColumns.join(", ")}.`);
  }

  const rows: UploadPreviewRow[] = parsed.rows.flatMap((templateRow) => {
    const student = studentsByCode.get(templateRow.studentCode.toLowerCase());
    const base = getBaseRowErrors({
      className: options.className,
      duplicateStudentCodes,
      rowStudentCodes,
      student,
      studentCode: templateRow.studentCode,
      admissionNumber: templateRow.admissionNumber,
      uploadedClassName: templateRow.className,
    });

    return options.subjects.map((subject) => {
      const subjectColumns = findSubjectColumns(subject, parsed.subjectColumns);
      const ca = numberFromCell(subjectColumns?.caHeader ? templateRow.values[subjectColumns.caHeader] : null);
      const exam = numberFromCell(subjectColumns?.examHeader ? templateRow.values[subjectColumns.examHeader] : null);
      const remark = textFromCell(subjectColumns?.remarkHeader ? templateRow.values[subjectColumns.remarkHeader] : "");
      const errors = [
        ...base.errors,
        ...(subjectColumns ? [] : [`Missing columns for ${subject.name}.`]),
        ...scoreErrors(ca, exam),
      ];
      const warnings = [...base.warnings];
      const total = ca !== null && exam !== null && !Number.isNaN(ca) && !Number.isNaN(exam) ? ca + exam : null;
      const isExistingDuplicate = Boolean(student && existingKeys.has(`${student.id}:${subject.id}`));

      if (isExistingDuplicate) {
        warnings.push(
          options.duplicateStrategy === "replace"
            ? "Existing result will be replaced."
            : "Existing result will be skipped.",
        );
      }

      const status = errors.length
        ? "invalid"
        : isExistingDuplicate
          ? "duplicate"
          : warnings.length
            ? "warning"
            : "valid";

      return {
        rowId: `${templateRow.rowNumber}-${subject.id}`,
        rowNumber: templateRow.rowNumber,
        status,
        studentId: student?.id,
        studentCode: templateRow.studentCode,
        studentName: student ? student.name : templateRow.studentName,
        admissionNumber: templateRow.admissionNumber,
        subjectId: subject.id,
        subjectName: subject.name,
        ca: Number.isNaN(ca) ? null : ca,
        exam: Number.isNaN(exam) ? null : exam,
        total,
        grade: total === null ? "N/A" : calculateGrade(total).grade,
        remark,
        classTeacherComment: templateRow.classTeacherComment,
        errors,
        warnings,
        isExistingDuplicate,
      } satisfies UploadPreviewRow;
    });
  });

  const invalidRows = rows.filter((row) => row.status === "invalid").length;
  const duplicateRows = rows.filter((row) => row.status === "duplicate").length;
  const warningRows = rows.filter((row) => row.status === "warning").length;

  return {
    ok: true,
    className: options.className,
    term: options.term,
    academicYear: options.academicYear,
    duplicateStrategy: options.duplicateStrategy,
    rows,
    summary: {
      totalRows: rows.length,
      validRows: rows.filter((row) => row.status === "valid" || row.status === "warning" || row.status === "duplicate").length,
      invalidRows,
      duplicateRows,
      warningRows,
      studentsFound: new Set(rows.filter((row) => row.studentId).map((row) => row.studentId)).size,
      subjectsFound: options.subjects.length,
      messages,
    },
  };
}

export function getSavableRows(result: UploadValidationResult) {
  return result.rows.filter((row) => row.status !== "invalid" && row.studentId && row.subjectId);
}
