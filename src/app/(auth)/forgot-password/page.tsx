import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCardHeader } from "@/components/auth/auth-card-header";
import { AuthPageSkeleton } from "@/components/auth/auth-loading";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <AuthShell
        title="Recover access without weakening security."
        description="Password reset links are issued by Supabase Auth and validated before any account changes are accepted."
      >
        <AuthCardHeader title="Reset your password" description="Enter your account email and we will send reset instructions." />
        <ForgotPasswordForm />
      </AuthShell>
    </Suspense>
  );
}
