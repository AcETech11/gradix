import { z } from "zod";

export const resultTemplateSchema = z.object({
  classId: z.string().uuid("Select a class."),
  term: z.enum(["first", "second", "third"], {
    message: "Select a term.",
  }),
  academicYear: z.string().regex(/^[0-9]{4}\/[0-9]{4}$/, "Use an academic year like 2025/2026."),
});

export type ResultTemplateInput = z.infer<typeof resultTemplateSchema>;
export type ResultTemplateFormValues = z.input<typeof resultTemplateSchema>;

export type TemplateClassOption = {
  id: string;
  name: string;
  academicYear: string;
  teacherId: string | null;
  subjectCount: number;
  studentCount: number;
};

export type TemplateSubject = {
  id: string;
  name: string;
  code: string;
};

export type TemplateStudent = {
  permanentCode: string;
  admissionNumber: string;
  name: string;
  className: string;
};

export type ResultTemplateWorkbookInput = {
  schoolName: string;
  className: string;
  term: ResultTemplateInput["term"];
  academicYear: string;
  subjects: TemplateSubject[];
  students: TemplateStudent[];
};

export type GeneratedTemplateFile = {
  fileName: string;
  base64: string;
  mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  warnings: string[];
};
