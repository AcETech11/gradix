"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";

import { forgotPasswordAction } from "@/actions/auth";
import { AuthSpinner } from "@/components/auth/auth-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthResult } from "@/hooks/use-auth-result";
import { logAuthDebug, logAuthError } from "@/lib/auth/debug";
import { forgotPasswordSchema, type ForgotPasswordFormValues, type ForgotPasswordInput } from "@/lib/auth/validation";

export function ForgotPasswordForm() {
  const { result, setResult, isPending, startTransition } = useAuthResult();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues, unknown, ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(values: ForgotPasswordInput) {
    logAuthDebug("forgot password submit valid", { email: values.email });
    setResult(null);
    startTransition(async () => {
      try {
        logAuthDebug("forgot password action start", { email: values.email });
        const response = await forgotPasswordAction(values);
        logAuthDebug("forgot password action response", {
          ok: response.ok,
          message: response.message,
        });
        setResult(response);
      } catch (error) {
        logAuthError("forgot password action threw", error);
        setResult({
          ok: false,
          message: "Password reset could not be started. Check your connection and try again.",
        });
      }
    });
  }

  function onInvalid(fieldErrors: unknown) {
    logAuthDebug("forgot password submit invalid", {
      fields: Object.keys(fieldErrors as Record<string, unknown>),
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit, onInvalid)}>
      {result ? (
        <div
          className={
            result.ok
              ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {result.message}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input id="email" autoComplete="email" className="pl-10" disabled={isPending} {...register("email")} />
        </div>
        {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
      </div>

      <Button
        type="submit"
        className="h-11 w-full bg-orange-600 text-white shadow-lg shadow-orange-950/20 hover:bg-orange-700"
        disabled={isPending}
        onClick={() => logAuthDebug("forgot password button clicked", { disabled: isPending })}
      >
        {isPending ? <AuthSpinner label="Sending link" /> : "Send reset link"}
      </Button>

      <Link className="block text-center text-sm font-medium text-orange-600 transition-colors hover:text-orange-700" href="/login">
        Back to login
      </Link>
    </form>
  );
}
