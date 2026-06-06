import { z } from "zod";

import type { AppRole, AuditAction, Json } from "@/types/database";

export const auditFilterSchema = z.object({
  action: z.string().optional(),
  role: z.string().optional(),
  entity: z.string().optional(),
  user: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
});

export type AuditFilters = z.infer<typeof auditFilterSchema>;

export type AuditActor = {
  id: string | null;
  name: string;
  email: string | null;
};

export type AuditLogItem = {
  id: string;
  actor: AuditActor;
  actorRole: AppRole | null;
  action: AuditAction;
  entity: string;
  recordId: string | null;
  details: Json;
  summary: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type FlaggedEditItem = {
  id: string;
  student: string;
  subject: string;
  oldScore: string;
  newScore: string;
  editedBy: string;
  editedAt: string;
};

export type AuditExportResult =
  | {
      ok: true;
      fileName: string;
      mimeType: string;
      base64: string;
    }
  | {
      ok: false;
      message: string;
    };
