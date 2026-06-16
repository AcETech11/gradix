import { z } from "zod";

export const subjectImportRowSchema = z.object({
  subjectName: z.string().trim().min(1, "Subject name is required."),
  subjectCode: z.string().trim().min(1, "Subject code is required."),
  className: z.string().trim().min(1, "Class is required."),
  category: z.string().trim().optional().default(""),
  isCompulsory: z.union([z.literal("yes"), z.literal("no"), z.literal("")]).optional().default(""),
});

export const subjectImportRowsSchema = z.array(subjectImportRowSchema);

export type SubjectImportRowsInput = z.infer<typeof subjectImportRowsSchema>;
