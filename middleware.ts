import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { canAccessDashboardPath, getRoleHomePath, isDashboardRole } from "@/lib/auth/permissions";
import { buildLoginUrl, getSafeRedirectPath, isAuthPath } from "@/lib/auth/redirects";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

function isOnboardingComplete(metadata: unknown) {
  return Boolean(
    metadata &&
      typeof metadata === "object" &&
      !Array.isArray(metadata) &&
      (metadata as Record<string, unknown>).onboarding_completed === true,
  );
}

function logAuthDebug(message: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[gradix-auth] ${message}`, details);
  }
}

function redirectToLogin(origin: string, error: string) {
  return NextResponse.redirect(buildLoginUrl(origin, undefined, error));
}

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

  logAuthDebug("middleware auth user", {
    pathname,
    authUserId: user?.id ?? null,
  });

  if (!user) {
    if (isDashboardPath || isOnboardingPath) {
      return NextResponse.redirect(buildLoginUrl(request.nextUrl.origin, `${pathname}${search}`));
    }

    return response;
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, school_id, role, is_active, metadata")
    .eq("id", user.id)
    .maybeSingle();

  logAuthDebug("middleware profile lookup", {
    authUserId: user.id,
    profileError: profileError?.message ?? null,
    profileFound: Boolean(profile),
    profileId: profile?.id ?? null,
    schoolId: profile?.school_id ?? null,
    role: profile?.role ?? null,
    isActive: profile?.is_active ?? null,
  });

  if (profileError || !profile) {
    if (isRegisterPath || isVerifyEmailPath) {
      return response;
    }

    await supabase.auth.signOut();

    return redirectToLogin(request.nextUrl.origin, "profile_missing");
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();

    return redirectToLogin(request.nextUrl.origin, "inactive");
  }

  if (!profile.role || !isDashboardRole(profile.role)) {
    await supabase.auth.signOut();

    return redirectToLogin(request.nextUrl.origin, "invalid_role");
  }

  if (!profile.school_id) {
    await supabase.auth.signOut();

    return redirectToLogin(request.nextUrl.origin, "school_missing");
  }

  const roleHome = getRoleHomePath(profile.role);
  let onboardingPath: string | null = null;
  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select("id, metadata")
    .eq("id", profile.school_id)
    .maybeSingle();

  logAuthDebug("middleware school lookup", {
    authUserId: user.id,
    profileId: profile.id,
    schoolId: profile.school_id,
    schoolError: schoolError?.message ?? null,
    schoolFound: Boolean(school),
    role: profile.role,
    isActive: profile.is_active,
  });

  if (schoolError || !school) {
    await supabase.auth.signOut();

    return redirectToLogin(request.nextUrl.origin, "school_missing");
  }

  if (profile.role === "admin" || profile.role === "headmaster") {
    if (!isOnboardingComplete(school?.metadata)) {
      onboardingPath = "/onboarding";
    }
  }

  if (isRegisterPath) {
    const redirectTarget = onboardingPath ?? roleHome;
    logAuthDebug("middleware redirect", { authUserId: user.id, redirectTarget });

    return NextResponse.redirect(new URL(redirectTarget, request.nextUrl.origin));
  }

  if (isVerifyEmailPath) {
    return NextResponse.redirect(new URL("/register/success", request.nextUrl.origin));
  }

  if (isAuthRoute && pathname !== "/reset-password") {
    const nextPath = getSafeRedirectPath(request.nextUrl.searchParams.get("next"));
    const redirectTarget = onboardingPath ?? nextPath ?? roleHome;

    logAuthDebug("middleware redirect", { authUserId: user.id, redirectTarget });

    return NextResponse.redirect(new URL(redirectTarget, request.nextUrl.origin));
  }

  if (isOnboardingPath && !["admin", "headmaster"].includes(profile.role)) {
    return NextResponse.redirect(new URL(roleHome, request.nextUrl.origin));
  }

  if (isDashboardPath && onboardingPath) {
    logAuthDebug("middleware redirect", { authUserId: user.id, redirectTarget: onboardingPath });

    return NextResponse.redirect(new URL(onboardingPath, request.nextUrl.origin));
  }

  if (isDashboardPath && !canAccessDashboardPath(profile.role, pathname)) {
    logAuthDebug("middleware redirect", { authUserId: user.id, redirectTarget: roleHome });

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
