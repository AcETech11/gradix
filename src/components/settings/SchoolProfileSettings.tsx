"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { updateSchoolProfileAction } from "@/actions/settings/update-school-profile-action";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSaveButton } from "@/components/settings/SettingsSaveButton";
import { schoolProfileSchema, type SchoolProfileInput } from "@/lib/settings/settings-types";

export function SchoolProfileSettings({ values, canEdit }: { values: SchoolProfileInput; canEdit: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm<SchoolProfileInput>({
    resolver: zodResolver(schoolProfileSchema),
    defaultValues: values,
  });

  function submit(input: SchoolProfileInput) {
    startTransition(async () => {
      const result = await updateSchoolProfileAction(input);
      setMessage(result.message);
    });
  }

  return (
    <form className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/75 p-5" onSubmit={handleSubmit(submit)}>
      <SectionHeader title="School Profile" description="Keep the school identity and contact details parents will recognize." />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="School name" error={errors.name?.message}><Input disabled={!canEdit} {...register("name")} /></Field>
        <Field label="School type"><Input disabled={!canEdit} placeholder="Secondary, Primary, Nursery..." {...register("schoolType")} /></Field>
        <Field label="Motto"><Input disabled={!canEdit} {...register("motto")} /></Field>
        <Field label="Principal / Headmaster"><Input disabled={!canEdit} {...register("principalName")} /></Field>
        <Field label="Address" className="md:col-span-2"><Input disabled={!canEdit} {...register("address")} /></Field>
        <Field label="City"><Input disabled={!canEdit} {...register("city")} /></Field>
        <Field label="State"><Input disabled={!canEdit} {...register("state")} /></Field>
        <Field label="Country"><Input disabled={!canEdit} {...register("country")} /></Field>
        <Field label="Phone"><Input disabled={!canEdit} {...register("phone")} /></Field>
        <Field label="Email" error={errors.email?.message}><Input disabled={!canEdit} {...register("email")} /></Field>
        <Field label="Website" error={errors.website?.message}><Input disabled={!canEdit} placeholder="https://example.com" {...register("website")} /></Field>
      </div>
      {message ? <p className={message.includes("updated") ? "text-sm text-emerald-300" : "text-sm text-red-300"}>{message}</p> : null}
      {canEdit ? <SettingsSaveButton loading={pending} /> : <ReadOnlyNote />}
    </form>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return <div><h2 className="text-lg font-semibold text-slate-50">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-400">{description}</p></div>;
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return <div className={className}><Label className="text-slate-200">{label}</Label><div className="mt-2 [&_input]:border-white/10 [&_input]:bg-slate-950/60 [&_input]:text-slate-100">{children}</div>{error ? <p className="mt-1 text-sm text-red-300">{error}</p> : null}</div>;
}

function ReadOnlyNote() {
  return <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">Headmasters can view this section. Only admins can edit school profile details.</p>;
}
