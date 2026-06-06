import type { ReactNode } from "react";

import type { UploadStatus } from "@/types/database";

type ResultStatusBadgeProps = {
  status: UploadStatus | "edited" | "edited-after-publish";
  children?: ReactNode;
};

const styles: Record<ResultStatusBadgeProps["status"], string> = {
  draft: "border-slate-300/20 bg-slate-500/10 text-slate-100",
  validating: "border-sky-300/20 bg-sky-500/10 text-sky-100",
  validated: "border-emerald-300/20 bg-emerald-500/10 text-emerald-100",
  failed: "border-red-300/20 bg-red-500/10 text-red-100",
  published: "border-orange-300/20 bg-orange-500/10 text-orange-100",
  archived: "border-zinc-300/20 bg-zinc-500/10 text-zinc-100",
  edited: "border-blue-300/20 bg-blue-500/10 text-blue-100",
  "edited-after-publish": "border-amber-300/30 bg-amber-500/15 text-amber-100",
};

const labels: Record<ResultStatusBadgeProps["status"], string> = {
  draft: "Draft",
  validating: "Validating",
  validated: "Validated",
  failed: "Failed",
  published: "Published",
  archived: "Archived",
  edited: "Edited",
  "edited-after-publish": "Edited after publish",
};

export function ResultStatusBadge({ status, children }: ResultStatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {children ?? labels[status]}
    </span>
  );
}
