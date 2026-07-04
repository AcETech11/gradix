"use server";

import { redirect } from "next/navigation";

import { buildAppUrl } from "@/lib/auth/app-url";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getRequestIp } from "@/lib/registration/utils";
import { registrationSchema, resendVerificationSchema } from "@/lib/registration/schema";
import { createClient } from "@/lib/supabase/server";
import type { RegistrationActionState, RegistrationRedirect } from "@/types/registration";

function validationErrorState<TData = unknown>(
  message: string,
  fieldErrors?: Record<string, string[] | undefined>,
): RegistrationActionState<TData> {
  return {
    ok: false,
    message,
    fieldErrors,
  };
}

function getDuplicateEmailMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("already") || normalized.includes("exists")) {
    return "That email is already registered. Try logging in or use another school email.";
  }

  return getAuthErrorMessage(message);
}

export async function registerSchoolOwnerAction(input: unknown): Promise<RegistrationActionState<RegistrationRedirect>> {
  const parsed = registrationSchema.safeParse(input);

  if (!parsed.success) {
    return validationErrorState("Check the highlighted fields and try again.", parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const ip = await getRequestIp();
  const emailRedirectTo = await buildAppUrl("/auth/callback?next=/onboarding");

  try {
    await supabase.rpc("check_registration_rate_limit", {
      source_email: parsed.data.schoolEmail,
      source_ip: ip,
    });
  } catch {
    return {
      ok: false,
      message: "Too many registration attempts. Please wait a few minutes and try again.",
    };
  }

  const { error } = await supabase.auth.signUp({
    email: parsed.data.schoolEmail,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phoneNumber,
        registration_type: "school_owner",
      },
      emailRedirectTo,
    },
  });

  if (error) {
    return {
      ok: false,
      message: getDuplicateEmailMessage(error.message),
    };
  }

  return {
    ok: true,
    message: "We sent a verification link to your email address.",
    data: {
      redirectTo: `/verify-email?email=${encodeURIComponent(parsed.data.schoolEmail)}`,
    },
  };
}

export async function resendVerificationAction(input: unknown): Promise<RegistrationActionState> {
  const parsed = resendVerificationSchema.safeParse(input);

  if (!parsed.success) {
    return validationErrorState("Enter the email address you used to register.", parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const ip = await getRequestIp();
  const emailRedirectTo = await buildAppUrl("/auth/callback?next=/onboarding");

  try {
    await supabase.rpc("check_registration_rate_limit", {
      source_email: parsed.data.schoolEmail,
      source_ip: ip,
    });
  } catch {
    return {
      ok: false,
      message: "Too many verification emails were requested. Please wait and try again.",
    };
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.schoolEmail,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    return {
      ok: false,
      message: getDuplicateEmailMessage(error.message),
    };
  }

  return {
    ok: true,
    message: "A new verification link has been sent.",
  };
}

export async function completeRegistrationAction() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("finalize_school_registration");

  if (error) {
    throw new Error(error.message);
  }

  redirect("/register/success");
}
