"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { updateReportSettingsAction } from "@/actions/settings/update-report-settings-action";
import { SettingsSaveButton } from "@/components/settings/SettingsSaveButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reportSettingsSchema, type ReportSettingsInput } from "@/lib/settings/settings-types";

export function ReportSettings({ values, canEdit }: { values: ReportSettingsInput; canEdit: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm<ReportSettingsInput>({
    resolver: zodResolver(reportSettingsSchema),
    defaultValues: values,
  });

  function submit(input: ReportSettingsInput) {
    startTransition(async () => {
      const result = await updateReportSettingsAction(input);
      setMessage(result.message);
    });
  }

  return (
    <form className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/75 p-5" onSubmit={handleSubmit(submit)}>
      <div>
        <h2 className="text-lg font-semibold text-slate-50">Report Settings</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">Control what appears on parent result pages and printable report cards.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Report format" error={errors.reportFormat?.message}>
          <select
            className="h-11 w-full rounded-md border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-orange-400/40 disabled:opacity-60"
            disabled={!canEdit}
            {...register("reportFormat")}
          >
            <option value="standard">Standard Academic Report</option>
            <option value="comprehensive_primary">Comprehensive Primary Report</option>
          </select>
        </Field>
        <Field label="Report title" error={errors.reportTitle?.message}><Input disabled={!canEdit} {...register("reportTitle")} /></Field>
        <Field label="Next term begins"><Input disabled={!canEdit} type="date" {...register("nextTermBegins")} /></Field>
        <Field label="Attendance open-days label" error={errors.attendanceOpenDaysLabel?.message}><Input disabled={!canEdit} {...register("attendanceOpenDaysLabel")} /></Field>
        <Field className="md:col-span-2" label="Report footer note"><Input disabled={!canEdit} {...register("footerNote")} /></Field>
        <Field
          className="md:col-span-2"
          error={errors.principalComment?.message}
          help="This comment will appear automatically on all student reports for this school. Leave it empty to hide the Principal Comment section."
          label="Default Principal / Head Teacher Comment"
        >
          <textarea
            className="min-h-24 w-full rounded-md border border-white/10 bg-slate-950/60 px-3 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-orange-400/40 disabled:opacity-60"
            disabled={!canEdit}
            {...register("principalComment")}
          />
        </Field>
        <Field label="Class teacher comment default"><Input disabled={!canEdit} {...register("classTeacherComment")} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Check label="Show school motto" disabled={!canEdit} {...register("showSchoolMotto")} />
        <Check label="Show student code" disabled={!canEdit} {...register("showStudentCode")} />
        <Check label="Show admission number" disabled={!canEdit} {...register("showAdmissionNumber")} />
        <Check label="Show class position" disabled={!canEdit} {...register("showClassPosition")} />
        <Check label="Show grading guide" disabled={!canEdit} {...register("showGradingGuide")} />
        <Check label="Show performance summary" disabled={!canEdit} {...register("showPerformanceSummary")} />
        <Check label="Show attendance record" disabled={!canEdit} {...register("showAttendanceRecord")} />
        <Check label="Show affective domain" disabled={!canEdit} {...register("showAffectiveDomain")} />
        <Check label="Show psychomotor domain" disabled={!canEdit} {...register("showPsychomotorDomain")} />
        <Check label="Show rating scale" disabled={!canEdit} {...register("showRatingScale")} />
      </div>
      {message ? <p className={message.includes("updated") ? "text-sm text-emerald-300" : "text-sm text-red-300"}>{message}</p> : null}
      {canEdit ? <SettingsSaveButton loading={pending} /> : null}
    </form>
  );
}

function Field({ label, error, help, className, children }: { label: string; error?: string; help?: string; className?: string; children: ReactNode }) {
  return <div className={className}><Label className="text-slate-200">{label}</Label><div className="mt-2 [&_input]:border-white/10 [&_input]:bg-slate-950/60 [&_input]:text-slate-100">{children}</div>{help ? <p className="mt-1 text-xs leading-5 text-slate-400">{help}</p> : null}{error ? <p className="mt-1 text-sm text-red-300">{error}</p> : null}</div>;
}

function Check({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
      <input className="size-4 accent-orange-500" type="checkbox" {...props} />
      {label}
    </label>
  );
}
