import * as XLSX from "xlsx";

import type { GeneratedTemplateFile, ResultTemplateWorkbookInput } from "@/lib/templates/template-types";
import { AFFECTIVE_TRAITS, formatTraitHeader, PSYCHOMOTOR_TRAITS } from "@/lib/reports/primary-report";

const MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" as const;
const MAIN_SHEET_NAME = "Results & Report Details";
const MAIN_INSTRUCTION_ROWS = [
  "Fill CA, Exam, Subject Remarks, Class Teacher Comment, Attendance, Affective Domain, and Psychomotor Domain ratings for each student. Do not edit Student Code, Student Name, or Class.",
  "Ratings must be whole numbers from 1 to 5.",
  "Attendance Present + Attendance Absent should normally equal the number of days school opened in the Term Details sheet.",
] as const;
const GROUP_ROW_INDEX = MAIN_INSTRUCTION_ROWS.length;
const HEADER_ROW_INDEX = GROUP_ROW_INDEX + 1;
const FIRST_DATA_ROW_INDEX = HEADER_ROW_INDEX + 1;
const REPORT_DETAIL_COLUMN_COUNT = 11;

type ColumnBand = "identity" | "ca" | "exam" | "remark" | "comment" | "attendance" | "affective" | "psychomotor";

const thinBorder = {
  top: { style: "thin", color: { rgb: "CBD5E1" } },
  bottom: { style: "thin", color: { rgb: "CBD5E1" } },
  left: { style: "thin", color: { rgb: "CBD5E1" } },
  right: { style: "thin", color: { rgb: "CBD5E1" } },
};

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
  const headers = ["Student Code", "Student Name", "Class"];

  input.subjects.forEach((subject) => {
    headers.push(`${subject.name} CA (0-40)`, `${subject.name} Exam (0-60)`, `${subject.name} Remark`);
  });
  headers.push(
    "Class Teacher Comment",
    "Attendance Present",
    "Attendance Absent",
    ...AFFECTIVE_TRAITS.map(formatTraitHeader),
    ...PSYCHOMOTOR_TRAITS.map(formatTraitHeader),
  );

  const students =
    input.students.length > 0
      ? input.students
      : input.includeSampleRows
        ? Array.from({ length: 5 }, (_, index) => ({
            permanentCode: `STUDENT-CODE-${index + 1}`,
            name: `Student Name ${index + 1}`,
            className: input.className,
          }))
        : [];

  const rows = students.map((student) => {
    const row = [student.permanentCode, student.name, student.className];

    input.subjects.forEach(() => {
      row.push("", "", "");
    });
    row.push(...Array.from({ length: REPORT_DETAIL_COLUMN_COUNT }, () => ""));

    return row;
  });

  return [...MAIN_INSTRUCTION_ROWS.map((instruction) => [instruction]), getGroupLabelRow(headers), headers, ...rows];
}

function getGroupLabelRow(headers: string[]) {
  return headers.map((header, index) => {
    if (index === 0) return "STUDENT IDENTITY - Do not edit";
    if (header.endsWith("CA (0-40)")) return "ACADEMIC RESULTS - Fill CA, Exam and Subject Remark";
    if (header === "Class Teacher Comment") return "STUDENT REPORT DETAILS";
    if (header === "Attendance Present") return "ATTENDANCE";
    if (header === formatTraitHeader(AFFECTIVE_TRAITS[0])) return "AFFECTIVE DOMAIN";
    if (header === formatTraitHeader(PSYCHOMOTOR_TRAITS[0])) return "PSYCHOMOTOR DOMAIN";

    return "";
  });
}

function getColumnBand(header: string, index: number): ColumnBand {
  if (index < 3) return "identity";
  if (header.endsWith("CA (0-40)")) return "ca";
  if (header.endsWith("Exam (0-60)")) return "exam";
  if (header.endsWith("Remark")) return "remark";
  if (header === "Class Teacher Comment") return "comment";
  if (header.startsWith("Attendance")) return "attendance";
  if ((AFFECTIVE_TRAITS as readonly string[]).some((trait) => header === formatTraitHeader(trait))) return "affective";

  return "psychomotor";
}

function setWorksheetPresentation(worksheet: XLSX.WorkSheet, columnCount: number, subjectCount: number, studentCount: number) {
  worksheet["!freeze"] = { xSplit: 3, ySplit: FIRST_DATA_ROW_INDEX };
  worksheet["!merges"] = MAIN_INSTRUCTION_ROWS.map((_, rowIndex) => ({
    s: { r: rowIndex, c: 0 },
    e: { r: rowIndex, c: Math.max(columnCount - 1, 0) },
  }));
  addGroupMerges(worksheet, columnCount, subjectCount);
  worksheet["!rows"] = [...MAIN_INSTRUCTION_ROWS.map(() => ({ hpt: 30 })), { hpt: 24 }, { hpt: 42 }];
  worksheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: HEADER_ROW_INDEX, c: 0 },
      e: { r: HEADER_ROW_INDEX, c: Math.max(columnCount - 1, 0) },
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
      return { wch: 18 };
    }

    const header = String(worksheet[XLSX.utils.encode_cell({ r: HEADER_ROW_INDEX, c: index })]?.v ?? "");

    if (header.includes("Comment") || header.includes("Remark")) {
      return { wch: 34 };
    }

    if (header.includes("Attendance")) {
      return { wch: 18 };
    }

    if (header.includes("(1-5)") || header.includes("Relationship")) {
      return { wch: 24 };
    }

    return { wch: 20 };
  });
  applyMainSheetPresentation(worksheet, columnCount, studentCount);
  addMainSheetValidation(worksheet, columnCount, studentCount);
}

function addGroupMerges(worksheet: XLSX.WorkSheet, columnCount: number, subjectCount: number) {
  const merges = worksheet["!merges"] ?? [];
  const subjectStart = 3;
  const reportStart = subjectStart + subjectCount * 3;
  const attendanceStart = reportStart + 1;
  const affectiveStart = attendanceStart + 2;
  const psychomotorStart = affectiveStart + AFFECTIVE_TRAITS.length;

  merges.push({ s: { r: GROUP_ROW_INDEX, c: 0 }, e: { r: GROUP_ROW_INDEX, c: 2 } });

  if (subjectCount > 0) {
    merges.push({ s: { r: GROUP_ROW_INDEX, c: subjectStart }, e: { r: GROUP_ROW_INDEX, c: reportStart - 1 } });
  }

  merges.push({ s: { r: GROUP_ROW_INDEX, c: reportStart }, e: { r: GROUP_ROW_INDEX, c: reportStart } });
  merges.push({ s: { r: GROUP_ROW_INDEX, c: attendanceStart }, e: { r: GROUP_ROW_INDEX, c: attendanceStart + 1 } });
  merges.push({ s: { r: GROUP_ROW_INDEX, c: affectiveStart }, e: { r: GROUP_ROW_INDEX, c: affectiveStart + AFFECTIVE_TRAITS.length - 1 } });
  merges.push({ s: { r: GROUP_ROW_INDEX, c: psychomotorStart }, e: { r: GROUP_ROW_INDEX, c: Math.max(columnCount - 1, psychomotorStart) } });
  worksheet["!merges"] = merges;
}

function applyMainSheetPresentation(worksheet: XLSX.WorkSheet, columnCount: number, studentCount: number) {
  MAIN_INSTRUCTION_ROWS.forEach((_, rowIndex) => {
    const instructionCell = worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 0 })];

    if (instructionCell) {
      instructionCell.s = {
        font: { bold: rowIndex === 0, color: { rgb: "7C2D12" } },
        fill: { fgColor: { rgb: rowIndex === 0 ? "FFEDD5" : "FFF7ED" } },
        alignment: { wrapText: true, vertical: "center" },
      };
    }
  });

  const groupFillByBand: Record<ColumnBand, string> = {
    identity: "0F172A",
    ca: "1E40AF",
    exam: "1D4ED8",
    remark: "92400E",
    comment: "0F766E",
    attendance: "0F766E",
    affective: "5B21B6",
    psychomotor: "B45309",
  };
  const headerFillByBand: Record<ColumnBand, string> = {
    identity: "0F172A",
    ca: "1D4ED8",
    exam: "2563EB",
    remark: "A16207",
    comment: "0D9488",
    attendance: "0F766E",
    affective: "6D28D9",
    psychomotor: "D97706",
  };
  const dataFillByBand: Record<ColumnBand, string> = {
    identity: "E5E7EB",
    ca: "DBEAFE",
    exam: "DBEAFE",
    remark: "FEF3C7",
    comment: "CCFBF1",
    attendance: "CCFBF1",
    affective: "EDE9FE",
    psychomotor: "FFEDD5",
  };

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const header = String(worksheet[XLSX.utils.encode_cell({ r: HEADER_ROW_INDEX, c: columnIndex })]?.v ?? "");
    const band = getColumnBand(header, columnIndex);
    const groupCell = worksheet[XLSX.utils.encode_cell({ r: GROUP_ROW_INDEX, c: columnIndex })];
    const headerCell = worksheet[XLSX.utils.encode_cell({ r: HEADER_ROW_INDEX, c: columnIndex })];

    if (groupCell) {
      groupCell.s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: groupFillByBand[band] } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: thinBorder,
      };
    }

    if (headerCell) {
      headerCell.s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: headerFillByBand[band] } },
        alignment: { wrapText: true, vertical: "center", horizontal: "center" },
        border: thinBorder,
      };
    }

    for (let rowIndex = FIRST_DATA_ROW_INDEX; rowIndex < FIRST_DATA_ROW_INDEX + studentCount; rowIndex += 1) {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
      const cell = worksheet[cellRef] ?? { t: "s", v: "" };

      cell.s = {
        fill: { fgColor: { rgb: dataFillByBand[band] } },
        alignment: { wrapText: band === "remark" || band === "comment", vertical: "top" },
        border: thinBorder,
      };
      worksheet[cellRef] = cell;
    }
  }
}

function addMainSheetValidation(worksheet: XLSX.WorkSheet, columnCount: number, studentCount: number) {
  const validations: unknown[] = [];

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const header = String(worksheet[XLSX.utils.encode_cell({ r: HEADER_ROW_INDEX, c: columnIndex })]?.v ?? "");
    const range = XLSX.utils.encode_range({
      s: { r: FIRST_DATA_ROW_INDEX, c: columnIndex },
      e: { r: Math.max(FIRST_DATA_ROW_INDEX, FIRST_DATA_ROW_INDEX + studentCount - 1), c: columnIndex },
    });

    if (header.endsWith("CA (0-40)")) {
      validations.push({ sqref: range, type: "decimal", operator: "between", formula1: "0", formula2: "40" });
    } else if (header.endsWith("Exam (0-60)")) {
      validations.push({ sqref: range, type: "decimal", operator: "between", formula1: "0", formula2: "60" });
    } else if (header.startsWith("Attendance")) {
      validations.push({ sqref: range, type: "whole", operator: "greaterThanOrEqual", formula1: "0" });
    } else if (header.includes("(1-5)")) {
      validations.push({ sqref: range, type: "whole", operator: "between", formula1: "1", formula2: "5" });
    }
  }

  if (validations.length > 0) {
    worksheet["!dataValidation"] = validations;
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
    ["Step 1", `Open "${MAIN_SHEET_NAME}". Each row is one student.`],
    ["Step 2", "For each student, fill CA, Exam, Subject Remark, Class Teacher Comment, Attendance Present, Attendance Absent, Affective Domain ratings, and Psychomotor Domain ratings."],
    ["Step 3", "Admin/headmaster opens \"Term Details\" and fills No. of Days School Opened, Term Ends, and Next Term Begins."],
    ["Step 4", "Save as .xlsx and upload to Gradix."],
    [],
    ["Do Not Edit", "Student Code, Student Name, or Class."],
    ["CA Rules", "CA score columns must contain numbers from 0 to 40."],
    ["Exam Rules", "Exam score columns must contain numbers from 0 to 60."],
    ["Remark Rules", "Subject Remark and Class Teacher Comment are optional text fields."],
    ["Attendance Rules", "Attendance Present and Attendance Absent must be whole numbers greater than or equal to 0."],
    ["Attendance Check", "Attendance Present + Attendance Absent should normally equal No. of Days School Opened in Term Details."],
    ["Header Rules", "Do not rename headers or delete columns."],
    [],
    ["Score Columns"],
    ...input.subjects.flatMap((subject) => [
      [`${subject.name} CA (0-40)`, "Enter continuous assessment score."],
      [`${subject.name} Exam (0-60)`, "Enter exam score."],
      [`${subject.name} Remark`, "Optional teacher comment."],
    ]),
    ["Class Teacher Comment", "Optional per-student class teacher report comment."],
    ["Attendance Present", "Number of days this student was present."],
    ["Attendance Absent", "Number of days this student was absent."],
    ...AFFECTIVE_TRAITS.map((trait) => [formatTraitHeader(trait), "Enter a whole-number rating from 1 to 5."]),
    ...PSYCHOMOTOR_TRAITS.map((trait) => [formatTraitHeader(trait), "Enter a whole-number rating from 1 to 5."]),
    [],
    ["Comprehensive Primary Report Sheets"],
    [MAIN_SHEET_NAME, "Student scores, attendance, affective domain, psychomotor domain, and class teacher comments."],
    ["Term Details", "Shared class/term attendance dates and days school opened."],
    ["Ratings", "Affective and psychomotor ratings must be whole numbers from 1 to 5."],
    ["Attendance", "Attendance Present and Attendance Absent must be whole numbers greater than or equal to 0."],
    [],
    ["Rating Scale"],
    ["5", "Excellent"],
    ["4", "Good"],
    ["3", "Fair but acceptable"],
    ["2", "Needs improvement"],
    ["1", "Poor"],
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

function buildTermDetailsSheet(input: ResultTemplateWorkbookInput) {
  const headers = ["Academic Year", "Term", "Class", "No. of Days School Opened", "Term Ends", "Next Term Begins"];
  const sheet = XLSX.utils.aoa_to_sheet([
    ["TERM DETAILS - ADMIN/HEADMASTER ONLY"],
    ["Admin/headmaster must complete these three fields before uploading: No. of Days School Opened, Term Ends, and Next Term Begins. Teachers do not need to fill this sheet for each student. Date format example: 24 Jul 2026."],
    headers,
    [input.academicYear, input.term, input.className, "", "", ""],
  ]);

  sheet["!freeze"] = { xSplit: 0, ySplit: 3 };
  sheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
  ];
  sheet["!rows"] = [{ hpt: 28 }, { hpt: 32 }, { hpt: 30 }, { hpt: 26 }];
  sheet["!cols"] = headers.map((header) => ({ wch: header.includes("Date") || header.includes("Term") ? 22 : 28 }));
  sheet["!dataValidation"] = [
    { sqref: "D4", type: "whole", operator: "greaterThanOrEqual", formula1: "0" },
    { sqref: "E4:F4", type: "date", operator: "greaterThan", formula1: "DATE(2000,1,1)" },
  ];

  const titleCell = sheet[XLSX.utils.encode_cell({ r: 0, c: 0 })];
  const instructionCell = sheet[XLSX.utils.encode_cell({ r: 1, c: 0 })];

  if (titleCell) {
    titleCell.s = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 15 },
      fill: { fgColor: { rgb: "0F172A" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: thinBorder,
    };
  }

  if (instructionCell) {
    instructionCell.s = {
      font: { bold: true, color: { rgb: "7C2D12" } },
      fill: { fgColor: { rgb: "FFEDD5" } },
      alignment: { wrapText: true, vertical: "center" },
      border: thinBorder,
    };
  }

  headers.forEach((header, index) => {
    const headerCell = sheet[XLSX.utils.encode_cell({ r: 2, c: index })];
    const valueCell = sheet[XLSX.utils.encode_cell({ r: 3, c: index })] ?? { t: "s", v: "" };
    const isEditable = index >= 3;

    if (headerCell) {
      headerCell.s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: isEditable ? "B45309" : "0F172A" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: thinBorder,
      };
    }

    valueCell.s = {
      fill: { fgColor: { rgb: isEditable ? "FFEDD5" : "E5E7EB" } },
      alignment: { vertical: "center", wrapText: true },
      border: thinBorder,
      ...(index >= 4 ? { numFmt: "dd mmm yyyy" } : {}),
    };
    sheet[XLSX.utils.encode_cell({ r: 3, c: index })] = valueCell;
  });

  return sheet;
}

export function buildResultTemplateWorkbook(input: ResultTemplateWorkbookInput): GeneratedTemplateFile {
  const workbook = XLSX.utils.book_new();
  const templateRows = getTemplateRows(input);
  const templateSheet = XLSX.utils.aoa_to_sheet(templateRows);
  const instructionsSheet = buildInstructionsSheet(input);
  const gradingGuideSheet = buildGradingGuideSheet();
  const classSubjectsSheet = buildClassSubjectsSheet(input);
  const termDetailsSheet = buildTermDetailsSheet(input);
  const dataRowCount = Math.max(templateRows.length - FIRST_DATA_ROW_INDEX, 0);

  setWorksheetPresentation(templateSheet, templateRows[HEADER_ROW_INDEX]?.length ?? 4, input.subjects.length, dataRowCount);
  instructionsSheet["!cols"] = [{ wch: 52 }, { wch: 42 }];
  gradingGuideSheet["!cols"] = [{ wch: 16 }, { wch: 12 }, { wch: 18 }];
  classSubjectsSheet["!cols"] = [{ wch: 24 }, { wch: 28 }, { wch: 18 }];

  XLSX.utils.book_append_sheet(workbook, templateSheet, MAIN_SHEET_NAME);
  XLSX.utils.book_append_sheet(workbook, termDetailsSheet, "Term Details");
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
