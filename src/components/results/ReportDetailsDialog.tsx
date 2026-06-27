"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import { updateStudentReportDetailsAction } from "@/actions/results/update-report-details-action";
import { Button } from "@/components/ui/button";
import { AFFECTIVE_TRAITS, PSYCHOMOTOR_TRAITS } from "@/lib/reports/primary-report";
import type { ResultReviewRow } from "@/lib/results/result-types";

type ReportDetailsDialogProps = {
  result: ResultReviewRow;
  uploadId: string;
  schoolOpenDays: number | null;
  disabled: boolean;
  onMessage: (message: string) => void;
};

export function ReportDetailsDialog({ result, uploadId, schoolOpenDays, disabled, onMessage }: ReportDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const attendanceWarning =
    schoolOpenDays !== null &&
    result.attendancePresent !== null &&
    result.attendanceAbsent !== null &&
    result.attendancePresent + result.attendanceAbsent !== schoolOpenDays;

  function submit(formData: FormData) {
    startTransition(async () => {
      const payload = {
        uploadId,
        studentId: result.studentId,
        attendancePresent: formData.get("attendancePresent") || null,
        attendanceAbsent: formData.get("attendanceAbsent") || null,
        classTeacherComment: formData.get("classTeacherComment") || "",
        reasonForEdit: formData.get("reasonForEdit") || "",
        affectiveDomain: Object.fromEntries(AFFECTIVE_TRAITS.map((trait) => [trait, formData.get(`affective-${trait}`) || null])),
        psychomotorDomain: Object.fromEntries(PSYCHOMOTOR_TRAITS.map((trait) => [trait, formData.get(`psychomotor-${trait}`) || null])),
      };
      const response = await updateStudentReportDetailsAction(payload);

      onMessage(response.message);

      if (response.ok) {
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button disabled={disabled} onClick={() => setOpen(true)} type="button" variant="outline">
        Report details
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
          <form action={submit} className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#08111f] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-50">Report details</h2>
                <p className="mt-1 text-sm text-slate-400">{result.studentName}</p>
              </div>
              <Button onClick={() => setOpen(false)} type="button" variant="ghost">
                Close
              </Button>
            </div>

            {attendanceWarning ? (
              <div className="mt-4 rounded-xl border border-orange-300/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">
                Attendance Present + Absent does not equal No. of Days School Opened.
              </div>
            ) : null}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Attendance Present">
                <input className={inputClassName} defaultValue={result.attendancePresent ?? ""} min={0} name="attendancePresent" type="number" />
              </Field>
              <Field label="Attendance Absent">
                <input className={inputClassName} defaultValue={result.attendanceAbsent ?? ""} min={0} name="attendanceAbsent" type="number" />
              </Field>
            </div>

            <Domain title="Affective Domain" prefix="affective" ratings={result.affectiveDomain} traits={AFFECTIVE_TRAITS} />
            <Domain title="Psychomotor Domain" prefix="psychomotor" ratings={result.psychomotorDomain} traits={PSYCHOMOTOR_TRAITS} />

            <Field label="Class Teacher Comment">
              <textarea className={`${inputClassName} min-h-24 py-3`} defaultValue={result.classTeacherComment ?? ""} name="classTeacherComment" />
            </Field>

            {result.isPublished ? (
              <Field label="Reason for changing published report details">
                <textarea className={`${inputClassName} min-h-20 py-3`} name="reasonForEdit" required />
              </Field>
            ) : null}

            <div className="mt-5 flex justify-end">
              <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400" disabled={pending} type="submit">
                {pending ? "Saving..." : "Save report details"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

const inputClassName = "w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-50 outline-none focus:border-orange-300";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mt-4 block">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function Domain({
  title,
  prefix,
  ratings,
  traits,
}: {
  title: string;
  prefix: string;
  ratings: Record<string, number | undefined>;
  traits: readonly string[];
}) {
  return (
    <div className="mt-5 rounded-xl border border-white/10 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-200">{title}</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {traits.map((trait) => (
          <Field label={trait} key={trait}>
            <input className={inputClassName} defaultValue={ratings[trait] ?? ""} max={5} min={1} name={`${prefix}-${trait}`} type="number" />
          </Field>
        ))}
      </div>
    </div>
  );
}
