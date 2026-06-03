import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCardHeader } from "@/components/auth/auth-card-header";
import { AuthPageSkeleton } from "@/components/auth/auth-loading";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getSafeRedirectPath } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Login",
};

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
    error?: string;
  }>;
};

function getInitialError(error?: string) {
  if (error === "account") {
    return "Your account is inactive, blocked, or not authorized for dashboard access.";
  }

  if (error === "expired") {
    return "Your session expired. Sign in again to continue.";
  }

  return undefined;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = getSafeRedirectPath(params?.next) ?? undefined;

  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <AuthShell
        title="Secure access for every school workspace."
        description="Sign in to manage academic records through a tenant-scoped, role-aware Gradix session."
      >
        <AuthCardHeader title="Welcome back" description="Use your school-issued Gradix account to continue." />
        <LoginForm redirectTo={redirectTo} initialError={getInitialError(params?.error)} />
      </AuthShell>
    </Suspense>
  );
}
