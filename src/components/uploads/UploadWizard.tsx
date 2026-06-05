"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Save, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import { saveUploadAction } from "@/actions/uploads/save-upload-action";
import { validateUploadAction } from "@/actions/uploads/validate-upload-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DuplicateResolutionPanel } from "@/components/uploads/DuplicateResolutionPanel";
import { ExcelDropzone } from "@/components/uploads/ExcelDropzone";
import { UploadPreviewTable } from "@/components/uploads/UploadPreviewTable";
import { UploadStepSelector } from "@/components/uploads/UploadStepSelector";
import { UploadValidationSummary } from "@/components/uploads/UploadValidationSummary";
import {
  uploadValidationSchema,
  type DuplicateStrategy,
  type UploadActionState,
  type UploadClassOption,
  type UploadValidationFormValues,
  type UploadValidationInput,
  type UploadValidationResult,
} from "@/lib/uploads/upload-types";

type UploadWizardProps = {
  classes: UploadClassOption[];
  defaultAcademicYear: string;
};

export function UploadWizard({ classes, defaultAcademicYear }: UploadWizardProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<UploadValidationResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    setValue,
    getValues,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UploadValidationFormValues, unknown, UploadValidationInput>({
    resolver: zodResolver(uploadValidationSchema),
    defaultValues: {
      classId: classes[0]?.id ?? "",
      term: "first",
      academicYear: defaultAcademicYear,
      fileName: "",
      fileBase64: "",
      duplicateStrategy: "skip",
    },
  });
  const selectedClassId = useWatch({ control, name: "classId" });
  const fileName = useWatch({ control, name: "fileName" });
  const duplicateStrategy = useWatch({ control, name: "duplicateStrategy" }) ?? "skip";
  const selectedClass = useMemo(() => classes.find((schoolClass) => schoolClass.id === selectedClassId), [classes, selectedClassId]);
  const currentStep = result ? 2 : fileName ? 1 : 0;

  function setDuplicateStrategy(strategy: DuplicateStrategy) {
    setValue("duplicateStrategy", strategy);

    if (getValues("fileBase64")) {
      runValidation(uploadValidationSchema.parse({ ...getValues(), duplicateStrategy: strategy }));
    }
  }

  function handleValidationResponse(response: UploadActionState) {
    if (response.ok) {
      setResult(response);
      setMessage("Validation complete. Review the preview before saving.");
      return;
    }

    setResult(null);
    setMessage(response.message);
  }

  function runValidation(values: UploadValidationInput) {
    setMessage("Validating workbook...");
    startTransition(async () => {
      const response = await validateUploadAction(values);
      handleValidationResponse(response);
    });
  }

  function saveUpload() {
    setMessage("Saving upload...");
    startTransition(async () => {
      const response = await saveUploadAction(getValues());

      if (!response.ok) {
        setMessage(response.message);
        return;
      }

      setMessage(`${response.message} Inserted ${response.insertedRows}, replaced ${response.replacedRows}, skipped ${response.skippedRows}.`);
      router.push(`/dashboard/uploads/${response.uploadId}`);
    });
  }

  const hasInvalidRows = Boolean(result && result.summary.invalidRows > 0);

  return (
    <div className="space-y-5">
      <UploadStepSelector step={currentStep} />

      {message ? (
        <div className="rounded-2xl border border-orange-300/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">{message}</div>
      ) : null}

      <form className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)]" onSubmit={handleSubmit(runValidation)}>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Class</label>
            <select
              className="h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-50 outline-none focus:border-orange-300"
              {...register("classId")}
            >
              <option value="">Select class</option>
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name}
                </option>
              ))}
            </select>
            {errors.classId ? <p className="text-sm text-red-300">{errors.classId.message}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Term</label>
            <select
              className="h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-50 outline-none focus:border-orange-300"
              {...register("term")}
            >
              <option value="first">First Term</option>
              <option value="second">Second Term</option>
              <option value="third">Third Term</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Academic year</label>
            <Input className="border-white/10 bg-slate-950/70 text-slate-50" {...register("academicYear")} />
            {errors.academicYear ? <p className="text-sm text-red-300">{errors.academicYear.message}</p> : null}
          </div>
        </div>

        {selectedClass ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
              {selectedClass.studentCount} students in this class
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
              {selectedClass.subjectCount} assigned subjects
            </div>
          </div>
        ) : null}

        <div className="mt-5">
          <ExcelDropzone
            disabled={isPending}
            fileName={fileName}
            onError={setMessage}
            onFileReady={(file) => {
              setValue("fileName", file.fileName, { shouldValidate: true });
              setValue("fileBase64", file.base64, { shouldValidate: true });
              setResult(null);
              setMessage("File ready. Validate it before saving.");
            }}
          />
          {errors.fileBase64 ? <p className="mt-2 text-sm text-red-300">{errors.fileBase64.message}</p> : null}
        </div>

        <div className="mt-5 flex justify-end">
          <Button className="bg-orange-600 text-white hover:bg-orange-700" disabled={isPending || classes.length === 0} type="submit">
            {isPending ? <ShieldCheck className="animate-pulse" /> : <ArrowRight />}
            Validate upload
          </Button>
        </div>
      </form>

      {result ? (
        <>
          <DuplicateResolutionPanel
            disabled={isPending}
            duplicateCount={result.summary.duplicateRows}
            duplicateStrategy={duplicateStrategy}
            onChange={setDuplicateStrategy}
          />
          <UploadValidationSummary summary={result.summary} />
          <UploadPreviewTable rows={result.rows} />
          <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-xl shadow-slate-950/30 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-300">
              {hasInvalidRows ? "Fix invalid rows before saving." : "Only clean rows will be saved. Results remain unpublished."}
            </p>
            <Button className="bg-orange-600 text-white hover:bg-orange-700" disabled={isPending || hasInvalidRows} onClick={saveUpload} type="button">
              <Save />
              Save upload
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
