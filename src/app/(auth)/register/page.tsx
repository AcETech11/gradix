import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCardHeader } from "@/components/auth/auth-card-header";
import { RegistrationPageSkeleton } from "@/components/registration/register-loading";
import { RegistrationForm } from "@/components/registration/registration-form";
import { RegistrationShell } from "@/components/registration/registration-shell";

export const metadata: Metadata = {
  title: "Register",
};

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getInitialError(error?: string) {
  if (error === "rate_limited") {
    return "Too many registration attempts. Please wait a few minutes and try again.";
  }

  if (error === "duplicate") {
    return "That school email is already registered.";
  }

  return undefined;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<RegistrationPageSkeleton />}>
      <RegistrationShell
        title="Create your Gradix school account."
        description="Register the school owner, verify the email address, and we will create your school tenant and admin account."
      >
        <AuthCardHeader title="Start registration" description="Set up the account that will own your Gradix school workspace." />
        <RegistrationForm initialError={getInitialError(params?.error)} />
      </RegistrationShell>
    </Suspense>
  );
}
