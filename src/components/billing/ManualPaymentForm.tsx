"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

import { submitManualPaymentAction } from "@/actions/billing/manual-payment-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { paymentProofMaxBytes, paymentProofMimeTypes, paymentSubmissionSchema, type PaymentSubmissionInput } from "@/lib/billing/payment-schema";

type ManualPaymentFormProps = {
  paymentRequestId: string;
  paymentReference: string;
  amountExpected: number;
  disabled?: boolean;
};

export function ManualPaymentForm({ paymentRequestId, paymentReference, amountExpected, disabled = false }: ManualPaymentFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const form = useForm<PaymentSubmissionInput>({
    resolver: zodResolver(paymentSubmissionSchema),
    defaultValues: {
      paymentRequestId,
      paymentReference,
      amountPaid: amountExpected,
      paidAt: new Date().toISOString().slice(0, 10),
      payerName: "",
      payerBank: "",
      bankTransferReference: "",
      proofFileName: "",
      proofMimeType: "image/jpeg",
      proofBase64: "",
      proofSize: 0,
      note: "",
    },
  });
  const proofFileName = useWatch({ control: form.control, name: "proofFileName" });

  async function loadFile(file: File) {
    if (!paymentProofMimeTypes.includes(file.type as (typeof paymentProofMimeTypes)[number])) {
      form.setError("proofFileName", { message: "Proof of payment must be JPG, PNG, or PDF." });
      return;
    }

    if (file.size > paymentProofMaxBytes) {
      form.setError("proofFileName", { message: "Proof of payment must be 5 MB or smaller." });
      return;
    }

    const base64 = await fileToBase64(file);

    form.setValue("proofFileName", file.name, { shouldValidate: true });
    form.setValue("proofMimeType", file.type as PaymentSubmissionInput["proofMimeType"], { shouldValidate: true });
    form.setValue("proofBase64", base64, { shouldValidate: true });
    form.setValue("proofSize", file.size, { shouldValidate: true });
  }

  function submit(values: PaymentSubmissionInput) {
    setMessage("");
    startTransition(async () => {
      const result = await submitManualPaymentAction(values);
      setMessage(result.message);

      if (result.ok) {
        form.reset(values);
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400" disabled={disabled} onClick={() => setOpen((value) => !value)} type="button">
        I Have Made Payment
      </Button>
      {message ? <p className={`mt-3 text-sm ${message.includes("successfully") ? "text-emerald-300" : "text-red-300"}`}>{message}</p> : null}
      {open ? (
        <form className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4" onSubmit={form.handleSubmit(submit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field error={form.formState.errors.amountPaid?.message} label="Amount Paid">
              <Input min={1} step="0.01" type="number" {...form.register("amountPaid")} />
            </Field>
            <Field error={form.formState.errors.paidAt?.message} label="Date Paid">
              <Input type="date" {...form.register("paidAt")} />
            </Field>
            <Field error={form.formState.errors.payerName?.message} label="Payer / Account Name">
              <Input {...form.register("payerName")} />
            </Field>
            <Field error={form.formState.errors.payerBank?.message} label="Bank Used for Transfer">
              <Input {...form.register("payerBank")} />
            </Field>
            <Field error={form.formState.errors.bankTransferReference?.message} label="Transfer Reference / Narration Used">
              <Input {...form.register("bankTransferReference")} />
            </Field>
            <Field error={form.formState.errors.paymentReference?.message} label="Gradix Payment Reference">
              <Input readOnly {...form.register("paymentReference")} />
            </Field>
          </div>
          <Field error={form.formState.errors.proofFileName?.message} label="Proof of Payment">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-900/60 px-4 py-6 text-center text-sm text-slate-300 hover:border-orange-300/50">
              <UploadCloud className="size-6 text-orange-200" />
              <span className="mt-2 font-medium text-slate-100">{proofFileName || "Upload JPG, PNG, or PDF proof"}</span>
              <span className="mt-1 text-xs text-slate-500">Maximum 5 MB</span>
              <input accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="sr-only" onChange={(event) => event.target.files?.[0] && void loadFile(event.target.files[0])} type="file" />
            </label>
          </Field>
          <Field error={form.formState.errors.note?.message} label="Optional Note">
            <textarea className="min-h-24 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-orange-400/40" {...form.register("note")} />
          </Field>
          <Button className="w-full bg-orange-500 text-slate-950 hover:bg-orange-400 md:w-fit" disabled={pending} type="submit">
            {pending ? "Submitting..." : "Submit Payment for Verification"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm text-slate-200">
      <span>{label}</span>
      <div className="[&_input]:border-white/10 [&_input]:bg-slate-950/60 [&_input]:text-slate-100">{children}</div>
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
    </label>
  );
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read proof file."));
    reader.readAsDataURL(file);
  });
}
