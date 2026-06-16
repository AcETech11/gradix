import { z } from "zod";

export const demoRequestSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  schoolName: z.string().trim().min(2, "Enter your school name."),
  role: z.string().trim().min(1, "Choose your role.").max(80),
  phone: z.string().trim().min(7, "Enter a reachable phone or WhatsApp number."),
  email: z.string().trim().email("Enter a valid email address.").optional().or(z.literal("")),
  studentCountRange: z.string().trim().min(1, "Choose your school size."),
  preferredPlan: z.string().trim().min(1, "Choose a preferred plan."),
  message: z.string().trim().max(700, "Keep the message under 700 characters.").optional(),
});

export type DemoRequestInput = z.input<typeof demoRequestSchema>;
