"use client";

import { useActionState } from "react";
import { Archive } from "lucide-react";

import { archiveStudentAction } from "@/actions/students";
import { AuthSpinner } from "@/components/auth/auth-loading";
import { Button } from "@/components/ui/button";
import type { AuthActionState } from "@/types/auth";

type StudentArchiveButtonProps = {
  studentId: string;
};

const initialState: AuthActionState<{ studentId: string }> = {
  ok: false,
  message: "",
};

export function StudentArchiveButton({ studentId }: StudentArchiveButtonProps) {
  const [state, formAction, isPending] = useActionState(async () => archiveStudentAction(studentId), initialState);

  return (
    <form action={formAction}>
      <Button className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" disabled={isPending} type="submit" variant="outline">
        {isPending ? <AuthSpinner label="Archiving" /> : <Archive className="size-4" />}
        Archive
      </Button>
      {state.message ? <p className="mt-2 text-sm text-slate-400">{state.message}</p> : null}
    </form>
  );
}
