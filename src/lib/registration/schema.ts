import { z } from "zod";

const strongPasswordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128, "Use 128 characters or fewer.")
  .regex(/[a-z]/, "Add a lowercase letter.")
  .regex(/[A-Z]/, "Add an uppercase letter.")
  .regex(/[0-9]/, "Add a number.")
  .regex(/[^A-Za-z0-9]/, "Add a special character.");

export const registrationSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required."),
    schoolEmail: z.string().trim().email("Enter a valid school email."),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
    phoneNumber: z
      .string()
      .trim()
      .min(7, "Phone number is required.")
      .max(20, "Use a valid phone number.")
      .regex(/^[+0-9()\-\s]+$/, "Use digits and standard phone characters only."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

export const resendVerificationSchema = z.object({
  schoolEmail: z.string().trim().email("Enter a valid school email."),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type RegistrationFormValues = z.input<typeof registrationSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
