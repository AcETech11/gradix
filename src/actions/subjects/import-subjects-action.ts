"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { requireCanManageResultOperations } from "@/lib/auth/authorization";
import { subjectImportRowsSchema, type SubjectImportRowsInput } from "@/lib/subjects/schema";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/types/auth";

function mapZodErrors(error: ZodError) {
  return error.issues.reduce<Record<string, string[]>>((accumulator, issue) => {
    const field = issue.path.map((part) => String(part)).join(".");
    accumulator[field] = [...(accumulator[field] ?? []), issue.message];
    return accumulator;
  }, {});
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

export async function importSubjectsAction(
  input: SubjectImportRowsInput,
): Promise<AuthActionState<{ imported: number; linked: number; skipped: number }>> {
  const parsed = subjectImportRowsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Review the subject import file and try again.",
      fieldErrors: mapZodErrors(parsed.error),
    };
  }

  try {
    const profile = await requireCanManageResultOperations();
    const supabase = await createClient();
    const [classesResult, subjectsResult, assignmentsResult] = await Promise.all([
      supabase.from("classes").select("id, name").eq("school_id", profile.school_id).eq("is_active", true),
      supabase.from("subjects").select("id, name, code").eq("school_id", profile.school_id),
      supabase.from("class_subjects").select("class_id, subject_id").eq("school_id", profile.school_id),
    ]);

    if (classesResult.error || subjectsResult.error || assignmentsResult.error) {
      throw classesResult.error ?? subjectsResult.error ?? assignmentsResult.error;
    }

    const classByName = new Map((classesResult.data ?? []).map((row) => [normalizeKey(row.name), row]));
    const subjectByCode = new Map((subjectsResult.data ?? []).map((row) => [normalizeKey(row.code), row]));
    const assignmentKeys = new Set((assignmentsResult.data ?? []).map((row) => `${row.class_id}:${row.subject_id}`));
    const seenImportPairs = new Set<string>();
    let imported = 0;
    let linked = 0;
    let skipped = 0;

    for (const row of parsed.data) {
      const schoolClass = classByName.get(normalizeKey(row.className));

      if (!schoolClass) {
        skipped += 1;
        continue;
      }

      const code = row.subjectCode.trim().toUpperCase();
      const pairKey = `${schoolClass.id}:${code}`;

      if (seenImportPairs.has(pairKey)) {
        skipped += 1;
        continue;
      }

      seenImportPairs.add(pairKey);
      let subject = subjectByCode.get(normalizeKey(code));

      if (!subject) {
        const { data, error } = await supabase
          .from("subjects")
          .insert({
            school_id: profile.school_id,
            name: row.subjectName.trim(),
            code,
            is_active: true,
            metadata: {
              category: row.category?.trim() || null,
              is_compulsory: row.isCompulsory === "yes",
              source: "bulk_import",
              imported_at: new Date().toISOString(),
            },
          })
          .select("id, name, code")
          .single();

        if (error || !data) {
          throw error ?? new Error("Subject could not be created.");
        }

        subject = data;
        subjectByCode.set(normalizeKey(code), subject);
        imported += 1;
      }

      const assignmentKey = `${schoolClass.id}:${subject.id}`;

      if (assignmentKeys.has(assignmentKey)) {
        skipped += 1;
        continue;
      }

      const { error } = await supabase.from("class_subjects").insert({
        school_id: profile.school_id,
        class_id: schoolClass.id,
        subject_id: subject.id,
        is_active: true,
      });

      if (error) {
        throw error;
      }

      assignmentKeys.add(assignmentKey);
      linked += 1;
    }

    await supabase.from("audit_logs").insert({
      school_id: profile.school_id,
      actor_id: profile.id,
      actor_role: profile.role,
      action: "insert",
      table_name: "subjects",
      details: {
        security_event: "subjects_imported",
        imported,
        linked,
        skipped,
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/templates");

    return {
      ok: true,
      message: "Subjects imported successfully.",
      data: { imported, linked, skipped },
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Subjects could not be imported.",
    };
  }
}
