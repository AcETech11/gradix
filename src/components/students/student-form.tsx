"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, CloudUpload, Trash2, UserRound } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useForm, useWatch } from "react-hook-form";

import { createStudentAction, updateStudentAction } from "@/actions/students";
import { AuthSpinner } from "@/components/auth/auth-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthResult } from "@/hooks/use-auth-result";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { studentFormSchema, type StudentFormInput, type StudentFormValues } from "@/lib/students/schema";
import { getPassportStoragePath, STUDENT_PASSPORT_BUCKET, validatePassportFile } from "@/lib/students/storage";
import { buildStudentFormDefaults } from "@/lib/students/utils";
import type { TableRow } from "@/types/database";

type ClassOption = Pick<TableRow<"classes">, "id" | "name" | "level" | "arm" | "academic_year" | "is_active">;

type StudentFormProps = {
  mode: "create" | "edit";
  schoolId: string;
  classes: ClassOption[];
  studentId?: string;
  initialValues?: Partial<StudentFormValues> & {
    passportUrl?: string | null;
  };
};

export function StudentForm({ mode, schoolId, classes, studentId, initialValues }: StudentFormProps) {
  const router = useRouter();
  const defaults = useMemo(() => ({ ...buildStudentFormDefaults(), ...initialValues }), [initialValues]);
  const { result, setResult, isPending, startTransition } = useAuthResult<{ redirectTo: string; studentCode?: string }>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string>(defaults.passportUrl || "");
  const [passportError, setPassportError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const passportInputId = "student-passport-input";

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StudentFormInput>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: defaults,
  });

  const watchedFirstName = useWatch({ control, name: "firstName" });
  const watchedLastName = useWatch({ control, name: "lastName" });

  const fullName = `${watchedFirstName} ${watchedLastName}`.trim();

  useEffect(
    () => () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    },
    [],
  );

  const onDrop = (files: File[]) => {
    const file = files[0];

    if (!file) {
      return;
    }

    const validationError = validatePassportFile(file);

    if (validationError) {
      setSelectedFile(null);
      setPassportError(validationError);
      return;
    }

    setPassportError(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    objectUrlRef.current = URL.createObjectURL(file);
    setPassportPreview(objectUrlRef.current);
    setSelectedFile(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    multiple: false,
  });

  function clearPassport() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSelectedFile(null);
    setPassportError(null);
    setPassportPreview("");
    setValue("passportUrl", "");
  }

  async function uploadPassport(file: File) {
    const supabase = createBrowserSupabaseClient();
    const path = getPassportStoragePath(schoolId, `${crypto.randomUUID()}-${file.name}`);
    const { error } = await supabase.storage.from(STUDENT_PASSPORT_BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

    if (error) {
      throw new Error(error.message);
    }

    return supabase.storage.from(STUDENT_PASSPORT_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  function getFieldError(fieldName: keyof StudentFormValues) {
    return result?.fieldErrors?.[fieldName]?.[0] ?? errors[fieldName]?.message;
  }

  function onSubmit(values: StudentFormInput) {
    setResult(null);

    startTransition(async () => {
      try {
        let passportUrl = values.passportUrl;

        if (selectedFile) {
          passportUrl = await uploadPassport(selectedFile);
        }

        const payload = {
          ...values,
          passportUrl,
        };

        const response =
          mode === "create"
            ? await createStudentAction(payload)
            : await updateStudentAction(studentId ?? "", payload);

        setResult(response);

        if (response.ok && response.data?.redirectTo) {
          router.replace(response.data.redirectTo);
          router.refresh();
        }
      } catch (error) {
        setResult({
          ok: false,
          message: error instanceof Error ? error.message : "Failed to upload the passport photo.",
        });
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

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-50">Profile Photo</h2>
            <p className="text-sm text-slate-400">Upload a passport photo for the student profile.</p>
          </div>

          <div
            {...getRootProps()}
            className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-4 text-center transition-colors hover:border-orange-400/40 hover:bg-slate-950/60"
          >
            <input {...getInputProps({ id: passportInputId })} />
            {passportPreview ? (
              <div className="w-full space-y-4">
                <div className="mx-auto flex size-28 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                  <img alt={fullName || "Student passport"} className="size-full object-cover" src={passportPreview} />
                </div>
                <p className="text-sm font-medium text-slate-100">{selectedFile?.name ?? "Current passport photo"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-200">
                  {isDragActive ? <CloudUpload className="size-6" /> : <UserRound className="size-6" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-50">{isDragActive ? "Drop the passport photo here" : "Drag and drop a passport photo"}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">PNG, JPG, or WebP up to 2MB.</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
              type="button"
              variant="outline"
              onClick={() => document.getElementById(passportInputId)?.click()}
            >
              <CloudUpload className="size-4" />
              Choose file
            </Button>
            <Button className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" onClick={clearPassport} type="button" variant="outline">
              <Trash2 className="size-4" />
              Clear
            </Button>
          </div>

          {passportError ? <p className="text-sm text-red-300">{passportError}</p> : null}
        </section>

        <section className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input className="border-white/10 bg-slate-950/40 text-slate-100" disabled={!canSubmit} id="firstName" {...register("firstName")} />
              {getFieldError("firstName") ? <p className="text-sm text-red-300">{getFieldError("firstName")}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input className="border-white/10 bg-slate-950/40 text-slate-100" disabled={!canSubmit} id="lastName" {...register("lastName")} />
              {getFieldError("lastName") ? <p className="text-sm text-red-300">{getFieldError("lastName")}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="middleName">Middle name</Label>
              <Input className="border-white/10 bg-slate-950/40 text-slate-100" disabled={!canSubmit} id="middleName" {...register("middleName")} />
              {getFieldError("middleName") ? <p className="text-sm text-red-300">{getFieldError("middleName")}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="admissionNumber">Admission number</Label>
              <Input
                className="border-white/10 bg-slate-950/40 text-slate-100"
                disabled={!canSubmit}
                id="admissionNumber"
                {...register("admissionNumber")}
              />
              {getFieldError("admissionNumber") ? <p className="text-sm text-red-300">{getFieldError("admissionNumber")}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <select
                className="h-11 w-full rounded-md border border-white/10 bg-slate-950/40 px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-orange-400/40"
                disabled={!canSubmit}
                id="gender"
                {...register("gender")}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {getFieldError("gender") ? <p className="text-sm text-red-300">{getFieldError("gender")}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <Input className="border-white/10 bg-slate-950/40 text-slate-100" disabled={!canSubmit} id="dateOfBirth" type="date" {...register("dateOfBirth")} />
              {getFieldError("dateOfBirth") ? <p className="text-sm text-red-300">{getFieldError("dateOfBirth")}</p> : null}
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

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="parentName">Parent name</Label>
              <Input className="border-white/10 bg-slate-950/40 text-slate-100" disabled={!canSubmit} id="parentName" {...register("parentName")} />
              {getFieldError("parentName") ? <p className="text-sm text-red-300">{getFieldError("parentName")}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentPhone">Parent phone</Label>
              <Input className="border-white/10 bg-slate-950/40 text-slate-100" disabled={!canSubmit} id="parentPhone" {...register("parentPhone")} />
              {getFieldError("parentPhone") ? <p className="text-sm text-red-300">{getFieldError("parentPhone")}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentEmail">Parent email</Label>
              <Input
                className="border-white/10 bg-slate-950/40 text-slate-100"
                disabled={!canSubmit}
                id="parentEmail"
                type="email"
                {...register("parentEmail")}
              />
              {getFieldError("parentEmail") ? <p className="text-sm text-red-300">{getFieldError("parentEmail")}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                className="h-11 w-full rounded-md border border-white/10 bg-slate-950/40 px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-orange-400/40"
                disabled={!canSubmit}
                id="status"
                {...register("status")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
                <option value="archived">Archived</option>
              </select>
              {getFieldError("status") ? <p className="text-sm text-red-300">{getFieldError("status")}</p> : null}
            </div>
          </div>

          <input type="hidden" {...register("passportUrl")} />

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            <div className="flex items-center gap-2 text-slate-100">
              <CheckCircle2 className="size-4 text-emerald-300" />
              Permanent student code will be generated automatically after save.
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-400">The student code is unique, searchable, and never changes.</p>
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 -mx-5 border-t border-white/10 bg-[#07111f]/95 px-5 py-4 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
            disabled={isPending}
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
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
