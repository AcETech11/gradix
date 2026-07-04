import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { finalizeVerifiedRegistration } from "@/lib/registration/service";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      {
        ok: false,
        message: "Missing verification code.",
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "This verification link has expired. Request a new one and try again.",
      },
      { status: 400 },
    );
  }

  const result = await finalizeVerifiedRegistration();
  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("id", result.school_id)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    redirectTo: school ? "/onboarding" : "/login?error=school_missing",
  });
}
