"use server";

import { createClient } from "@/lib/supabase/server";
import { normalizeResultCode } from "@/lib/parent-portal/normalize-result-code";
import type { PublicResultResponse } from "@/lib/parent-portal/parent-result-types";
import type { SchoolTerm } from "@/types/database";

const publicError: PublicResultResponse = {
  ok: false,
  reason: "database_error",
  message: "We could not load this result right now. Please try again later.",
};

function isSchoolTerm(value: string | undefined): value is SchoolTerm {
  return value === "first" || value === "second" || value === "third";
}

export async function getPublicResultAction({
  code,
  term,
  academicYear,
  schoolSlug,
}: {
  code: string;
  term?: string;
  academicYear?: string;
  schoolSlug?: string | null;
}): Promise<PublicResultResponse> {
  const normalizedCode = normalizeResultCode(code);

  if (!normalizedCode) {
    return {
      ok: false,
      reason: "invalid_code",
      message: "This result code is not valid. Please check the code and try again.",
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = schoolSlug
      ? await supabase.rpc("get_public_student_result_for_school", {
          input_code: normalizedCode,
          input_school_slug: schoolSlug,
          requested_term: isSchoolTerm(term) ? term : null,
          requested_academic_year: academicYear || null,
        })
      : await supabase.rpc("get_public_student_result", {
          input_code: normalizedCode,
          requested_term: isSchoolTerm(term) ? term : null,
          requested_academic_year: academicYear || null,
        });

    if (error || !data || typeof data !== "object") {
      return publicError;
    }

    return data as PublicResultResponse;
  } catch {
    return publicError;
  }
}
