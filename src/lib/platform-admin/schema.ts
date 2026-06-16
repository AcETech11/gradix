import { z } from "zod";

export const subscriptionUpdateSchema = z.object({
  schoolId: z.string().uuid(),
  subscriptionStatus: z.enum(["trial", "active", "expired", "suspended"]),
  subscriptionPlan: z.enum(["starter", "standard", "premium"]),
  subscriptionExpiresAt: z.string().optional(),
  studentLimit: z.coerce.number().int().min(1).max(100000),
  billingNote: z.string().trim().max(500).optional(),
});

export const demoRequestStatusSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["new", "contacted", "demo_booked", "converted", "not_interested"]),
});

export type SubscriptionUpdateInput = z.input<typeof subscriptionUpdateSchema>;
export type DemoRequestStatusInput = z.input<typeof demoRequestStatusSchema>;
