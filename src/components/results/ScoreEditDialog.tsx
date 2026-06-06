"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit3, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import { updateResultScoreAction } from "@/actions/results/update-result-score-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resultScoreSchema, type ResultScoreFormValues, type ResultScoreInput } from "@/lib/results/result-types";

type ScoreEditDialogProps = {
  result: {
    id: string;
    studentName: string;
    subjectName: string;
    continuousAssessment: number;
    examScore: number;
    remark: string | null;
    isPublished: boolean;
  };
  disabled?: boolean;
  onMessage?: (message: string) => void;
};

export function ScoreEditDialog({ disabled, result, onMessage }: ScoreEditDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResultScoreFormValues, unknown, ResultScoreInput>({
    resolver: zodResolver(resultScoreSchema),
    defaultValues: {
      resultId: result.id,
      continuousAssessment: result.continuousAssessment,
      examScore: result.examScore,
      remark: result.remark ?? "",
    },
  });
  const ca = Number(useWatch({ control, name: "continuousAssessment" }) ?? 0);
  const exam = Number(useWatch({ control, name: "examScore" }) ?? 0);
  const total = Number.isFinite(ca + exam) ? ca + exam : 0;

  function save(values: ResultScoreInput) {
    startTransition(async () => {
      const response = await updateResultScoreAction(values);
      onMessage?.(response.message);

      if (response.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <Button disabled={disabled} onClick={() => setOpen(true)} size="sm" type="button" variant="outline">
        <Edit3 />
        Edit
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/70 p-3 backdrop-blur sm:items-center sm:justify-center">
      <form className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl" onSubmit={handleSubmit(save)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300/80">Edit Score</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-50">{result.studentName}</h2>
            <p className="text-sm text-slate-400">{result.subjectName}</p>
          </div>
          <Button onClick={() => setOpen(false)} size="icon" type="button" variant="ghost">
            <X />
          </Button>
        </div>

        {result.isPublished ? (
          <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-500/10 p-3 text-sm text-amber-100">
            This result has already been published. Saving will flag it as edited after publish.
          </div>
        ) : null}

        <input type="hidden" {...register("resultId")} />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">CA score</label>
            <Input className="border-white/10 bg-slate-900 text-slate-50" step="0.01" type="number" {...register("continuousAssessment")} />
            {errors.continuousAssessment ? <p className="text-sm text-red-300">{errors.continuousAssessment.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Exam score</label>
            <Input className="border-white/10 bg-slate-900 text-slate-50" step="0.01" type="number" {...register("examScore")} />
            {errors.examScore ? <p className="text-sm text-red-300">{errors.examScore.message}</p> : null}
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">New total: {total}</div>
        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium text-slate-200">Remark</label>
          <textarea className="min-h-24 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-orange-300" {...register("remark")} />
          {errors.remark ? <p className="text-sm text-red-300">{errors.remark.message}</p> : null}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button disabled={isPending} onClick={() => setOpen(false)} type="button" variant="outline">
            Cancel
          </Button>
          <Button className="bg-orange-600 text-white hover:bg-orange-700" disabled={isPending} type="submit">
            <Save />
            Save score
          </Button>
        </div>
      </form>
    </div>
  );
}
