"use client";

import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { useFieldArray, type Control, type UseFormRegister } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_GRADING_SCALE } from "@/lib/settings/default-grading-scale";
import type { GradingScaleInput } from "@/lib/settings/settings-types";

type GradingScaleEditorProps = {
  control: Control<GradingScaleInput>;
  register: UseFormRegister<GradingScaleInput>;
  disabled?: boolean;
};

export function GradingScaleEditor({ control, register, disabled }: GradingScaleEditorProps) {
  const { fields, append, remove, replace } = useFieldArray({ control, name: "bands" });

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] px-4 py-3 text-sm leading-6 text-amber-100">
        Changing grading settings will apply to future calculations. Existing results may need recalculation.
      </div>
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 md:grid-cols-[0.7fr_0.7fr_0.8fr_1.2fr_auto]" key={field.id}>
            <Input className="border-white/10 bg-slate-950/60 text-slate-100" disabled={disabled} placeholder="Min" type="number" {...register(`bands.${index}.min`, { valueAsNumber: true })} />
            <Input className="border-white/10 bg-slate-950/60 text-slate-100" disabled={disabled} placeholder="Max" type="number" {...register(`bands.${index}.max`, { valueAsNumber: true })} />
            <Input className="border-white/10 bg-slate-950/60 text-slate-100" disabled={disabled} placeholder="Grade" {...register(`bands.${index}.grade`)} />
            <Input className="border-white/10 bg-slate-950/60 text-slate-100" disabled={disabled} placeholder="Remark" {...register(`bands.${index}.remark`)} />
            <Button className="border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20" disabled={disabled || fields.length <= 1} size="icon" type="button" variant="outline" onClick={() => remove(index)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      {!disabled ? (
        <div className="flex flex-wrap gap-2">
          <Button className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" type="button" variant="outline" onClick={() => append({ min: 0, max: 0, grade: "", remark: "" })}>
            <Plus className="size-4" />
            Add band
          </Button>
          <Button className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" type="button" variant="outline" onClick={() => replace(DEFAULT_GRADING_SCALE)}>
            <RotateCcw className="size-4" />
            Reset default
          </Button>
        </div>
      ) : null}
    </div>
  );
}
