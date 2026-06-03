import { z } from "zod";

const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use a valid hex color.");

export const schoolInformationSchema = z.object({
  schoolName: z.string().trim().min(2, "School name is required."),
  schoolCode: z
    .string()
    .trim()
    .min(2, "School code is required.")
    .max(40, "Use 40 characters or fewer.")
    .regex(/^[a-zA-Z0-9-]+$/, "Use letters, numbers, and hyphens only."),
  schoolType: z.string().trim().min(2, "School type is required."),
  schoolAddress: z.string().trim().min(5, "School address is required."),
  schoolPhone: z.string().trim().min(7, "School phone is required."),
  schoolEmail: z.string().trim().email("Enter a valid school email."),
  principalName: z.string().trim().min(2, "Principal name is required."),
  schoolMotto: z.string().trim().optional(),
});

export const brandingSchema = z.object({
  logoUrl: z.string().url("Upload a valid logo.").optional().or(z.literal("")),
  signatureUrl: z.string().url("Upload a valid signature.").optional().or(z.literal("")),
  primaryColor: colorSchema,
  secondaryColor: colorSchema,
});

export const classRowSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Class name is required."),
  teacherId: z.string().optional().nullable(),
});

export const academicStructureSchema = z
  .object({
    classes: z.array(classRowSchema).min(1, "Create at least one class."),
  })
  .superRefine((data, context) => {
    const names = new Set<string>();

    data.classes.forEach((row, index) => {
      const key = row.name.trim().toLowerCase();

      if (names.has(key)) {
        context.addIssue({
          code: "custom",
          message: "Class names must be unique.",
          path: ["classes", index, "name"],
        });
      }

      names.add(key);
    });
  });

export const subjectRowSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Subject name is required."),
  code: z.string().trim().optional(),
  classIds: z.array(z.string()).default([]),
});

export const subjectsAssignmentsSchema = z
  .object({
    subjects: z.array(subjectRowSchema).min(1, "Create at least one subject."),
  })
  .superRefine((data, context) => {
    const names = new Set<string>();

    data.subjects.forEach((row, index) => {
      const key = row.name.trim().toLowerCase();

      if (names.has(key)) {
        context.addIssue({
          code: "custom",
          message: "Subject names must be unique.",
          path: ["subjects", index, "name"],
        });
      }

      names.add(key);
    });
  });

export type SchoolInformationInput = z.infer<typeof schoolInformationSchema>;
export type BrandingInput = z.infer<typeof brandingSchema>;
export type AcademicStructureFormValues = z.input<typeof academicStructureSchema>;
export type AcademicStructureInput = z.infer<typeof academicStructureSchema>;
export type SubjectsAssignmentsFormValues = z.input<typeof subjectsAssignmentsSchema>;
export type SubjectsAssignmentsInput = z.infer<typeof subjectsAssignmentsSchema>;
