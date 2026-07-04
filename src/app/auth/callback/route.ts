import { NextResponse, type NextRequest } from "next/server";

import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { finalizeVerifiedRegistration } from "@/lib/registration/service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.user_metadata?.registration_type === "school_owner") {
        try {
          await finalizeVerifiedRegistration();
        } catch {
          return NextResponse.redirect(new URL("/login?error=account", requestUrl.origin));
        }
      }

      return NextResponse.redirect(new URL(next ?? "/reset-password", requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=expired", requestUrl.origin));
}
