"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { saveBrandingAction } from "@/actions/onboarding";
import { ColorPicker } from "@/components/branding/color-picker";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/upload/image-upload";
import { brandingSchema, type BrandingInput } from "@/lib/onboarding/schema";

type BrandingStepProps = {
  defaultValues: BrandingInput;
  schoolId: string;
  onComplete: () => void;
};

export function BrandingStep({ defaultValues, schoolId, onComplete }: BrandingStepProps) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const { control, handleSubmit, setValue } = useForm<BrandingInput>({
    resolver: zodResolver(brandingSchema),
    defaultValues,
  });

  function save(values: BrandingInput) {
    startTransition(async () => {
      setMessage("Saving branding...");
      const response = await saveBrandingAction(values);
      setMessage(response.message);

      if (response.ok) {
        onComplete();
        window.dispatchEvent(new CustomEvent("gradix:onboarding-next"));
      }
    });
  }

  return (
    <form className="space-y-7" onSubmit={handleSubmit(save)}>
      <div className="grid gap-5 lg:grid-cols-2">
        <Controller
          name="logoUrl"
          control={control}
          render={({ field }) => (
            <ImageUpload
              bucket="school-logos"
              schoolId={schoolId}
              label="School logo"
              value={field.value}
              onUploaded={(url) => {
                field.onChange(url);
                setValue("logoUrl", url, { shouldDirty: true, shouldValidate: true });
              }}
            />
          )}
        />
        <Controller
          name="signatureUrl"
          control={control}
          render={({ field }) => (
            <ImageUpload
              bucket="signatures"
              schoolId={schoolId}
              label="Principal signature"
              value={field.value}
              onUploaded={(url) => {
                field.onChange(url);
                setValue("signatureUrl", url, { shouldDirty: true, shouldValidate: true });
              }}
            />
          )}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Controller
          name="primaryColor"
          control={control}
          render={({ field }) => <ColorPicker label="Primary color" value={field.value} onChange={field.onChange} />}
        />
        <Controller
          name="secondaryColor"
          control={control}
          render={({ field }) => <ColorPicker label="Secondary color" value={field.value} onChange={field.onChange} />}
        />
      </div>
      <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl shadow-slate-950/10 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{message || "Upload files, preview them, then save your branding."}</p>
        <Button className="h-11 bg-orange-600 text-white hover:bg-orange-700" disabled={isPending}>
          {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
          Save and continue
        </Button>
      </div>
    </form>
  );
}
