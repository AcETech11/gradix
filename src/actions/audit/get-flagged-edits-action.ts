"use server";

import { requireCanViewAuditLogs } from "@/lib/auth/authorization";
import { getFlaggedEditValues } from "@/lib/audit/format-audit-details";
import { createClient } from "@/lib/supabase/server";
import type { FlaggedEditItem } from "@/lib/audit/audit-types";
import type { AppRole, Json } from "@/types/database";

type RawFlaggedAudit = {
  id: string;
  actor_id: string | null;
  details: Json;
  created_at: string;
};

type RawActor = {
  id: string;
  full_name: string;
  email: string | null;
  role: AppRole;
};

export async function getFlaggedEditsAction(): Promise<FlaggedEditItem[]> {
  const profile = await requireCanViewAuditLogs();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, actor_id, details, created_at")
    .eq("school_id", profile.school_id)
    .eq("table_name", "results")
    .eq("action", "update")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as RawFlaggedAudit[];
  const actorIds = Array.from(new Set(rows.map((row) => row.actor_id).filter((id): id is string => Boolean(id))));
  const actors = new Map<string, RawActor>();

  if (actorIds.length) {
    const { data: actorRows, error: actorError } = await supabase
      .from("users")
      .select("id, full_name, email, role")
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
      const values = getFlaggedEditValues(row.details);

      if (!values) {
        return null;
      }

      const actor = row.actor_id ? actors.get(row.actor_id) : undefined;

      return {
        id: row.id,
        student: values.student,
        subject: values.subject,
        oldScore: values.oldScore,
        newScore: values.newScore,
        editedBy: actor?.full_name ?? "System",
        editedAt: row.created_at,
      };
    })
    .filter((item): item is FlaggedEditItem => Boolean(item));
}
