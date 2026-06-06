"use server";

import { requireCanViewAuditLogs } from "@/lib/auth/authorization";
import { auditFilterSchema, type AuditFilters, type AuditLogItem } from "@/lib/audit/audit-types";
import { formatAuditSummary, matchesAuditSearch } from "@/lib/audit/format-audit-details";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, AuditAction, Json } from "@/types/database";

type RawAuditLog = {
  id: string;
  actor_id: string | null;
  actor_role: AppRole | null;
  action: AuditAction;
  table_name: string;
  record_id: string | null;
  details: Json;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

type RawActor = {
  id: string;
  full_name: string;
  email: string | null;
};

function cleanFilterValue(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

function normalizeFilters(input: unknown): AuditFilters {
  const parsed = auditFilterSchema.safeParse(input);

  if (!parsed.success) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(parsed.data).map(([key, value]) => [key, cleanFilterValue(value)]),
  ) as AuditFilters;
}

function detailsText(details: Json) {
  if (details === null || details === undefined) {
    return "";
  }

  if (typeof details === "string") {
    return details;
  }

  return JSON.stringify(details);
}

export async function getAuditLogsAction(input?: unknown): Promise<AuditLogItem[]> {
  const profile = await requireCanViewAuditLogs();
  const filters = normalizeFilters(input);
  const supabase = await createClient();

  let query = supabase
    .from("audit_logs")
    .select("id, actor_id, actor_role, action, table_name, record_id, details, ip_address, user_agent, created_at")
    .eq("school_id", profile.school_id)
    .order("created_at", { ascending: false })
    .limit(500);

  if (filters.action) {
    query = query.eq("action", filters.action as AuditAction);
  }

  if (filters.role) {
    query = query.eq("actor_role", filters.role as AppRole);
  }

  if (filters.entity) {
    query = query.eq("table_name", filters.entity);
  }

  if (filters.from) {
    query = query.gte("created_at", new Date(filters.from).toISOString());
  }

  if (filters.to) {
    const toDate = new Date(filters.to);
    toDate.setHours(23, 59, 59, 999);
    query = query.lte("created_at", toDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as RawAuditLog[];
  const actorIds = Array.from(new Set(rows.map((row) => row.actor_id).filter((id): id is string => Boolean(id))));
  const actors = new Map<string, RawActor>();

  if (actorIds.length) {
    const { data: actorRows, error: actorError } = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("school_id", profile.school_id)
      .in("id", actorIds);

    if (actorError) {
      throw new Error(actorError.message);
    }

    for (const actor of (actorRows ?? []) as RawActor[]) {
      actors.set(actor.id, actor);
    }
  }

  return rows
    .map((row) => {
      const actor = row.actor_id ? actors.get(row.actor_id) : undefined;
      const summary = formatAuditSummary(row.action, row.table_name, row.details);

      return {
        id: row.id,
        actor: {
          id: row.actor_id,
          name: actor?.full_name ?? "System",
          email: actor?.email ?? null,
        },
        actorRole: row.actor_role,
        action: row.action,
        entity: row.table_name,
        recordId: row.record_id,
        details: row.details,
        summary,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: row.created_at,
      };
    })
    .filter((item) => (filters.user ? item.actor.id === filters.user : true))
    .filter((item) =>
      matchesAuditSearch(
        [
          item.actor.name,
          item.actor.email ?? "",
          item.action,
          item.entity,
          item.summary,
          item.recordId ?? "",
          item.ipAddress ?? "",
          detailsText(item.details),
        ],
        filters.search,
      ),
    );
}
