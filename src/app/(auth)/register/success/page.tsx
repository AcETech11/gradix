import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthCardHeader } from "@/components/auth/auth-card-header";
import { RegistrationPageSkeleton } from "@/components/registration/register-loading";
import { SuccessCard } from "@/components/registration/success-card";
import { RegistrationShell } from "@/components/registration/registration-shell";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Registration Complete",
};

type RegisterSuccessPageProps = {
  searchParams?: Promise<{
    school_code?: string;
  }>;
};

export default async function RegisterSuccessPage({ searchParams }: RegisterSuccessPageProps) {
  const params = await searchParams;
  const profile = await getCurrentUserProfile();

  if (!profile && !params?.school_code) {
    redirect("/register");
  }

  let schoolCode = params?.school_code;

  if (profile) {
    const supabase = await createClient();
    const { data: school } = await supabase.from("schools").select("school_code").eq("id", profile.school_id).maybeSingle();
    schoolCode = school?.school_code ?? schoolCode;

    redirect(school ? "/dashboard" : "/onboarding");
  }

  return (
    <Suspense fallback={<RegistrationPageSkeleton />}>
      <RegistrationShell
        title="Your school tenant has been created."
        description="The admin account is ready. Finish onboarding to configure branding, classes, and subjects."
      >
        <AuthCardHeader title="Registration complete" description="You can continue into onboarding whenever you are ready." />
        <SuccessCard schoolCode={schoolCode} />
      </RegistrationShell>
    </Suspense>
  );
}
