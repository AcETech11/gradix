"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { loginAction } from "@/actions/auth";
import { AuthSpinner } from "@/components/auth/auth-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthResult } from "@/hooks/use-auth-result";
import { logAuthDebug, logAuthError } from "@/lib/auth/debug";
import { usePasswordVisibility } from "@/hooks/use-password-visibility";
import { loginSchema, type LoginFormValues, type LoginInput } from "@/lib/auth/validation";

type LoginFormProps = {
  redirectTo?: string;
  initialError?: string;
};

export function LoginForm({ redirectTo, initialError }: LoginFormProps) {
  const router = useRouter();
  const { isPasswordVisible, passwordInputType, togglePasswordVisibility } = usePasswordVisibility();
  const { result, setResult } = useAuthResult<{ redirectTo: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues, unknown, LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberSession: true,
      redirectTo,
    },
  });

  async function onSubmit(values: LoginInput) {
    logAuthDebug("login submit valid", {
      email: values.email,
      rememberSession: values.rememberSession,
      redirectTo: values.redirectTo ?? null,
    });
    setResult(null);
    setIsSubmitting(true);

    try {
      logAuthDebug("login action start", { email: values.email });
      const response = await loginAction(values);
      logAuthDebug("login action response", {
        ok: response.ok,
        message: response.message,
        redirectTo: response.data?.redirectTo ?? null,
      });
      setResult(response);

      if (response.ok && response.data?.redirectTo) {
        logAuthDebug("login redirect start", { redirectTo: response.data.redirectTo });
        router.replace(response.data.redirectTo);
        router.refresh();
      }
    } catch (error) {
      logAuthError("login action threw", error);

      setResult({
        ok: false,
        message: "Sign in could not be completed. Check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function onInvalid(fieldErrors: unknown) {
    logAuthDebug("login submit invalid", {
      fields: Object.keys(fieldErrors as Record<string, unknown>),
    });
  }

  const message = result?.message ?? initialError;
  const isError = Boolean(message && result?.ok === false) || Boolean(initialError && !result);
  const isBusy = isSubmitting;

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit, onInvalid)}>
      {message ? (
        <div
          className={
            isError
              ? "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
          }
        >
          {message}
        </div>
      ) : null}

      <input type="hidden" {...register("redirectTo")} />

      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input id="email" autoComplete="email" className="pl-10" disabled={isBusy} {...register("email")} />
        </div>
        {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password">Password</Label>
          <Link className="text-sm font-medium text-orange-600 transition-colors hover:text-orange-700" href="/forgot-password">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="password"
            type={passwordInputType}
            autoComplete="current-password"
            className="pl-10 pr-11"
            disabled={isBusy}
            {...register("password")}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            onClick={togglePasswordVisibility}
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            disabled={isBusy}
          >
            {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
      </div>

      <label className="flex items-center gap-3 text-sm text-slate-600">
        <input
          type="checkbox"
          className="size-4 rounded border-slate-300 text-orange-600 accent-orange-600"
          disabled={isBusy}
          {...register("rememberSession")}
        />
        Remember this device
      </label>

      <Button
        type="submit"
        className="h-11 w-full bg-orange-600 text-white shadow-lg shadow-orange-950/20 hover:bg-orange-700"
        disabled={isBusy}
        aria-busy={isBusy}
        onClick={() => logAuthDebug("login button clicked", { disabled: isBusy })}
      >
        {isBusy ? <AuthSpinner label="Signing in" /> : "Sign in"}
      </Button>
    </form>
  );
}
