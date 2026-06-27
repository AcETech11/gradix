import { z } from "zod";

export const paymentProofMimeTypes = ["image/jpeg", "image/png", "application/pdf"] as const;
export const paymentProofMaxBytes = 5 * 1024 * 1024;

export const paymentSubmissionSchema = z.object({
  paymentRequestId: z.string().uuid(),
  amountPaid: z.coerce.number().positive("Amount paid must be greater than 0."),
  paidAt: z.string().refine((value) => {
    const paidAt = new Date(value);
    const today = new Date();

    today.setHours(23, 59, 59, 999);

    return value && !Number.isNaN(paidAt.getTime()) && paidAt <= today;
  }, "Date paid must be valid and not in the future."),
  payerName: z.string().trim().min(2, "Payer / Account Name is required.").max(120),
  payerBank: z.string().trim().min(2, "Bank used for transfer is required.").max(120),
  bankTransferReference: z.string().trim().max(160).optional(),
  paymentReference: z.string().trim().min(8),
  proofFileName: z.string().trim().min(1, "Proof of payment is required."),
  proofMimeType: z.enum(paymentProofMimeTypes),
  proofBase64: z.string().min(1, "Proof of payment is required."),
  proofSize: z.coerce.number().int().positive().max(paymentProofMaxBytes, "Proof of payment must be 5 MB or smaller."),
  note: z.string().trim().max(500).optional(),
});

export type PaymentSubmissionInput = z.input<typeof paymentSubmissionSchema>;

export const paymentReviewSchema = z.object({
  submissionId: z.string().uuid(),
});

export const paymentRejectionSchema = z.object({
  submissionId: z.string().uuid(),
  rejectionReason: z.string().trim().min(5, "Enter a clear rejection reason.").max(500),
});

export type PaymentReviewInput = z.input<typeof paymentReviewSchema>;
export type PaymentRejectionInput = z.input<typeof paymentRejectionSchema>;
