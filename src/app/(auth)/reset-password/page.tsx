import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCardHeader } from "@/components/auth/auth-card-header";
import { AuthPageSkeleton } from "@/components/auth/auth-loading";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <AuthShell
        title="Create a stronger password for your workspace."
        description="Your recovery session is validated server-side before the new password is applied."
      >
        <AuthCardHeader title="Choose a new password" description="Use a password that is unique to your Gradix account." />
        <ResetPasswordForm />
      </AuthShell>
    </Suspense>
  );
}
