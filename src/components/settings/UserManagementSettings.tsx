"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";

import { updateUserRoleAction } from "@/actions/settings/update-user-role-action";
import { updateUserStatusAction } from "@/actions/settings/update-user-status-action";
import { Button } from "@/components/ui/button";
import type { SchoolUser } from "@/lib/settings/settings-types";

export function UserManagementSettings({ users, currentUserId, canManage }: { users: SchoolUser[]; currentUserId: string; canManage: boolean }) {
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
