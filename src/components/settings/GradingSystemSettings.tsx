"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { updateGradingScaleAction } from "@/actions/settings/update-grading-scale-action";
import { GradingScaleEditor } from "@/components/settings/GradingScaleEditor";
import { SettingsSaveButton } from "@/components/settings/SettingsSaveButton";
import { gradingScaleSchema, type GradingScaleInput } from "@/lib/settings/settings-types";

export function GradingSystemSettings({ values, canEdit }: { values: GradingScaleInput["bands"]; canEdit: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { control, register, handleSubmit } = useForm<GradingScaleInput>({
    resolver: zodResolver(gradingScaleSchema),
    defaultValues: { bands: values },
  });

  function submit(input: GradingScaleInput) {
    startTransition(async () => {
      const result = await updateGradingScaleAction(input);
      setMessage(result.message);
    });
  }

  return (
    <form className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/75 p-5" onSubmit={handleSubmit(submit)}>
      <div>
        <h2 className="text-lg font-semibold text-slate-50">Grading System</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">Configure grade labels, score ranges, and remarks for future result calculations.</p>
      </div>
      <GradingScaleEditor control={control} disabled={!canEdit} register={register} />
      {message ? <p className={message.includes("updated") ? "text-sm text-emerald-300" : "text-sm text-red-300"}>{message}</p> : null}
      {canEdit ? <SettingsSaveButton loading={pending} /> : <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">Headmasters can view grading settings. Only admins can edit grading bands.</p>}
    </form>
  );
}
