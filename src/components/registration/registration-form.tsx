"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Phone, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";

import { registerSchoolOwnerAction } from "@/actions/registration";
import { AuthSpinner } from "@/components/auth/auth-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthResult } from "@/hooks/use-auth-result";
import { logAuthDebug, logAuthError } from "@/lib/auth/debug";
import { usePasswordVisibility } from "@/hooks/use-password-visibility";
import { registrationSchema, type RegistrationFormValues, type RegistrationInput } from "@/lib/registration/schema";

type RegistrationFormProps = {
  initialError?: string;
};

export function RegistrationForm({ initialError }: RegistrationFormProps) {
  const router = useRouter();
  const password = usePasswordVisibility();
  const confirmPassword = usePasswordVisibility();
  const { result, setResult, isPending, startTransition } = useAuthResult<{ redirectTo: string }>();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormValues, unknown, RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: "",
      schoolEmail: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
    },
  });

  function onSubmit(values: RegistrationInput) {
    logAuthDebug("register submit valid", {
      fullName: values.fullName,
      schoolEmail: values.schoolEmail,
      phoneNumber: values.phoneNumber,
      passwordLength: values.password.length,
    });
    setResult(null);
    startTransition(async () => {
      try {
        logAuthDebug("register action start", { schoolEmail: values.schoolEmail });
        const response = await registerSchoolOwnerAction(values);
        logAuthDebug("register action response", {
          ok: response.ok,
          message: response.message,
          redirectTo: response.data?.redirectTo ?? null,
        });
        setResult(response);

        if (response.ok && response.data?.redirectTo) {
          logAuthDebug("register redirect start", { redirectTo: response.data.redirectTo });
          router.replace(response.data.redirectTo);
          router.refresh();
        }
      } catch (error) {
        logAuthError("register action threw", error);
        setResult({
          ok: false,
          message: "Registration could not be completed. Check your connection and try again.",
        });
      }
    });
  }

  function onInvalid(fieldErrors: unknown) {
    logAuthDebug("register submit invalid", {
      fields: Object.keys(fieldErrors as Record<string, unknown>),
    });
  }

  const message = result?.message ?? initialError;
  const isError = Boolean(message && (!result || result.ok === false));

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

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input id="fullName" autoComplete="name" className="pl-10" disabled={isPending} {...register("fullName")} />
        </div>
        {errors.fullName ? <p className="text-sm text-red-600">{errors.fullName.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="schoolEmail">School Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input id="schoolEmail" autoComplete="email" className="pl-10" disabled={isPending} {...register("schoolEmail")} />
        </div>
        {errors.schoolEmail ? <p className="text-sm text-red-600">{errors.schoolEmail.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input id="phoneNumber" autoComplete="tel" className="pl-10" disabled={isPending} {...register("phoneNumber")} />
        </div>
        {errors.phoneNumber ? <p className="text-sm text-red-600">{errors.phoneNumber.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={password.passwordInputType}
            autoComplete="new-password"
            className="pr-11"
            disabled={isPending}
            {...register("password")}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            onClick={password.togglePasswordVisibility}
            aria-label={password.isPasswordVisible ? "Hide password" : "Show password"}
            disabled={isPending}
          >
            {password.isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={confirmPassword.passwordInputType}
            autoComplete="new-password"
            className="pr-11"
            disabled={isPending}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            onClick={confirmPassword.togglePasswordVisibility}
            aria-label={confirmPassword.isPasswordVisible ? "Hide password" : "Show password"}
            disabled={isPending}
          >
            {confirmPassword.isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.confirmPassword ? <p className="text-sm text-red-600">{errors.confirmPassword.message}</p> : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Use a strong password with uppercase, lowercase, numbers, and symbols.
      </div>

      <Button
        type="submit"
        className="h-11 w-full bg-orange-600 text-white shadow-lg shadow-orange-950/20 hover:bg-orange-700"
        disabled={isPending}
        onClick={() => logAuthDebug("register button clicked", { disabled: isPending })}
      >
        {isPending ? <AuthSpinner label="Creating account" /> : "Create account"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link className="font-medium text-orange-600 hover:text-orange-700" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
