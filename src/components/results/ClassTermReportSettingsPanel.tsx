"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import { updateClassTermReportSettingsAction } from "@/actions/results/update-report-details-action";
import { Button } from "@/components/ui/button";
import type { ResultUploadDetail } from "@/lib/results/result-types";

export function ClassTermReportSettingsPanel({ upload }: { upload: ResultUploadDetail }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      const result = await updateClassTermReportSettingsAction({
        uploadId: upload.id,
        schoolOpenDays: formData.get("schoolOpenDays") || null,
        termEndsOn: formData.get("termEndsOn") || "",
        nextTermBeginsOn: formData.get("nextTermBeginsOn") || "",
      });
      setMessage(result.message);
    });
  }

  return (
    <form action={submit} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Attendance Record Settings</h2>
          <p className="text-sm leading-6 text-slate-400">Shared class and term details used on comprehensive primary reports.</p>
        </div>
        {upload.canEditReportDetails ? (
          <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400" disabled={pending} type="submit">
            {pending ? "Saving..." : "Save term details"}
          </Button>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Field label="No. of Days School Opened">
          <input
            className="h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-50 outline-none focus:border-orange-300"
            defaultValue={upload.schoolOpenDays ?? ""}
            disabled={!upload.canEditReportDetails}
            min={0}
            name="schoolOpenDays"
            type="number"
          />
        </Field>
        <Field label="Term Ends">
          <input
            className="h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-50 outline-none focus:border-orange-300"
            defaultValue={upload.termEndsOn ?? ""}
            disabled={!upload.canEditReportDetails}
            name="termEndsOn"
            type="date"
          />
        </Field>
        <Field label="Next Term Begins">
          <input
            className="h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-50 outline-none focus:border-orange-300"
            defaultValue={upload.nextTermBeginsOn ?? ""}
            disabled={!upload.canEditReportDetails}
            name="nextTermBeginsOn"
            type="date"
          />
        </Field>
      </div>
      {message ? <p className="mt-3 text-sm text-orange-200">{message}</p> : null}
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}
