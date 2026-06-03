"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, LoaderCircle, Plus, Save, Search, Trash2 } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { saveSubjectsAssignmentsAction } from "@/actions/onboarding";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildSubjectCode } from "@/lib/onboarding/utils";
import { subjectsAssignmentsSchema, type SubjectsAssignmentsFormValues, type SubjectsAssignmentsInput } from "@/lib/onboarding/schema";
import type { OnboardingClass } from "@/types/onboarding";

type SubjectsAssignmentsStepProps = {
  defaultValues: SubjectsAssignmentsInput;
  classes: OnboardingClass[];
  onSaved: (subjects: { id: string; name: string; code: string; classIds: string[] }[]) => void;
  onComplete: () => void;
};

export function SubjectsAssignmentsStep({ defaultValues, classes, onSaved, onComplete }: SubjectsAssignmentsStepProps) {
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<SubjectsAssignmentsFormValues, unknown, SubjectsAssignmentsInput>({
    resolver: zodResolver(subjectsAssignmentsSchema),
    defaultValues,
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "subjects",
  });
  const watchedSubjects = useWatch({ control, name: "subjects" });

  const visibleIndexes = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) {
      return fields.map((_, index) => index);
    }

    return fields
      .map((field, index) => ({ field, index }))
      .filter(({ index }) => watchedSubjects[index]?.name?.toLowerCase().includes(needle))
      .map(({ index }) => index);
  }, [fields, query, watchedSubjects]);

  function assignVisibleToAllClasses() {
    const classIds = classes.map((row) => row.id);

    visibleIndexes.forEach((index) => {
      setValue(`subjects.${index}.classIds`, classIds, { shouldDirty: true, shouldValidate: true });
    });
  }

  function save(values: SubjectsAssignmentsInput) {
    startTransition(async () => {
      setMessage("Saving subjects...");
      const response = await saveSubjectsAssignmentsAction(values);
      setMessage(response.message);

      if (response.ok && response.data) {
        onSaved(response.data.subjects);
        onComplete();
        window.dispatchEvent(new CustomEvent("gradix:onboarding-next"));
      }
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(save)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-10" placeholder="Search subjects" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={assignVisibleToAllClasses} disabled={classes.length === 0}>
            Bulk assign visible
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ name: "", code: "", classIds: classes.map((row) => row.id) })}
          >
            <Plus />
            Add subject
          </Button>
        </div>
      </div>

      {classes.length === 0 ? (
        <EmptyState icon={BookOpen} title="Create classes first" description="Subjects need active classes before assignments can be saved." />
      ) : null}

      <div className="grid gap-4">
        {visibleIndexes.map((index) => {
          const subjectName = watchedSubjects[index]?.name ?? "";

          return (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={fields[index].id}>
              <div className="grid gap-3 md:grid-cols-[1fr_10rem_auto]">
                <div>
                  <Input placeholder="Mathematics" {...register(`subjects.${index}.name`)} />
                  {errors.subjects?.[index]?.name ? <p className="mt-2 text-sm text-red-600">{errors.subjects[index]?.name?.message}</p> : null}
                </div>
                <Input
                  placeholder={buildSubjectCode(subjectName || "Subject")}
                  {...register(`subjects.${index}.code`)}
                />
                <Button type="button" variant="outline" size="icon" onClick={() => remove(index)} aria-label="Delete subject">
                  <Trash2 />
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {classes.map((schoolClass) => (
                  <label
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    key={schoolClass.id}
                  >
                    <input
                      type="checkbox"
                      value={schoolClass.id}
                      className="size-4 accent-orange-600"
                      {...register(`subjects.${index}.classIds`)}
                    />
                    {schoolClass.name}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {fields.length === 0 ? (
        <EmptyState icon={Plus} title="No subjects yet" description="Add subjects such as Mathematics, English, or Civic Education." />
      ) : null}
      {typeof errors.subjects?.message === "string" ? <p className="text-sm text-red-600">{errors.subjects.message}</p> : null}

      <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl shadow-slate-950/10 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{message || "Class-subject assignments save to the relationship table."}</p>
        <Button className="h-11 bg-orange-600 text-white hover:bg-orange-700" disabled={isPending || classes.length === 0}>
          {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
          Save and continue
        </Button>
      </div>
    </form>
  );
}
