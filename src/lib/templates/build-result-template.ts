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
  const instruction = [
    "Do not edit Student Code, Student Name, Admission Number, or Class. Only fill CA, Exam, and Remark columns.",
  ];
  const headers = ["Student Code", "Student Name", "Admission Number", "Class"];

  input.subjects.forEach((subject) => {
    headers.push(`${subject.name} CA (0-40)`, `${subject.name} Exam (0-60)`, `${subject.name} Remark`);
  });

  const students =
    input.students.length > 0
      ? input.students
      : input.includeSampleRows
        ? Array.from({ length: 5 }, (_, index) => ({
            permanentCode: `STUDENT-CODE-${index + 1}`,
            admissionNumber: `ADM-${String(index + 1).padStart(3, "0")}`,
            name: `Student Name ${index + 1}`,
            className: input.className,
          }))
        : [];

  const rows = students.map((student) => {
    const row = [student.permanentCode, student.name, student.admissionNumber, student.className];

    input.subjects.forEach(() => {
      row.push("", "", "");
    });

    return row;
  });

  return [instruction, headers, ...rows];
}

function setWorksheetPresentation(worksheet: XLSX.WorkSheet, columnCount: number) {
  worksheet["!freeze"] = { xSplit: 0, ySplit: 2 };
  worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(columnCount - 1, 0) } }];
  worksheet["!rows"] = [{ hpt: 34 }, { hpt: 24 }];
  worksheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 1, c: 0 },
      e: { r: 1, c: Math.max(columnCount - 1, 0) },
    }),
  };
  worksheet["!cols"] = Array.from({ length: columnCount }, (_, index) => {
    if (index === 0) {
      return { wch: 18 };
    }

    if (index === 1) {
      return { wch: 28 };
    }

    if (index === 2) {
      return { wch: 20 };
    }

    if (index === 3) {
      return { wch: 18 };
    }

    return { wch: index % 3 === 0 ? 28 : 20 };
  });
  applyHeaderPresentation(worksheet, columnCount);
}

function applyHeaderPresentation(worksheet: XLSX.WorkSheet, columnCount: number) {
  const instructionCell = worksheet[XLSX.utils.encode_cell({ r: 0, c: 0 })];

  if (instructionCell) {
    instructionCell.s = {
      font: { bold: true, color: { rgb: "7C2D12" } },
      fill: { fgColor: { rgb: "FFEDD5" } },
      alignment: { wrapText: true },
    };
  }

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const headerCell = worksheet[XLSX.utils.encode_cell({ r: 1, c: columnIndex })];

    if (headerCell) {
      headerCell.s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "0F172A" } },
        alignment: { wrapText: true },
      };
    }
  }
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
    ["Each row is one student."],
    ["Do not edit Student Code, Student Name, Admission Number, or Class."],
    ["Only fill columns ending with CA (0-40), Exam (0-60), and Remark."],
    ["CA score columns must contain numbers from 0 to 40."],
    ["Exam score columns must contain numbers from 0 to 60."],
    ["Remark columns are optional."],
    ["Do not rename headers."],
    ["Do not delete columns."],
    ["Save as .xlsx before uploading."],
    [],
    ["Score Columns"],
    ...input.subjects.flatMap((subject) => [
      [`${subject.name} CA (0-40)`, "Enter continuous assessment score."],
      [`${subject.name} Exam (0-60)`, "Enter exam score."],
      [`${subject.name} Remark`, "Optional teacher comment."],
    ]),
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
    ["Class Summary"],
    ["Class Name", input.className],
    ["Total Students", input.students.length],
    ["Total Subjects", input.subjects.length],
    [],
    ["Subjects Used In Template"],
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

  setWorksheetPresentation(templateSheet, templateRows[1]?.length ?? 4);
  instructionsSheet["!cols"] = [{ wch: 52 }, { wch: 42 }];
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
      ...(input.students.length === 0 && input.includeSampleRows
        ? ["This is a blank sample template. Replace sample rows only after adding real students in Gradix."]
        : []),
    ],
  };
}
