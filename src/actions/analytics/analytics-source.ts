import { cache } from "react";

import { requireCanViewAnalytics } from "@/lib/auth/authorization";
import { analyticsFilterSchema, type AnalyticsFilterOptions, type AnalyticsFilters } from "@/lib/analytics/analytics-types";
import { getTermRank, TERM_LABELS } from "@/lib/analytics/analytics-formatters";
import { createClient } from "@/lib/supabase/server";
import type { SchoolTerm, TableRow } from "@/types/database";

export type AnalyticsResultRow = Pick<
  TableRow<"results">,
  "id" | "student_id" | "class_id" | "subject_id" | "term" | "academic_year" | "total_score" | "is_published"
>;

export type AnalyticsSourceData = {
  schoolId: string;
  filters: AnalyticsFilters;
  filterOptions: AnalyticsFilterOptions;
  classes: TableRow<"classes">[];
  subjects: TableRow<"subjects">[];
  students: TableRow<"students">[];
  publishedResults: AnalyticsResultRow[];
  uploads: TableRow<"result_uploads">[];
  parentAccess: TableRow<"code_term_access">[];
};

function clean(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed || undefined;
}

function normalizeFilters(input?: unknown): AnalyticsFilters {
  const parsed = analyticsFilterSchema.safeParse(input);

  if (!parsed.success) {
    return {};
  }

  return {
    academicYear: clean(parsed.data.academicYear),
    term: parsed.data.term,
    classId: clean(parsed.data.classId),
    subjectId: clean(parsed.data.subjectId),
  };
}

function resolveDefaults(results: AnalyticsResultRow[]) {
  const latest = [...results].sort((first, second) => {
    if (first.academic_year !== second.academic_year) {
      return second.academic_year.localeCompare(first.academic_year);
    }

    return getTermRank(second.term) - getTermRank(first.term);
  })[0];

  return {
    academicYear: latest?.academic_year,
    term: latest?.term,
  };
}

function applyPerformanceFilters(results: AnalyticsResultRow[], filters: AnalyticsFilters, defaults: AnalyticsFilterOptions["defaults"]) {
  const academicYear = filters.academicYear ?? defaults.academicYear;
  const term = filters.term ?? defaults.term;

  return results.filter((result) => {
    if (academicYear && result.academic_year !== academicYear) {
      return false;
    }

    if (term && result.term !== term) {
      return false;
    }

    if (filters.classId && result.class_id !== filters.classId) {
      return false;
    }

    if (filters.subjectId && result.subject_id !== filters.subjectId) {
      return false;
    }

    return true;
  });
}

export const getAnalyticsSourceData = cache(async (input?: unknown): Promise<AnalyticsSourceData> => {
  const profile = await requireCanViewAnalytics();
  const filters = normalizeFilters(input);
  const supabase = await createClient();

  const [classesResult, subjectsResult, studentsResult, resultsResult, uploadsResult, parentAccessResult] = await Promise.all([
    supabase.from("classes").select("*").eq("school_id", profile.school_id).eq("is_active", true).order("name"),
    supabase.from("subjects").select("*").eq("school_id", profile.school_id).eq("is_active", true).order("name"),
    supabase.from("students").select("*").eq("school_id", profile.school_id),
    supabase
      .from("results")
      .select("id, student_id, class_id, subject_id, term, academic_year, total_score, is_published")
      .eq("school_id", profile.school_id)
      .eq("is_published", true)
      .limit(5000),
    supabase.from("result_uploads").select("*").eq("school_id", profile.school_id).order("created_at", { ascending: false }).limit(1000),
    supabase.from("code_term_access").select("*").eq("school_id", profile.school_id).order("last_used_at", { ascending: false }).limit(1000),
  ]);

  for (const result of [classesResult, subjectsResult, studentsResult, resultsResult, uploadsResult, parentAccessResult]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const publishedResults = (resultsResult.data ?? []) as AnalyticsResultRow[];
  const defaults = resolveDefaults(publishedResults);
  const filterOptions: AnalyticsFilterOptions = {
    academicYears: Array.from(new Set(publishedResults.map((result) => result.academic_year)))
      .sort((first, second) => second.localeCompare(first))
      .map((year) => ({ value: year, label: year })),
    terms: (["first", "second", "third"] satisfies SchoolTerm[]).map((term) => ({ value: term, label: TERM_LABELS[term] })),
    classes: (classesResult.data ?? []).map((schoolClass) => ({ value: schoolClass.id, label: schoolClass.name })),
    subjects: (subjectsResult.data ?? []).map((subject) => ({ value: subject.id, label: subject.name })),
    defaults,
  };

  return {
    schoolId: profile.school_id,
    filters,
    filterOptions,
    classes: classesResult.data ?? [],
    subjects: subjectsResult.data ?? [],
    students: studentsResult.data ?? [],
    publishedResults: applyPerformanceFilters(publishedResults, filters, defaults),
    uploads: uploadsResult.data ?? [],
    parentAccess: parentAccessResult.data ?? [],
  };
});
