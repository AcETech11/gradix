"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Infinity, RotateCcw, SlidersHorizontal } from "lucide-react";

import { increaseParentAccessLimitAction, resetParentAccessViewsAction, setParentAccessUnlimitedAction } from "@/actions/parent-access/update-parent-access-limit-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ParentAccessStatusBadge } from "@/components/parent-access/ParentAccessStatusBadge";
import { formatRemaining, formatTerm, formatViews } from "@/lib/parent-access/parent-access-formatters";
import type { ParentAccessRecord } from "@/lib/parent-access/parent-access-types";

type ParentAccessTableProps = {
  records: ParentAccessRecord[];
  canManage: boolean;
};

function formatCheckedAt(value: string | null) {
  return value ? format(new Date(value), "MMM d, yyyy h:mm a") : "Never";
}

export function ParentAccessTable({ canManage, records }: ParentAccessTableProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [selectedReset, setSelectedReset] = useState<ParentAccessRecord | null>(null);
  const [selectedLimit, setSelectedLimit] = useState<ParentAccessRecord | null>(null);
  const [newLimit, setNewLimit] = useState("");
  const [pending, startTransition] = useTransition();

  const columns = useMemo<ColumnDef<ParentAccessRecord>[]>(
    () => [
      {
        accessorKey: "studentName",
        header: "Student Name",
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-slate-50">{row.original.studentName}</p>
            <p className="mt-1 font-mono text-xs text-slate-400">{row.original.studentCode}</p>
          </div>
        ),
      },
      { accessorKey: "className", header: "Class" },
      { accessorKey: "term", header: "Term", cell: ({ row }) => formatTerm(row.original.term) },
      { accessorKey: "academicYear", header: "Academic Year" },
      { accessorKey: "viewsUsed", header: "Views Used", cell: ({ row }) => formatViews(row.original.viewsUsed, row.original.maxViews) },
      { accessorKey: "viewsRemaining", header: "Views Remaining", cell: ({ row }) => formatRemaining(row.original.viewsUsed, row.original.maxViews) },
      {
        accessorKey: "lastCheckedAt",
        header: "Last Checked",
        cell: ({ row }) => formatCheckedAt(row.original.lastCheckedAt),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <ParentAccessStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button className="h-9 border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" type="button" variant="outline" onClick={() => setSelectedReset(row.original)}>
                <RotateCcw className="size-4" />
                Reset
              </Button>
              <Button
                className="h-9 border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedLimit(row.original);
                  setNewLimit(String(Math.min((row.original.maxViews ?? row.original.viewsUsed) + 5, 100)));
                }}
              >
                <SlidersHorizontal className="size-4" />
                Increase
              </Button>
              <Button className="h-9 border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" type="button" variant="outline" onClick={() => setUnlimited(row.original)}>
                <Infinity className="size-4" />
                Unlimited
              </Button>
            </div>
          ) : (
            <span className="text-sm text-slate-400">View only</span>
          ),
      },
    ],
    [canManage],
  );
  // TanStack Table returns function-heavy instances that React Compiler intentionally skips.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ columns, data: records, getCoreRowModel: getCoreRowModel() });

  function resetViews() {
    if (!selectedReset) return;

    startTransition(async () => {
      const result = await resetParentAccessViewsAction({
        studentId: selectedReset.studentId,
        term: selectedReset.term,
        academicYear: selectedReset.academicYear,
      });

      setMessage(result.message);
      if (result.ok) setSelectedReset(null);
    });
  }

  function increaseLimit() {
    if (!selectedLimit) return;

    startTransition(async () => {
      const result = await increaseParentAccessLimitAction({
        studentId: selectedLimit.studentId,
        term: selectedLimit.term,
        academicYear: selectedLimit.academicYear,
        maxUses: Number(newLimit),
      });

      setMessage(result.message);
      if (result.ok) setSelectedLimit(null);
    });
  }

  function setUnlimited(record: ParentAccessRecord) {
    if (!window.confirm(`Set unlimited parent result views for ${record.studentName}?`)) return;

    startTransition(async () => {
      const result = await setParentAccessUnlimitedAction({
        studentId: record.studentId,
        term: record.term,
        academicYear: record.academicYear,
      });

      setMessage(result.message);
    });
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Per-student access status</h2>
          <p className="text-sm text-slate-400">Monitor result code usage for the selected term and academic year.</p>
        </div>
      </div>
      {message ? <p className={message.includes("success") || message.includes("updated") ? "mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200" : "mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"}>{message}</p> : null}

      <div className="mt-4 hidden overflow-x-auto xl:block">
        <table className="min-w-[90rem] w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-slate-400">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr className="border-b border-white/10" key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th className="px-3 py-3 font-semibold" key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr className="border-b border-white/5 text-slate-200 last:border-0" key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td className="px-3 py-4 align-top" key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 xl:hidden">
        {records.map((record) => (
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4" key={`${record.studentId}-${record.term}-${record.academicYear}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-50">{record.studentName}</p>
                <p className="mt-1 font-mono text-xs text-slate-400">{record.studentCode}</p>
              </div>
              <ParentAccessStatusBadge status={record.status} />
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
              <p>Class: {record.className}</p>
              <p>{formatTerm(record.term)}, {record.academicYear}</p>
              <p>{formatViews(record.viewsUsed, record.maxViews)}</p>
              <p>{formatRemaining(record.viewsUsed, record.maxViews)}</p>
              <p>Last checked: {formatCheckedAt(record.lastCheckedAt)}</p>
            </div>
            {canManage ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" type="button" variant="outline" onClick={() => setSelectedReset(record)}>
                  <RotateCcw className="size-4" />
                  Reset Views
                </Button>
                <Button className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" type="button" variant="outline" onClick={() => { setSelectedLimit(record); setNewLimit(String(Math.min((record.maxViews ?? record.viewsUsed) + 5, 100))); }}>
                  <SlidersHorizontal className="size-4" />
                  Increase Limit
                </Button>
                <Button className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" type="button" variant="outline" onClick={() => setUnlimited(record)}>
                  <Infinity className="size-4" />
                  Set Unlimited
                </Button>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {selectedReset ? (
        <Dialog title="Reset parent access views?" onClose={() => setSelectedReset(null)}>
          <p className="text-sm leading-6 text-slate-300">
            This will reset the view count for {selectedReset.studentName}&apos;s result for {formatTerm(selectedReset.term)}, {selectedReset.academicYear}. The parent will continue using the same permanent student code.
          </p>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button className="border-white/10 bg-white/5 text-slate-100" disabled={pending} type="button" variant="outline" onClick={() => setSelectedReset(null)}>Cancel</Button>
            <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400" disabled={pending} type="button" onClick={resetViews}>{pending ? "Resetting..." : "Reset Views"}</Button>
          </div>
        </Dialog>
      ) : null}

      {selectedLimit ? (
        <Dialog title="Increase parent access limit" onClose={() => setSelectedLimit(null)}>
          <div className="space-y-3 text-sm text-slate-300">
            <p>Current views used: <strong className="text-slate-50">{selectedLimit.viewsUsed}</strong></p>
            <p>Current limit: <strong className="text-slate-50">{selectedLimit.maxViews ?? "Unlimited"}</strong></p>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">New Limit</span>
              <Input className="border-white/10 bg-slate-950/60 text-slate-100" max={100} min={Math.max(selectedLimit.viewsUsed, 1)} type="number" value={newLimit} onChange={(event) => setNewLimit(event.target.value)} />
            </label>
            <p className="text-xs leading-5 text-slate-400">New limit must be between 1 and 100, and cannot be below current views used.</p>
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button className="border-white/10 bg-white/5 text-slate-100" disabled={pending} type="button" variant="outline" onClick={() => setSelectedLimit(null)}>Cancel</Button>
            <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400" disabled={pending} type="button" onClick={increaseLimit}>{pending ? "Updating..." : "Update Limit"}</Button>
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}

function Dialog({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/80 p-3 backdrop-blur sm:items-center sm:p-4">
      <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
          <button className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-white/10 hover:text-slate-100" type="button" onClick={onClose}>Close</button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
