"use server";

import { redirect } from "next/navigation";

import { normalizeResultCode } from "@/lib/parent-portal/normalize-result-code";

export async function lookupResultCodeAction(formData: FormData) {
  const code = normalizeResultCode(String(formData.get("code") ?? ""));

  if (!code) {
    redirect("/results?error=invalid");
  }

  redirect(`/results/${encodeURIComponent(code)}`);
}
