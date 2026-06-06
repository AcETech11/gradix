"use client";

import { Fragment, useMemo, useState } from "react";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";

import { AuditActionBadge } from "@/components/audit/AuditActionBadge";
import { AuditDetailsDrawer } from "@/components/audit/AuditDetailsDrawer";
import { AuditEmptyState } from "@/components/audit/AuditEmptyState";
import { Button } from "@/components/ui/button";
import type { AuditLogItem } from "@/lib/audit/audit-types";
import { formatAuditEntity } from "@/lib/audit/format-audit-details";
import { cn } from "@/lib/utils";

type AuditLogTableProps = {
  logs: AuditLogItem[];
};

function formatDate(value: string) {
  return format(new Date(value), "MMM d, yyyy h:mm a");
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const columns = useMemo<ColumnDef<AuditLogItem>[]>(
    () => [
      {
        id: "expand",
        header: "",
        cell: ({ row }) => {
          const open = Boolean(expanded[row.original.id]);

          return (
            <Button
              aria-expanded={open}
              aria-label={open ? "Collapse audit details" : "Expand audit details"}
              className="size-8 border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              size="icon"
              type="button"
              variant="outline"
              onClick={() => setExpanded((current) => ({ ...current, [row.original.id]: !current[row.original.id] }))}
            >
              {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </Button>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Date & Time",
        cell: ({ row }) => <span className="whitespace-nowrap text-slate-200">{formatDate(row.original.createdAt)}</span>,
      },
      {
        accessorKey: "actor.name",
        header: "User",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-100">{row.original.actor.name}</p>
            {row.original.actor.email ? <p className="text-xs text-slate-500">{row.original.actor.email}</p> : null}
          </div>
        ),
      },
      {
        accessorKey: "actorRole",
        header: "Role",
        cell: ({ row }) => <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{row.original.actorRole ?? "system"}</span>,
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => <AuditActionBadge action={row.original.action} />,
      },
      {
        accessorKey: "entity",
        header: "Entity/Table",
        cell: ({ row }) => <span className="text-slate-200">{formatAuditEntity(row.original.entity)}</span>,
      },
      {
        accessorKey: "summary",
        header: "Details",
        cell: ({ row }) => <span className="line-clamp-2 text-slate-300">{row.original.summary}</span>,
      },
      {
        accessorKey: "ipAddress",
        header: "IP Address",
        cell: ({ row }) => <span className="text-slate-400">{row.original.ipAddress ?? "N/A"}</span>,
      },
    ],
    [expanded],
  );
  // TanStack Table intentionally returns function-heavy objects that React Compiler cannot memoize safely.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: logs, columns, getCoreRowModel: getCoreRowModel() });

  if (!logs.length) {
    return <AuditEmptyState />;
  }

  return (
    <div className="space-y-4">
      <div className="hidden overflow-hidden rounded-2xl border border-white/10 lg:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-950/80 text-xs uppercase tracking-[0.14em] text-slate-400">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th className="px-4 py-3 font-semibold" key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-white/10 bg-slate-900/50">
            {table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <tr className="align-top transition-colors hover:bg-white/[0.03]">
                  {row.getVisibleCells().map((cell) => (
                    <td className="px-4 py-4" key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                {expanded[row.original.id] ? (
                  <tr>
                    <td className="px-4 pb-4" colSpan={columns.length}>
                      <AuditDetailsDrawer log={row.original} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {logs.map((log) => {
          const open = Boolean(expanded[log.id]);

          return (
            <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-4" key={log.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-50">{log.summary}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(log.createdAt)}</p>
                </div>
                <AuditActionBadge action={log.action} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">User</dt>
                  <dd className="mt-1 text-slate-200">{log.actor.name}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Entity</dt>
                  <dd className="mt-1 text-slate-200">{formatAuditEntity(log.entity)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Role</dt>
                  <dd className="mt-1 text-slate-200">{log.actorRole ?? "system"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">IP</dt>
                  <dd className="mt-1 text-slate-200">{log.ipAddress ?? "N/A"}</dd>
                </div>
              </dl>
              <Button
                className={cn("mt-4 w-full border-white/10 bg-white/5 text-slate-200 hover:bg-white/10", open && "bg-white/10")}
                type="button"
                variant="outline"
                onClick={() => setExpanded((current) => ({ ...current, [log.id]: !current[log.id] }))}
              >
                {open ? "Hide details" : "View details"}
              </Button>
              {open ? (
                <div className="mt-3">
                  <AuditDetailsDrawer log={log} />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
