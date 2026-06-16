"use server";

import { demoRequestSchema, type DemoRequestInput } from "@/lib/demo/demo-request-schema";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/types/auth";

export async function requestDemoAction(input: DemoRequestInput): Promise<AuthActionState> {
  const parsed = demoRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("demo_requests").insert({
    full_name: parsed.data.fullName,
    school_name: parsed.data.schoolName,
    role: parsed.data.role,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    student_count: estimateStudentCount(parsed.data.studentCountRange),
    student_count_range: parsed.data.studentCountRange,
    preferred_plan: parsed.data.preferredPlan,
    message: parsed.data.message || null,
    status: "new",
  });

  if (error) {
    return {
      ok: false,
      message: "Something went wrong. Please try again or contact us directly.",
    };
  }

  return {
    ok: true,
    message: "Thank you. We'll contact you shortly to schedule your Gradix demo.",
  };
}

function estimateStudentCount(value: string) {
  const estimates: Record<string, number> = {
    "Under 100": 99,
    "100-300": 300,
    "301-700": 700,
    "701-1500": 1500,
    "1500+": 1501,
  };

  return estimates[value] ?? null;
}
