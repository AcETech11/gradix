"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, FileSpreadsheet } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { generateResultTemplateAction } from "@/actions/templates/generate-template-action";
import { AuthSpinner } from "@/components/auth/auth-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resultTemplateSchema,
  type GeneratedTemplateFile,
  type ResultTemplateFormValues,
  type ResultTemplateInput,
  type TemplateClassOption,
} from "@/lib/templates/template-types";

import { TemplatePreviewCard } from "./TemplatePreviewCard";

type TemplateDownloadFormProps = {
  classes: TemplateClassOption[];
  defaultAcademicYear: string;
};

type FormResult = {
  ok: boolean;
  message: string;
  data?: GeneratedTemplateFile;
};

function downloadBase64File(file: GeneratedTemplateFile) {
  const byteCharacters = atob(file.base64);
  const byteNumbers = Array.from({ length: byteCharacters.length }, (_, index) => byteCharacters.charCodeAt(index));
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = file.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function TemplateDownloadForm({ classes, defaultAcademicYear }: TemplateDownloadFormProps) {
  const [result, setResult] = useState<FormResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors },
  } = useForm<ResultTemplateFormValues, unknown, ResultTemplateInput>({
    resolver: zodResolver(resultTemplateSchema),
    defaultValues: {
      classId: classes[0]?.id ?? "",
      term: "first",
      academicYear: defaultAcademicYear,
      includeSampleRows: false,
    },
  });

  const selectedClassId = useWatch({ control, name: "classId" });
  const selectedClass = useMemo(
    () => classes.find((schoolClass) => schoolClass.id === selectedClassId),
    [classes, selectedClassId],
  );

  async function onSubmit(values: ResultTemplateInput) {
    await downloadTemplate(values, false);
  }

  async function downloadSampleTemplate() {
    const values = resultTemplateSchema.parse({
      ...getValues(),
      includeSampleRows: true,
    });

    await downloadTemplate(values, true);
  }

  async function downloadTemplate(values: ResultTemplateInput, allowSampleRows: boolean) {
    setResult(null);

    if (selectedClass?.subjectCount === 0) {
      setResult({
        ok: false,
        message: "This class has no subjects assigned. Assign subjects before downloading a result template.",
      });
      return;
    }

    if (!allowSampleRows && selectedClass?.studentCount === 0) {
      setResult({
        ok: false,
        message: "No students found in this class. Add students first or download a blank sample template.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await generateResultTemplateAction({
        ...values,
        includeSampleRows: allowSampleRows,
      });
      setResult(response);

      if (response.ok) {
        downloadBase64File(response.data);
      }
    } catch {
      setResult({
        ok: false,
        message: "The template could not be generated. Check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <form
        className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)] backdrop-blur"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-orange-400/20 bg-orange-500/10 text-orange-200">
            <FileSpreadsheet className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-50">Download result template</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">Choose a class, term, and academic year. Gradix will build the workbook from assigned subjects.</p>
          </div>
        </div>

        {result ? (
          <div
            className={
              result.ok
                ? "mt-5 rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
                : "mt-5 rounded-xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100"
            }
          >
            <p>{result.message}</p>
            {result.ok && result.data?.warnings.length ? (
              <ul className="mt-2 list-inside list-disc space-y-1">
                {result.data.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Class" error={errors.classId?.message}>
            <select
              className="h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-50 outline-none transition focus:border-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              {...register("classId")}
            >
              <option value="">Select class</option>
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Term" error={errors.term?.message}>
            <select
              className="h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-50 outline-none transition focus:border-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              {...register("term")}
            >
              <option value="first">First Term</option>
              <option value="second">Second Term</option>
              <option value="third">Third Term</option>
            </select>
          </Field>

          <Field label="Academic year" error={errors.academicYear?.message}>
            <Input
              className="border-white/10 bg-slate-950/70 text-slate-50 placeholder:text-slate-500"
              disabled={isSubmitting}
              placeholder="2025/2026"
              {...register("academicYear")}
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-400">Workbook sheets: Results Template, Instructions, Grading Guide, Class Subjects.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {selectedClass?.studentCount === 0 ? (
              <Button disabled={isSubmitting || classes.length === 0 || selectedClass.subjectCount === 0} type="button" variant="outline" onClick={downloadSampleTemplate}>
                <Download /> Blank sample
              </Button>
            ) : null}
            <Button
              className="h-11 bg-orange-600 px-5 text-white shadow-lg shadow-orange-950/20 hover:bg-orange-700"
              disabled={isSubmitting || classes.length === 0}
              type="submit"
            >
              {isSubmitting ? <AuthSpinner label="Generating" /> : <><Download /> Download template</>}
            </Button>
          </div>
        </div>
      </form>

      <TemplatePreviewCard selectedClass={selectedClass} />
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-slate-200">{label}</Label>
      {children}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
