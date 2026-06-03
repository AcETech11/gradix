import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCardHeader } from "@/components/auth/auth-card-header";
import { RegistrationPageSkeleton } from "@/components/registration/register-loading";
import { VerifyEmailProcessor } from "@/components/registration/verify-email-processor";
import { VerifyEmailView } from "@/components/registration/verify-email-view";
import { RegistrationShell } from "@/components/registration/registration-shell";

export const metadata: Metadata = {
  title: "Verify Email",
};

type VerifyEmailPageProps = {
  searchParams?: Promise<{
    code?: string;
    email?: string;
    error?: string;
  }>;
};

function getInitialError(error?: string) {
  if (error === "expired") {
    return "This verification link has expired. Send a new link to continue.";
  }

  if (error === "account") {
    return "We could not verify that account. Try registering again.";
  }

  return undefined;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<RegistrationPageSkeleton />}>
      <RegistrationShell
        title="Verify your email address."
        description="We need to confirm the school owner's email before creating the school tenant and admin account."
      >
        <AuthCardHeader title="Check your inbox" description="Click the verification link we just sent, then we will create your school tenant." />
        {params?.code ? (
          <VerifyEmailProcessor code={params.code} email={params?.email} />
        ) : (
          <VerifyEmailView email={params?.email} initialError={getInitialError(params?.error)} />
        )}
      </RegistrationShell>
    </Suspense>
  );
}
