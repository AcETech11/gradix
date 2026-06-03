"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";

import { resetPasswordAction } from "@/actions/auth";
import { AuthSpinner } from "@/components/auth/auth-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthResult } from "@/hooks/use-auth-result";
import { usePasswordVisibility } from "@/hooks/use-password-visibility";
import { resetPasswordSchema, type ResetPasswordFormValues, type ResetPasswordInput } from "@/lib/auth/validation";

export function ResetPasswordForm() {
  const router = useRouter();
  const password = usePasswordVisibility();
  const confirmPassword = usePasswordVisibility();
  const { result, setResult, isPending, startTransition } = useAuthResult<{ redirectTo: string }>();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues, unknown, ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: ResetPasswordInput) {
    setResult(null);
    startTransition(async () => {
      const response = await resetPasswordAction(values);
      setResult(response);

      if (response.ok && response.data?.redirectTo) {
        router.replace(response.data.redirectTo);
        router.refresh();
      }
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
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
        <Label htmlFor="password">New password</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="password"
            type={password.passwordInputType}
            autoComplete="new-password"
            className="pl-10 pr-11"
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
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="confirmPassword"
            type={confirmPassword.passwordInputType}
            autoComplete="new-password"
            className="pl-10 pr-11"
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

      <Button className="h-11 w-full bg-orange-600 text-white shadow-lg shadow-orange-950/20 hover:bg-orange-700" disabled={isPending}>
        {isPending ? <AuthSpinner label="Updating password" /> : "Update password"}
      </Button>
    </form>
  );
}
