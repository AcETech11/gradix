"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { buildAppUrl } from "@/lib/auth/app-url";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { isDashboardRole } from "@/lib/auth/permissions";
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

function logAuthDebug(message: string, details: Record<string, unknown>) {
  void message;
  void details;
  return;
}

export async function loginAction(input: unknown): Promise<AuthActionState<LoginRedirect>> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return validationErrorState("Check the highlighted fields and try again.", parsed.error.flatten().fieldErrors);
  }

  try {
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

    logAuthDebug("login auth user", {
      authUserId: user?.id ?? null,
      userError: userError?.message ?? null,
    });

    if (userError || !user) {
      return {
        ok: false,
        message: "Your session could not be verified. Try signing in again.",
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("school_id, role, is_active, metadata")
      .eq("id", user.id)
      .maybeSingle();

    logAuthDebug("login profile lookup", {
      authUserId: user.id,
      profileError: profileError?.message ?? null,
      profileFound: Boolean(profile),
      schoolId: profile?.school_id ?? null,
      role: profile?.role ?? null,
      isActive: profile?.is_active ?? null,
    });

    if (profileError) {
      await supabase.auth.signOut();

      return {
        ok: false,
        message: "We could not load your Gradix profile. Try again or contact support.",
      };
    }

    if (!profile) {
      await supabase.auth.signOut();

      return {
        ok: false,
        message: "Your Gradix profile was not created.",
      };
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();

      return {
        ok: false,
        message: "Your account is inactive.",
      };
    }

    if (!profile.role) {
      await supabase.auth.signOut();

      return {
        ok: false,
        message: "Your account role is not authorized.",
      };
    }

    if (!isDashboardRole(profile.role)) {
      await supabase.auth.signOut();

      return {
        ok: false,
        message: "Your account role is not authorized.",
      };
    }

    if (!profile.school_id) {
      await supabase.auth.signOut();

      return {
        ok: false,
        message: "Your school profile was not found.",
      };
    }

    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .select("id, metadata")
      .eq("id", profile.school_id)
      .maybeSingle();

    logAuthDebug("login school lookup", {
      authUserId: user.id,
      schoolId: profile.school_id,
      schoolError: schoolError?.message ?? null,
      schoolFound: Boolean(school),
      role: profile.role,
      isActive: profile.is_active,
    });

    if (schoolError || !school) {
      await supabase.auth.signOut();

      return {
        ok: false,
        message: "Your school profile was not found.",
      };
    }

    const cookieStore = await cookies();

    if (rememberSession) {
      cookieStore.set("gradix_remember_session", "true", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    } else {
      cookieStore.delete("gradix_remember_session");
    }

    const requestedRedirect = getSafeRedirectPath(parsed.data.redirectTo);
    const redirectTo = requestedRedirect ?? "/dashboard";

    logAuthDebug("login redirect", {
      authUserId: user.id,
      schoolId: profile.school_id,
      role: profile.role,
      isActive: profile.is_active,
      redirectTarget: redirectTo,
    });

    return {
      ok: true,
      message: "Signed in successfully.",
      data: {
        redirectTo,
      },
    };
  } catch {
    return {
      ok: false,
      message: "Sign in could not be completed. Check your connection and try again.",
    };
  }
}

export async function forgotPasswordAction(input: unknown): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return validationErrorState("Enter the email address for your account.", parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: await buildAppUrl("/auth/callback?next=/reset-password"),
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
