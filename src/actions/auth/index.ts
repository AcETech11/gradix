"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthErrorMessage, isBlockedProfile } from "@/lib/auth/errors";
import { getRoleHomePath, isDashboardRole } from "@/lib/auth/permissions";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState, LoginRedirect } from "@/types/auth";

function validationErrorState<TData = unknown>(
  message: string,
  fieldErrors?: Record<string, string[] | undefined>,
): AuthActionState<TData> {
  return {
    ok: false,
    message,
    fieldErrors,
  };
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return origin;
  }

  const host = headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

export async function loginAction(input: unknown): Promise<AuthActionState<LoginRedirect>> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return validationErrorState("Check the highlighted fields and try again.", parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const { email, password, rememberSession } = parsed.data;
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      ok: false,
      message: getAuthErrorMessage(error.message),
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "Your session could not be verified. Try signing in again.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role, is_active, metadata")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();

    return {
      ok: false,
      message: "Your account is not connected to a Gradix school yet.",
    };
  }

  if (!profile.is_active || isBlockedProfile(profile.metadata)) {
    await supabase.auth.signOut();

    return {
      ok: false,
      message: "This account is inactive or blocked. Contact your school administrator.",
    };
  }

  if (!isDashboardRole(profile.role)) {
    await supabase.auth.signOut();

    return {
      ok: false,
      message: "This account does not have dashboard access.",
    };
  }

  const cookieStore = await cookies();

  if (rememberSession) {
    cookieStore.set("gradix_remember_session", "true", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    cookieStore.delete("gradix_remember_session");
  }

  return {
    ok: true,
    message: "Signed in successfully.",
    data: {
      redirectTo: getSafeRedirectPath(parsed.data.redirectTo) ?? getRoleHomePath(profile.role),
    },
  };
}

export async function forgotPasswordAction(input: unknown): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return validationErrorState("Enter the email address for your account.", parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return {
      ok: false,
      message: getAuthErrorMessage(error.message),
    };
  }

  return {
    ok: true,
    message: "If an account exists for that email, a password reset link has been sent.",
  };
}

export async function resetPasswordAction(input: unknown): Promise<AuthActionState<LoginRedirect>> {
  const parsed = resetPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return validationErrorState("Check the highlighted fields and try again.", parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      ok: false,
      message: getAuthErrorMessage(error.message),
    };
  }

  return {
    ok: true,
    message: "Your password has been updated.",
    data: {
      redirectTo: "/dashboard",
    },
  };
}

export async function logoutAction() {
  const supabase = await createClient();
  const cookieStore = await cookies();

  cookieStore.delete("gradix_remember_session");
  await supabase.auth.signOut();

  redirect("/login");
}
