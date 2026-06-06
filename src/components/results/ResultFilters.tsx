"use client";

import type { UploadStatus } from "@/types/database";

type ResultFiltersProps = {
  search: string;
  status: "all" | UploadStatus;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: "all" | UploadStatus) => void;
};

export function ResultFilters({ search, status, onSearchChange, onStatusChange }: ResultFiltersProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        className="h-10 rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-50 outline-none focus:border-orange-300"
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search class, term, uploader"
        value={search}
      />
      <select
        className="h-10 rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-50 outline-none focus:border-orange-300"
        onChange={(event) => onStatusChange(event.target.value as "all" | UploadStatus)}
        value={status}
      >
        <option value="all">All statuses</option>
        <option value="draft">Draft</option>
        <option value="validated">Validated</option>
        <option value="published">Published</option>
        <option value="archived">Archived</option>
        <option value="failed">Failed</option>
      </select>
    </div>
  );
}
