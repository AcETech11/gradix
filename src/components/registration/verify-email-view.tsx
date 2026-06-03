"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";

import { resendVerificationAction } from "@/actions/registration";
import { AuthSpinner } from "@/components/auth/auth-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthResult } from "@/hooks/use-auth-result";
import { resendVerificationSchema, type ResendVerificationInput } from "@/lib/registration/schema";

type VerifyEmailViewProps = {
  email?: string;
  initialError?: string;
};

export function VerifyEmailView({ email, initialError }: VerifyEmailViewProps) {
  const router = useRouter();
  const { result, setResult, isPending, startTransition } = useAuthResult();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResendVerificationInput>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: {
      schoolEmail: email ?? "",
    },
  });

  function onSubmit(values: ResendVerificationInput) {
    setResult(null);
    startTransition(async () => {
      const response = await resendVerificationAction(values);
      setResult(response);
      if (response.ok) {
        router.refresh();
      }
    });
  }

  const message = result?.message ?? initialError;

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      {message ? (
        <div
          className={
            result?.ok
              ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {message}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        We sent a verification link to your email. Open it on this device or another browser to complete school creation.
      </div>

      <div className="space-y-2">
        <Label htmlFor="schoolEmail">Email address</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input id="schoolEmail" autoComplete="email" className="pl-10" disabled={isPending} {...register("schoolEmail")} />
        </div>
        {errors.schoolEmail ? <p className="text-sm text-red-600">{errors.schoolEmail.message}</p> : null}
      </div>

      <Button className="h-11 w-full bg-orange-600 text-white shadow-lg shadow-orange-950/20 hover:bg-orange-700" disabled={isPending}>
        {isPending ? <AuthSpinner label="Resending link" /> : "Resend verification email"}
      </Button>
    </form>
  );
}
