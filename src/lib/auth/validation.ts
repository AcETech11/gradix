import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  rememberSession: z.boolean().default(true),
  redirectTo: z.preprocess((value) => (value === "" ? undefined : value), z.string().startsWith("/").optional()),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your new password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type LoginFormValues = z.input<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ForgotPasswordFormValues = z.input<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ResetPasswordFormValues = z.input<typeof resetPasswordSchema>;
