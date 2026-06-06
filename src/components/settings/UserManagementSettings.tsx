"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";

import { updateTeacherSignatureAction } from "@/actions/settings/update-teacher-signature-action";
import { updateUserRoleAction } from "@/actions/settings/update-user-role-action";
import { updateUserStatusAction } from "@/actions/settings/update-user-status-action";
import { ImageUploadField } from "@/components/settings/ImageUploadField";
import { Button } from "@/components/ui/button";
import { getMetadataObject, getMetadataString, type SchoolUser } from "@/lib/settings/settings-types";

export function UserManagementSettings({ users, currentUserId, canManage, schoolId }: { users: SchoolUser[]; currentUserId: string; canManage: boolean; schoolId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function updateRole(userId: string, role: "admin" | "headmaster" | "teacher") {
    startTransition(async () => {
      const result = await updateUserRoleAction({ userId, role });
      setMessage(result.message);
    });
  }

  function updateStatus(userId: string, isActive: boolean) {
    startTransition(async () => {
      const result = await updateUserStatusAction({ userId, isActive });
      setMessage(result.message);
    });
  }

  function updateTeacherSignature(userId: string, signatureUrl: string) {
    startTransition(async () => {
      const result = await updateTeacherSignatureAction({ userId, signatureUrl });
      setMessage(result.message);
    });
  }

  return (
    <section className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/75 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">User Management</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">Manage existing staff roles and access status for this school.</p>
        </div>
        <Button className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" disabled type="button" variant="outline">
          <UserPlus className="size-4" />
          Invite user soon
        </Button>
      </div>
      {message ? <p className={message.includes("updated") || message.includes("deactivated") || message.includes("reactivated") ? "text-sm text-emerald-300" : "text-sm text-red-300"}>{message}</p> : null}
      {!canManage ? <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">Headmasters can view users. Only admins can manage roles and account status.</p> : null}
      <div className="grid gap-3 lg:grid-cols-2">
        <WorkflowCard
          badge="Recommended"
          title="Option A: Admin Upload Workflow"
          description="Best for schools that want teachers to fill Excel sheets and send them back through WhatsApp or email. Admin/headmaster uploads the completed file."
        />
        <WorkflowCard
          badge="Optional / Advanced"
          title="Option B: Teacher Login Workflow"
          description="Best for schools that want teachers to log in, access assigned classes, and upload results directly."
        />
      </div>
      <p className="rounded-xl border border-amber-400/20 bg-amber-500/[0.06] px-4 py-3 text-sm leading-6 text-amber-100">
        Teacher accounts are optional. You can download Excel templates, send them to teachers, and upload completed sheets yourself. Only create teacher accounts if this school wants teachers to log in directly.
      </p>
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="hidden grid-cols-[1.2fr_1.2fr_0.8fr_0.7fr_0.8fr_1fr] gap-3 bg-slate-950/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 lg:grid">
          <span>Name</span><span>Email</span><span>Role</span><span>Status</span><span>Created</span><span>Actions</span>
        </div>
        <div className="divide-y divide-white/10">
          {users.map((user) => (
            <div className="grid gap-3 px-4 py-4 text-sm text-slate-200 lg:grid-cols-[1.2fr_1.2fr_0.8fr_0.7fr_0.8fr_1fr]" key={user.id}>
              <span className="font-medium text-slate-50">{user.full_name}{user.id === currentUserId ? " (you)" : ""}</span>
              <span>{user.email ?? "No email"}</span>
              <select className="h-10 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-slate-100" disabled={!canManage || pending} value={user.role} onChange={(event) => updateRole(user.id, event.target.value as "admin" | "headmaster" | "teacher")}>
                <option value="admin">Admin</option>
                <option value="headmaster">Headmaster</option>
                <option value="teacher">Teacher</option>
              </select>
              <span className={user.is_active ? "text-emerald-300" : "text-red-300"}>{user.is_active ? "Active" : "Inactive"}</span>
              <span>{new Date(user.created_at).toLocaleDateString()}</span>
              <Button className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" disabled={!canManage || pending || user.id === currentUserId} type="button" variant="outline" onClick={() => updateStatus(user.id, !user.is_active)}>
                {user.is_active ? "Deactivate" : "Reactivate"}
              </Button>
              {user.role === "teacher" ? (
                <div className="lg:col-span-6">
                  <ImageUploadField
                    bucket="signatures"
                    disabled={!canManage || pending}
                    fixedBaseName="signature"
                    label={`Teacher signature for ${user.full_name}`}
                    pathPrefix={`teachers/${user.id}`}
                    schoolId={schoolId}
                    value={getMetadataString(getMetadataObject(user.metadata), "teacher_signature_url")}
                    onChange={(url) => updateTeacherSignature(user.id, url)}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowCard({ badge, title, description }: { badge: string; title: string; description: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <span className="inline-flex rounded-full border border-orange-400/20 bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-200">{badge}</span>
      <h3 className="mt-3 font-semibold text-slate-50">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </article>
  );
}
