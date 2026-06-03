"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { saveSchoolInformationAction } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { schoolInformationSchema, type SchoolInformationInput } from "@/lib/onboarding/schema";

type SchoolInformationStepProps = {
  defaultValues: SchoolInformationInput;
  onComplete: () => void;
};

export function SchoolInformationStep({ defaultValues, onComplete }: SchoolInformationStepProps) {
  const [message, setMessage] = useState("");
  const [lastSavedPayload, setLastSavedPayload] = useState(JSON.stringify(defaultValues));
  const [isPending, startTransition] = useTransition();
  const autosaveTimeoutRef = useRef<number | null>(null);
  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors, isDirty },
  } = useForm<SchoolInformationInput>({
    resolver: zodResolver(schoolInformationSchema),
    mode: "onChange",
    defaultValues,
  });
  const watchedValues = useWatch({ control });

  const save = useCallback((values: SchoolInformationInput, shouldAdvance = false) => {
    startTransition(async () => {
      setMessage("Saving...");
      const response = await saveSchoolInformationAction(values);
      setMessage(response.message);

      if (response.ok) {
        setLastSavedPayload(JSON.stringify(values));
        onComplete();
        if (shouldAdvance) {
          window.dispatchEvent(new CustomEvent("gradix:onboarding-next"));
        }
      }
    });
  }, [onComplete]);

  useEffect(() => {
    const payload = JSON.stringify(watchedValues);

    if (!isDirty || payload === lastSavedPayload) {
      return;
    }

    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = window.setTimeout(async () => {
      const isValid = await trigger();

      if (isValid) {
        save(watchedValues as SchoolInformationInput);
      }
    }, 1400);

    return () => {
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [isDirty, lastSavedPayload, save, trigger, watchedValues]);

  return (
    <form className="space-y-6" onSubmit={handleSubmit((values) => save(values, true))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="School name" error={errors.schoolName?.message}>
          <Input disabled={isPending} {...register("schoolName")} />
        </Field>
        <Field label="School code" error={errors.schoolCode?.message}>
          <Input disabled={isPending} {...register("schoolCode")} />
        </Field>
        <Field label="School type" error={errors.schoolType?.message}>
          <Input placeholder="Secondary school" disabled={isPending} {...register("schoolType")} />
        </Field>
        <Field label="School phone" error={errors.schoolPhone?.message}>
          <Input disabled={isPending} {...register("schoolPhone")} />
        </Field>
        <Field label="School email" error={errors.schoolEmail?.message}>
          <Input type="email" disabled={isPending} {...register("schoolEmail")} />
        </Field>
        <Field label="Principal name" error={errors.principalName?.message}>
          <Input disabled={isPending} {...register("principalName")} />
        </Field>
        <Field label="School address" error={errors.schoolAddress?.message} className="sm:col-span-2">
          <Input disabled={isPending} {...register("schoolAddress")} />
        </Field>
        <Field label="School motto" error={errors.schoolMotto?.message} className="sm:col-span-2">
          <Input disabled={isPending} {...register("schoolMotto")} />
        </Field>
      </div>
      <ActionBar isPending={isPending} message={message} />
    </form>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function ActionBar({ isPending, message }: { isPending: boolean; message: string }) {
  return (
    <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl shadow-slate-950/10 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">{message || "Autosave is enabled."}</p>
      <Button className="h-11 bg-orange-600 text-white hover:bg-orange-700" disabled={isPending}>
        {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
        Save and continue
      </Button>
    </div>
  );
}
