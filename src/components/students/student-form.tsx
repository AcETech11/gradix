"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { createStudentAction, updateStudentAction } from "@/actions/students";
import { AuthSpinner } from "@/components/auth/auth-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthResult } from "@/hooks/use-auth-result";
import { studentFormSchema, type StudentFormInput, type StudentFormValues } from "@/lib/students/schema";
import { buildStudentFormDefaults } from "@/lib/students/utils";
import type { TableRow } from "@/types/database";

type ClassOption = Pick<TableRow<"classes">, "id" | "name" | "level" | "arm" | "academic_year" | "is_active">;

type StudentFormProps = {
  mode: "create" | "edit";
  schoolId: string;
  classes: ClassOption[];
  studentId?: string;
  initialValues?: Partial<StudentFormValues>;
};

export function StudentForm({ mode, classes, studentId, initialValues }: StudentFormProps) {
  const router = useRouter();
  const defaults = useMemo(() => ({ ...buildStudentFormDefaults(), ...initialValues }), [initialValues]);
  const { result, setResult, isPending, startTransition } = useAuthResult<{ redirectTo: string; studentCode?: string }>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentFormInput>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: defaults,
  });

  function getFieldError(fieldName: keyof StudentFormValues) {
    return result?.fieldErrors?.[fieldName]?.[0] ?? errors[fieldName]?.message;
  }

  function onSubmit(values: StudentFormInput) {
    setResult(null);

    startTransition(async () => {
      const response = mode === "create" ? await createStudentAction(values) : await updateStudentAction(studentId ?? "", values);
      setResult(response);

      if (response.ok && response.data?.redirectTo) {
        router.replace(response.data.redirectTo);
        router.refresh();
      }
    });
  }

  const canSubmit = !isPending;

  return (
    <form className="space-y-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)] backdrop-blur" onSubmit={handleSubmit(onSubmit)}>
      {result?.message ? (
        <div
          className={
            result.ok
              ? "rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
              : "rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          }
        >
          {result.message}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Student Name</Label>
          <Input className="border-white/10 bg-slate-950/40 text-slate-100" disabled={!canSubmit} id="fullName" {...register("fullName")} />
          {getFieldError("fullName") ? <p className="text-sm text-red-300">{getFieldError("fullName")}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="classId">Class</Label>
          <select
            className="h-11 w-full rounded-md border border-white/10 bg-slate-950/40 px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-orange-400/40"
            disabled={!canSubmit}
            id="classId"
            {...register("classId")}
          >
            <option value="">Select class</option>
            {classes.map((classOption) => (
              <option key={classOption.id} value={classOption.id}>
                {classOption.name} {classOption.arm ? `(${classOption.arm})` : ""} {classOption.is_active ? "" : "(Inactive)"}
              </option>
            ))}
          </select>
          {getFieldError("classId") ? <p className="text-sm text-red-300">{getFieldError("classId")}</p> : null}
        </div>
      </section>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
        <div className="flex items-center gap-2 text-slate-100">
          <CheckCircle2 className="size-4 text-emerald-300" />
          Permanent student/result code will be generated automatically after save.
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-400">Only the student name and class are required.</p>
      </div>

      <div className="sticky bottom-0 -mx-5 border-t border-white/10 bg-[#07111f]/95 px-5 py-4 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" disabled={isPending} type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400" disabled={isPending} type="submit">
            {isPending ? <AuthSpinner label={mode === "create" ? "Saving student" : "Updating student"} /> : mode === "create" ? "Create student" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
