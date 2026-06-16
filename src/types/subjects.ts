export type SubjectImportRow = {
  subjectName: string;
  subjectCode: string;
  className: string;
  category?: string;
  isCompulsory?: "yes" | "no" | "";
};

export type SubjectImportPreviewRow = SubjectImportRow & {
  rowNumber: number;
  classId: string | null;
  issues: string[];
};
