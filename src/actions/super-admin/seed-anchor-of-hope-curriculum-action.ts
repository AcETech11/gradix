"use server";

import { requirePlatformAdmin } from "@/lib/platform-admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const classes = ["PRIMARY 4", "PRIMARY 5", "JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"] as const;

const subjects = [
  ["Mathematics", "MAT"],
  ["English Language", "ENG"],
  ["Quantitative Reasoning", "QR"],
  ["Verbal Reasoning", "VR"],
  ["Pre-Vocational Studies", "PVS"],
  ["National Values Education", "NVE"],
  ["Christian Religious Knowledge", "CRK"],
  ["History", "HIS"],
  ["Basic Science", "BSC"],
  ["Basic Digital Technology", "BDT"],
  ["Yoruba", "YOR"],
  ["Cultural and Creative Art", "CCA"],
  ["Agricultural Science", "AGR"],
  ["Home Economics", "HEC"],
  ["Social and Citizenship Studies", "SCS"],
  ["Physical and Health Education", "PHE"],
  ["Basic Technology", "BTE"],
  ["Business Studies", "BUS"],
  ["Biology", "BIO"],
  ["Geography", "GEO"],
  ["Further Mathematics", "FMA"],
  ["Physics", "PHY"],
  ["Commerce", "COM"],
  ["Financial Accounting", "FAC"],
  ["Chemistry", "CHM"],
  ["Government", "GOV"],
  ["Citizenship and Heritage Studies", "CHS"],
  ["Literature in English", "LIT"],
  ["Economics", "ECO"],
  ["Data Processing", "DPT"],
] as const;

const primaryCodes = ["MAT", "ENG", "QR", "VR", "PVS", "NVE", "CRK", "HIS", "BSC", "BDT", "YOR", "CCA"];
const jssCodes = ["MAT", "ENG", "AGR", "HEC", "SCS", "CRK", "HIS", "BSC", "PHE", "BTE", "YOR", "CCA", "BUS"];
const sssCodes = ["MAT", "ENG", "AGR", "BIO", "GEO", "FMA", "PHY", "COM", "FAC", "CHM", "GOV", "CHS", "LIT", "CRK", "ECO", "DPT"];

function getCurrentAcademicYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = month >= 7 ? year : year - 1;

  return `${start}/${start + 1}`;
}

function codesForClass(className: string) {
  if (className.startsWith("PRIMARY")) return primaryCodes;
  if (className.startsWith("JSS")) return jssCodes;
  return sssCodes;
}

export async function seedAnchorOfHopeCurriculumAction() {
  await requirePlatformAdmin();

  const supabase = createAdminClient();
  const academicYear = getCurrentAcademicYear();
  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select("id, metadata")
    .eq("slug", "anchor-of-hope")
    .maybeSingle();

  if (schoolError || !school) {
    return { ok: false, message: schoolError?.message ?? "Anchor of Hope school was not found." };
  }

  await supabase
    .from("schools")
    .update({
      name: "ANCHOR OF HOPE SCHOOLS",
      school_code: "AOH-SCH",
      slug: "anchor-of-hope",
      metadata: { ...(typeof school.metadata === "object" && !Array.isArray(school.metadata) ? school.metadata : {}), school_code: "AOH-SCH" },
      updated_at: new Date().toISOString(),
    })
    .eq("id", school.id);

  for (const className of classes) {
    const { data: existing } = await supabase
      .from("classes")
      .select("id")
      .eq("school_id", school.id)
      .eq("academic_year", academicYear)
      .ilike("name", className)
      .maybeSingle();

    if (existing) {
      await supabase.from("classes").update({ name: className, level: className, is_active: true }).eq("id", existing.id).eq("school_id", school.id);
    } else {
      await supabase.from("classes").insert({ school_id: school.id, name: className, level: className, academic_year: academicYear, is_active: true });
    }
  }

  for (const [name, code] of subjects) {
    const { data: existing } = await supabase.from("subjects").select("id").eq("school_id", school.id).eq("code", code).maybeSingle();

    if (existing) {
      await supabase.from("subjects").update({ name, is_active: true }).eq("id", existing.id).eq("school_id", school.id);
    } else {
      await supabase.from("subjects").insert({ school_id: school.id, name, code, is_active: true });
    }
  }

  const [{ data: savedClasses }, { data: savedSubjects }] = await Promise.all([
    supabase.from("classes").select("id, name").eq("school_id", school.id).eq("academic_year", academicYear).eq("is_active", true).in("name", [...classes]),
    supabase.from("subjects").select("id, code").eq("school_id", school.id).eq("is_active", true),
  ]);
  const classByName = new Map((savedClasses ?? []).map((row) => [row.name, row.id]));
  const subjectByCode = new Map((savedSubjects ?? []).map((row) => [row.code, row.id]));

  for (const className of classes) {
    const classId = classByName.get(className);
    if (!classId) continue;

    for (const code of codesForClass(className)) {
      const subjectId = subjectByCode.get(code);
      if (!subjectId) continue;

      const { data: existing } = await supabase.from("class_subjects").select("id").eq("class_id", classId).eq("subject_id", subjectId).maybeSingle();
      if (existing) {
        await supabase.from("class_subjects").update({ school_id: school.id, is_active: true }).eq("id", existing.id);
      } else {
        await supabase.from("class_subjects").insert({ school_id: school.id, class_id: classId, subject_id: subjectId, is_active: true });
      }
    }
  }

  return { ok: true, message: "Anchor of Hope curriculum seed completed." };
}
