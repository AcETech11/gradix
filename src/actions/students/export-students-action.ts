"use server";

import * as XLSX from "xlsx";

import { requireAdminOrHeadmaster } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { studentFiltersSchema } from "@/lib/students/schema";
import type { AuthActionState } from "@/types/auth";
import type { StudentFilters } from "@/types/students";

function cleanFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function exportStudentsAction(filtersInput?: Partial<StudentFilters>): Promise<AuthActionState<{ fileName: string; base64: string }>> {
  try {
    const profile = await requireAdminOrHeadmaster();
    const supabase = await createClient();
    const filters = studentFiltersSchema.parse(filtersInput ?? {});
    const { data: school } = await supabase.from("schools").select("name").eq("id", profile.school_id).maybeSingle();

    let query = supabase.from("students").select("*").eq("school_id", profile.school_id);

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    } else {
      query = query.eq("is_active", true);
    }

    if (filters.classId) {
      query = query.eq("class_id", filters.classId);
    }

    if (filters.query) {
      const term = filters.query.replace(/[%_]/g, "\\$&");
      query = query.or(`first_name.ilike.%${term}%,middle_name.ilike.%${term}%,last_name.ilike.%${term}%,admission_number.ilike.%${term}%,permanent_code.ilike.%${term}%`);
    }

    const [studentsResult, classesResult] = await Promise.all([
      query.order("created_at", { ascending: false }),
      supabase.from("classes").select("id, name").eq("school_id", profile.school_id),
    ]);

    if (studentsResult.error || classesResult.error) {
      throw studentsResult.error ?? classesResult.error;
    }

    const classes = new Map((classesResult.data ?? []).map((row) => [row.id, row.name]));
    const rows = (studentsResult.data ?? []).map((student) => ({
      "Student Code": student.permanent_code,
      "Student Name": [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" "),
      "Admission Number": student.admission_number ?? "",
      Class: student.class_id ? classes.get(student.class_id) ?? "" : "",
      Gender: student.gender ?? "",
      "Date of Birth": student.date_of_birth ?? "",
      "Parent/Guardian Name": student.parent_full_name ?? "",
      "Parent Phone": student.parent_phone ?? "",
      "Parent Email": student.parent_email ?? "",
      Address: student.address ?? "",
      Status: student.status,
      "Created Date": student.created_at ? new Date(student.created_at).toLocaleDateString() : "",
    }));
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [{ wch: 18 }, { wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 24 }, { wch: 18 }, { wch: 24 }, { wch: 30 }, { wch: 12 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;

    return {
      ok: true,
      message: rows.length ? "Students exported." : "No students available to export.",
      data: {
        fileName: `gradix-students-${cleanFilePart(school?.name ?? "school")}-${new Date().toISOString().slice(0, 10)}.xlsx`,
        base64: buffer.toString("base64"),
      },
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Students could not be exported.",
    };
  }
}
