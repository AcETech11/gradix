"use client";

import { useState, useTransition } from "react";
import { MessageSquareText } from "lucide-react";

import { updateClassTeacherCommentAction } from "@/actions/results/update-class-teacher-comment-action";
import { Button } from "@/components/ui/button";
import type { ResultReviewRow } from "@/lib/results/result-types";

export function ClassTeacherCommentDialog({
  disabled,
  onMessage,
  result,
  uploadId,
}: {
  disabled: boolean;
  onMessage: (message: string) => void;
  result: ResultReviewRow;
  uploadId: string;
}) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState(result.classTeacherComment ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const response = await updateClassTeacherCommentAction({
        uploadId,
        studentId: result.studentId,
        comment,
      });

      onMessage(response.message);
      if (response.ok) {
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" disabled={disabled} type="button" variant="outline" onClick={() => setOpen(true)}>
        <MessageSquareText className="size-4" />
        Comment
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-50">Class Teacher Comment</h3>
                <p className="mt-1 text-sm text-slate-400">{result.studentName}</p>
              </div>
              <button className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-white/10 hover:text-slate-100" type="button" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <textarea
              className="mt-4 min-h-32 w-full rounded-xl border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-100 outline-none focus:border-orange-300"
              maxLength={240}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
            <p className="mt-2 text-xs text-slate-400">{comment.length}/240 characters</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button className="border-white/10 bg-white/5 text-slate-100" disabled={pending} type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400" disabled={pending} type="button" onClick={save}>
                {pending ? "Saving..." : "Save Comment"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
