"use client";

import { useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";

import { saveAcademicStructureAction } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/states/empty-state";
import { academicStructureSchema, type AcademicStructureFormValues, type AcademicStructureInput } from "@/lib/onboarding/schema";
import type { OnboardingClass, OnboardingTeacher } from "@/types/onboarding";

type AcademicStructureStepProps = {
  defaultValues: AcademicStructureInput;
  teachers: OnboardingTeacher[];
  onSaved: (classes: OnboardingClass[]) => void;
  onComplete: () => void;
};

export function AcademicStructureStep({ defaultValues, teachers, onSaved, onComplete }: AcademicStructureStepProps) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AcademicStructureFormValues, unknown, AcademicStructureInput>({
    resolver: zodResolver(academicStructureSchema),
    defaultValues,
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "classes",
    keyName: "fieldKey",
  });

  useEffect(() => {
    if (fields.length === 0) {
      append({ name: "", teacherId: null });
    }
  }, [append, fields.length]);

  function save(values: AcademicStructureInput) {
    startTransition(async () => {
      setMessage("Saving classes...");
      const response = await saveAcademicStructureAction(values);
      setMessage(response.message);

      if (response.ok && response.data) {
        onSaved(response.data.classes);
        onComplete();
        window.dispatchEvent(new CustomEvent("gradix:onboarding-next"));
      }
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(save)}>
      <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm leading-6 text-orange-900">
        Teacher accounts are optional. You can download Excel templates, send them to teachers, and upload completed sheets yourself. Assign teachers here only if the school wants teachers to log in directly later.
      </div>
      {fields.length === 0 ? (
        <EmptyState icon={Plus} title="No classes yet" description="Create the first class to start building your academic structure." />
      ) : null}
      <div className="grid gap-3">
        {fields.map((field, index) => (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={field.fieldKey}>
            <input type="hidden" {...register(`classes.${index}.id`)} />
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-start">
              <div>
                <Input placeholder="JSS 1A" {...register(`classes.${index}.name`)} />
                {errors.classes?.[index]?.name ? <p className="mt-2 text-sm text-red-600">{errors.classes[index]?.name?.message}</p> : null}
              </div>
              <select
                className="h-11 rounded-md border border-input bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-orange-200"
                {...register(`classes.${index}.teacherId`)}
              >
                <option value="">No teacher assigned</option>
                {teachers.map((teacher) => (
                  <option value={teacher.id} key={teacher.id}>
                    {teacher.fullName}
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" size="icon" onClick={() => remove(index)} aria-label="Delete class">
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
      </div>
      {typeof errors.classes?.message === "string" ? <p className="text-sm text-red-600">{errors.classes.message}</p> : null}
      <Button type="button" variant="outline" onClick={() => append({ name: "", teacherId: null })}>
        <Plus />
        Add class
      </Button>
      <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl shadow-slate-950/10 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{message || "Examples: JSS 1A, JSS 1B, SS 2, Primary 4."}</p>
        <Button className="h-11 bg-orange-600 text-white hover:bg-orange-700" disabled={isPending}>
          {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
          Save and continue
        </Button>
      </div>
    </form>
  );
}
