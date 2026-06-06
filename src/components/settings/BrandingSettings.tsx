"use client";

import type { InputHTMLAttributes } from "react";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { updateBrandingAction } from "@/actions/settings/update-branding-action";
import { ImageUploadField } from "@/components/settings/ImageUploadField";
import { SettingsSaveButton } from "@/components/settings/SettingsSaveButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brandingSchema, type BrandingInput } from "@/lib/settings/settings-types";

export function BrandingSettings({ schoolId, values, canEdit }: { schoolId: string; values: BrandingInput; canEdit: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<BrandingInput>({
    resolver: zodResolver(brandingSchema),
    defaultValues: values,
  });

  function submit(input: BrandingInput) {
    startTransition(async () => {
      const result = await updateBrandingAction(input);
      setMessage(result.message);
    });
  }

  // React Hook Form's watch API is intentionally subscription based and is safe here for upload previews.
  // eslint-disable-next-line react-hooks/incompatible-library
  const [logoUrl = "", sealUrl = "", principalSignatureUrl = ""] = watch(["logoUrl", "sealUrl", "principalSignatureUrl"]);

  return (
    <form className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/75 p-5" onSubmit={handleSubmit(submit)}>
      <div>
        <h2 className="text-lg font-semibold text-slate-50">Branding</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">Upload official school assets and set report accent colors.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ImageUploadField bucket="school-logos" disabled={!canEdit} label="School logo" schoolId={schoolId} value={logoUrl} onChange={(url) => setValue("logoUrl", url, { shouldDirty: true })} />
        <ImageUploadField bucket="school-logos" disabled={!canEdit} label="School crest / seal" schoolId={schoolId} value={sealUrl} onChange={(url) => setValue("sealUrl", url, { shouldDirty: true })} />
        <ImageUploadField bucket="signatures" disabled={!canEdit} fixedBaseName="signature" label="Principal signature" pathPrefix="principal" schoolId={schoolId} value={principalSignatureUrl} onChange={(url) => setValue("principalSignatureUrl", url, { shouldDirty: true })} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ColorField label="Primary color" error={errors.primaryColor?.message} disabled={!canEdit} {...register("primaryColor")} />
        <ColorField label="Secondary color" error={errors.secondaryColor?.message} disabled={!canEdit} {...register("secondaryColor")} />
      </div>
      {message ? <p className={message.includes("updated") ? "text-sm text-emerald-300" : "text-sm text-red-300"}>{message}</p> : null}
      {canEdit ? <SettingsSaveButton loading={pending} /> : <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">Only admins can update branding assets.</p>}
    </form>
  );
}

function ColorField({ label, error, disabled, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <div>
      <Label className="text-slate-200">{label}</Label>
      <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-2">
        <input className="size-10 rounded-lg border border-white/10 bg-transparent" disabled={disabled} type="color" {...props} />
        <Input className="border-white/10 bg-slate-950/60 text-slate-100" disabled={disabled} {...props} />
      </div>
      {error ? <p className="mt-1 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
