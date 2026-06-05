import * as XLSX from "xlsx";

import type { GeneratedTemplateFile, ResultTemplateWorkbookInput } from "@/lib/templates/template-types";

const MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" as const;

function titleCaseTerm(term: string) {
  return `${term.charAt(0).toUpperCase()}${term.slice(1)} Term`;
}

function sanitizeFilePart(value: string) {
  return value
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function getTemplateRows(input: ResultTemplateWorkbookInput) {
  const headers = ["Student ID", "Admission Number", "Student Name", "Class"];

  input.subjects.forEach((subject) => {
    headers.push(`${subject.name} CA`, `${subject.name} Exam`, `${subject.name} Remark`);
  });

  const students =
    input.students.length > 0
      ? input.students
      : Array.from({ length: 5 }, (_, index) => ({
          permanentCode: `STUDENT-CODE-${index + 1}`,
          admissionNumber: `ADM-${String(index + 1).padStart(3, "0")}`,
          name: `Student Name ${index + 1}`,
          className: input.className,
        }));

  const rows = students.map((student) => {
    const row = [student.permanentCode, student.admissionNumber, student.name, student.className];

    input.subjects.forEach(() => {
      row.push("", "", "");
    });

    return row;
  });

  return [headers, ...rows];
}

function setWorksheetPresentation(worksheet: XLSX.WorkSheet, columnCount: number) {
  worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  worksheet["!cols"] = Array.from({ length: columnCount }, (_, index) => {
    if (index === 0) {
      return { wch: 18 };
    }

    if (index === 1) {
      return { wch: 20 };
    }

    if (index === 2) {
      return { wch: 28 };
    }

    if (index === 3) {
      return { wch: 18 };
    }

    return { wch: index % 3 === 0 ? 24 : 16 };
  });
}

function buildInstructionsSheet(input: ResultTemplateWorkbookInput) {
  return XLSX.utils.aoa_to_sheet([
    ["Gradix Result Template Instructions"],
    ["School", input.schoolName],
    ["Class", input.className],
    ["Term", titleCaseTerm(input.term)],
    ["Academic Year", input.academicYear],
    [],
    ["Instruction"],
    ["Do not change column headers."],
    ["CA score must be between 0 and 40."],
    ["Exam score must be between 0 and 60."],
    ["Do not delete Student ID."],
    ["Fill only score and remark columns."],
    ["Save as .xlsx before uploading."],
    ["One row equals one student."],
  ]);
}

function buildGradingGuideSheet() {
  return XLSX.utils.aoa_to_sheet([
    ["Score Range", "Grade", "Meaning"],
    ["70 - 100", "A", "Excellent"],
    ["60 - 69", "B", "Good"],
    ["50 - 59", "C", "Credit"],
    ["40 - 49", "D", "Pass"],
    ["0 - 39", "F", "Fail"],
  ]);
}

function buildClassSubjectsSheet(input: ResultTemplateWorkbookInput) {
  return XLSX.utils.aoa_to_sheet([
    ["Class Name", "Subject Name", "Subject Code"],
    ...input.subjects.map((subject) => [input.className, subject.name, subject.code]),
  ]);
}

export function buildResultTemplateWorkbook(input: ResultTemplateWorkbookInput): GeneratedTemplateFile {
  const workbook = XLSX.utils.book_new();
  const templateRows = getTemplateRows(input);
  const templateSheet = XLSX.utils.aoa_to_sheet(templateRows);
  const instructionsSheet = buildInstructionsSheet(input);
  const gradingGuideSheet = buildGradingGuideSheet();
  const classSubjectsSheet = buildClassSubjectsSheet(input);

  setWorksheetPresentation(templateSheet, templateRows[0]?.length ?? 4);
  instructionsSheet["!cols"] = [{ wch: 36 }, { wch: 32 }];
  gradingGuideSheet["!cols"] = [{ wch: 16 }, { wch: 12 }, { wch: 18 }];
  classSubjectsSheet["!cols"] = [{ wch: 24 }, { wch: 28 }, { wch: 18 }];

  XLSX.utils.book_append_sheet(workbook, templateSheet, "Results Template");
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");
  XLSX.utils.book_append_sheet(workbook, gradingGuideSheet, "Grading Guide");
  XLSX.utils.book_append_sheet(workbook, classSubjectsSheet, "Class Subjects");

  const base64 = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "base64",
  }) as string;

  const fileName = [
    "gradix-results-template",
    sanitizeFilePart(input.className),
    sanitizeFilePart(input.term),
    input.academicYear.replace("/", "-"),
  ]
    .filter(Boolean)
    .join("-");

  return {
    fileName: `${fileName}.xlsx`,
    base64,
    mimeType: MIME_TYPE,
    warnings: [
      ...(input.subjects.length === 0 ? ["This class has no assigned subjects yet."] : []),
      ...(input.students.length === 0 ? ["This class has no students yet, so sample rows were included."] : []),
    ],
  };
}
