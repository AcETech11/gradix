import { z } from "zod";

import { PROMOTION_STUDENT_STATUSES } from "@/lib/promotion/student-status";

export const academicYearSchema = z.string().regex(/^[0-9]{4}\/[0-9]{4}$/, "Use academic year format YYYY/YYYY.");

export const promotionQuerySchema = z.object({
  fromAcademicYear: academicYearSchema.optional(),
  toAcademicYear: academicYearSchema.optional(),
  fromClassId: z.string().uuid().optional(),
  toClassId: z.string().uuid().optional(),
});

export const promoteStudentsSchema = z.object({
  fromAcademicYear: academicYearSchema,
  toAcademicYear: academicYearSchema,
  fromClassId: z.string().uuid(),
  toClassId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()).min(1, "Select at least one student."),
});

export const updateStudentStatusSchema = z.object({
  academicYear: academicYearSchema,
  classId: z.string().uuid().optional(),
  studentIds: z.array(z.string().uuid()).min(1, "Select at least one student."),
  status: z.enum(PROMOTION_STUDENT_STATUSES),
});
