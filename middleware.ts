import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { canAccessDashboardPath, getRoleHomePath, isDashboardRole } from "@/lib/auth/permissions";
import { buildLoginUrl, getSafeRedirectPath, isAuthPath } from "@/lib/auth/redirects";
import { isBlockedProfile } from "@/lib/auth/errors";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isDashboardPath = pathname.startsWith("/dashboard");
  const isOnboardingPath = pathname.startsWith("/onboarding");
  const isRegisterPath = pathname.startsWith("/register");
  const isVerifyEmailPath = pathname.startsWith("/verify-email");
  const isAuthRoute = isAuthPath(pathname);

  if (!isDashboardPath && !isOnboardingPath && !isRegisterPath && !isVerifyEmailPath && !isAuthRoute) {
    return NextResponse.next();
  }

  const { response, supabase } = createMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isDashboardPath || isOnboardingPath) {
      return NextResponse.redirect(buildLoginUrl(request.nextUrl.origin, `${pathname}${search}`));
    }

    return response;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, school_id, role, is_active, metadata")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active || isBlockedProfile(profile.metadata) || !isDashboardRole(profile.role)) {
    if (isRegisterPath || isVerifyEmailPath) {
      return response;
    }

    await supabase.auth.signOut();

    return NextResponse.redirect(buildLoginUrl(request.nextUrl.origin, undefined, "account"));
  }

  const roleHome = getRoleHomePath(profile.role);

  if (isRegisterPath) {
    return NextResponse.redirect(new URL(roleHome, request.nextUrl.origin));
  }

  if (isVerifyEmailPath) {
    return NextResponse.redirect(new URL("/register/success", request.nextUrl.origin));
  }

  if (isAuthRoute && pathname !== "/reset-password") {
    const nextPath = getSafeRedirectPath(request.nextUrl.searchParams.get("next"));

    return NextResponse.redirect(new URL(nextPath ?? roleHome, request.nextUrl.origin));
  }

  if (isOnboardingPath && !["admin", "headmaster"].includes(profile.role)) {
    return NextResponse.redirect(new URL(roleHome, request.nextUrl.origin));
  }

  if (isDashboardPath && !canAccessDashboardPath(profile.role, pathname)) {
    return NextResponse.redirect(new URL(roleHome, request.nextUrl.origin));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/register/:path*",
    "/verify-email",
    "/login",
    "/forgot-password",
    "/reset-password",
  ],
};
