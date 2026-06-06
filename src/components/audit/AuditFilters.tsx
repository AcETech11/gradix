"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auditFilterSchema, type AuditFilters, type AuditLogItem } from "@/lib/audit/audit-types";
import { formatAuditEntity } from "@/lib/audit/format-audit-details";
import type { AppRole, AuditAction } from "@/types/database";

type AuditFiltersProps = {
  logs: AuditLogItem[];
};

const actions: AuditAction[] = ["insert", "update", "delete", "publish", "unpublish", "validate"];
const roles: AppRole[] = ["admin", "headmaster", "teacher"];

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export function AuditFilters({ logs }: AuditFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const users = Array.from(
    new Map(logs.filter((log) => log.actor.id).map((log) => [log.actor.id as string, log.actor.name])).entries(),
  ).sort(([, firstName], [, secondName]) => firstName.localeCompare(secondName));
  const entities = unique(logs.map((log) => log.entity));
  const form = useForm<AuditFilters>({
    resolver: zodResolver(auditFilterSchema),
    defaultValues: {
      action: searchParams.get("action") ?? "",
      role: searchParams.get("role") ?? "",
      entity: searchParams.get("entity") ?? "",
      user: searchParams.get("user") ?? "",
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
      search: searchParams.get("search") ?? "",
    },
  });

  function submit(values: AuditFilters) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(values)) {
      if (value?.trim()) {
        params.set(key, value.trim());
      }
    }

    router.push(`/dashboard/audit${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function clearFilters() {
    form.reset({ action: "", role: "", entity: "", user: "", from: "", to: "", search: "" });
    router.push("/dashboard/audit");
  }

  return (
    <form className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 md:grid-cols-2 xl:grid-cols-7" onSubmit={form.handleSubmit(submit)}>
      <label className="space-y-1 xl:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Search</span>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <Input className="border-white/10 bg-slate-950/70 pl-9 text-slate-100" placeholder="Student, user, subject, class..." {...form.register("search")} />
        </div>
      </label>

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Action</span>
        <select className="h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-100" {...form.register("action")}>
          <option value="">All actions</option>
          {actions.map((action) => (
            <option value={action} key={action}>
              {action}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Role</span>
        <select className="h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-100" {...form.register("role")}>
          <option value="">All roles</option>
          {roles.map((role) => (
            <option value={role} key={role}>
              {role}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Entity</span>
        <select className="h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-100" {...form.register("entity")}>
          <option value="">All entities</option>
          {entities.map((entity) => (
            <option value={entity} key={entity}>
              {formatAuditEntity(entity)}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">User</span>
        <select className="h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-100" {...form.register("user")}>
          <option value="">All users</option>
          {users.map(([userId, userName]) => (
            <option value={userId} key={userId}>
              {userName}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">From</span>
        <Input className="border-white/10 bg-slate-950/70 text-slate-100" type="date" {...form.register("from")} />
      </label>

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">To</span>
        <Input className="border-white/10 bg-slate-950/70 text-slate-100" type="date" {...form.register("to")} />
      </label>

      <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-7">
        <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400" type="submit">
          <SlidersHorizontal className="size-4" />
          Apply filters
        </Button>
        <Button className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" type="button" variant="outline" onClick={clearFilters}>
          <X className="size-4" />
          Clear
        </Button>
      </div>
    </form>
  );
}
