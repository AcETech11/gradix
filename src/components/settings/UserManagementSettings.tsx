"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Loader2, UserPlus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createStaffInvitationAction, revokeStaffInvitationAction } from "@/actions/settings/staff-invitation-actions";
import { assignClassTeacherAction, updateSchoolStaffSignatureAction, updateSchoolStaffStatusAction, upsertSchoolStaffAction } from "@/actions/settings/school-staff-actions";
import { updateTeacherSignatureAction } from "@/actions/settings/update-teacher-signature-action";
import { updateUserRoleAction } from "@/actions/settings/update-user-role-action";
import { updateUserStatusAction } from "@/actions/settings/update-user-status-action";
import { ImageUploadField } from "@/components/settings/ImageUploadField";
import { Button } from "@/components/ui/button";
import { getMetadataObject, getMetadataString, type SchoolClassAssignment, type SchoolInvitation, type SchoolStaff, type SchoolUser } from "@/lib/settings/settings-types";

const inviteSchema = z.object({
  fullName: z.string().min(2, "Enter the staff member's name."),
  email: z.string().email("Enter a valid email."),
  role: z.enum(["admin", "headmaster", "teacher"]),
});

const staffSchema = z.object({
  staffId: z.string().optional(),
  fullName: z.string().trim().min(2, "Full name is required."),
  email: z.string().email("Enter a valid email.").optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.enum(["admin", "headmaster", "teacher"]),
});

type InviteFormValues = z.infer<typeof inviteSchema>;
type StaffFormValues = z.infer<typeof staffSchema>;

type Props = {
  users: SchoolUser[];
  schoolStaff: SchoolStaff[];
  classAssignments: SchoolClassAssignment[];
  invitations: SchoolInvitation[];
  currentUserId: string;
  canManage: boolean;
  schoolId: string;
};

export function UserManagementSettings({ users, schoolStaff, classAssignments, invitations, currentUserId, canManage, schoolId }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<SchoolStaff | null>(null);
  const [pending, startTransition] = useTransition();
  const assignableStaff = useMemo(() => schoolStaff.filter((staff) => staff.is_active && (staff.role === "teacher" || staff.role === "headmaster")), [schoolStaff]);
  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { fullName: "", email: "", role: "teacher" },
  });
  const staffForm = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: { fullName: "", email: "", phone: "", role: "teacher" },
  });

  function createInvite(values: InviteFormValues) {
    setMessage(null);
    setInviteUrl(null);
    startTransition(async () => {
      const result = await createStaffInvitationAction(values);
      setMessage(result.message);
      if (result.ok && result.data?.inviteUrl) {
        const absoluteUrl = `${window.location.origin}${result.data.inviteUrl}`;
        setInviteUrl(absoluteUrl);
        await navigator.clipboard?.writeText(absoluteUrl).catch(() => undefined);
        inviteForm.reset({ fullName: "", email: "", role: "teacher" });
      }
    });
  }

  function saveStaff(values: StaffFormValues) {
    startTransition(async () => {
      const result = await upsertSchoolStaffAction(values);
      setMessage(result.message);
      if (result.ok) {
        staffForm.reset({ staffId: "", fullName: "", email: "", phone: "", role: "teacher" });
        setEditingStaff(null);
      }
    });
  }

  function editStaff(staff: SchoolStaff) {
    setEditingStaff(staff);
    staffForm.reset({
      staffId: staff.id,
      fullName: staff.full_name,
      email: staff.email ?? "",
      phone: staff.phone ?? "",
      role: staff.role,
    });
  }

  function updateStaffStatus(staff: SchoolStaff, isActive: boolean) {
    const assigned = classAssignments.some((schoolClass) => schoolClass.classTeacherStaffId === staff.id);
    if (!isActive && assigned && !window.confirm("This teacher is assigned to one or more classes. Deactivating will stop new assignments but historical reports will remain unchanged.")) return;

    startTransition(async () => {
      const result = await updateSchoolStaffStatusAction({ staffId: staff.id, isActive });
      setMessage(result.message);
    });
  }

  function updateStaffSignature(staffId: string, signatureUrl: string) {
    startTransition(async () => {
      const result = await updateSchoolStaffSignatureAction({ staffId, signatureUrl });
      setMessage(result.message);
    });
  }

  function assignTeacher(classId: string, staffId: string) {
    startTransition(async () => {
      const result = await assignClassTeacherAction({ classId, staffId });
      setMessage(result.message);
    });
  }

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
      <div>
        <h2 className="text-lg font-semibold text-slate-50">User Management</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">Manage login users, manual teachers, signatures, and class teacher assignments for this school only.</p>
      </div>
      {message ? <p className={message.includes("updated") || message.includes("created") || message.includes("reactivated") ? "text-sm text-emerald-300" : "text-sm text-red-300"}>{message}</p> : null}
      {!canManage ? <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">Headmasters can view users. Only admins can manage staff and assignments.</p> : null}

      {canManage ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <form className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4" onSubmit={staffForm.handleSubmit(saveStaff)}>
            <h3 className="font-semibold text-slate-50">{editingStaff ? "Edit Teacher / Staff" : "Add Teacher / Staff"}</h3>
            <input type="hidden" {...staffForm.register("staffId")} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field error={staffForm.formState.errors.fullName?.message} label="Full name"><input className="input-dark" {...staffForm.register("fullName")} /></Field>
              <Field error={staffForm.formState.errors.role?.message} label="Role"><select className="input-dark" {...staffForm.register("role")}><option value="teacher">Teacher</option><option value="headmaster">Headmaster</option><option value="admin">Admin</option></select></Field>
              <Field error={staffForm.formState.errors.email?.message} label="Email"><input className="input-dark" type="email" {...staffForm.register("email")} /></Field>
              <Field error={staffForm.formState.errors.phone?.message} label="Phone"><input className="input-dark" {...staffForm.register("phone")} /></Field>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400" disabled={pending} type="submit">{pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}{editingStaff ? "Save staff" : "Add staff"}</Button>
              {editingStaff ? <Button className="border-white/10 bg-white/5 text-slate-100" type="button" variant="outline" onClick={() => { setEditingStaff(null); staffForm.reset({ staffId: "", fullName: "", email: "", phone: "", role: "teacher" }); }}>Cancel</Button> : null}
            </div>
          </form>

          <form className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4" onSubmit={inviteForm.handleSubmit(createInvite)}>
            <h3 className="font-semibold text-slate-50">Invite Login User</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field error={inviteForm.formState.errors.fullName?.message} label="Name"><input className="input-dark" {...inviteForm.register("fullName")} /></Field>
              <Field error={inviteForm.formState.errors.email?.message} label="Email"><input className="input-dark" type="email" {...inviteForm.register("email")} /></Field>
              <Field error={inviteForm.formState.errors.role?.message} label="Role"><select className="input-dark" {...inviteForm.register("role")}><option value="teacher">Teacher</option><option value="headmaster">Headmaster</option><option value="admin">Admin</option></select></Field>
            </div>
            <Button className="w-fit bg-orange-500 text-slate-950 hover:bg-orange-400" disabled={pending} type="submit">{pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}Create invite</Button>
          </form>
        </div>
      ) : null}

      {inviteUrl ? <CopyBox value={inviteUrl} /> : null}
      <ManualStaffTable canManage={canManage} pending={pending} schoolId={schoolId} staff={schoolStaff} onEdit={editStaff} onSignature={updateStaffSignature} onStatus={updateStaffStatus} />
      <ClassTeacherAssignments assignments={classAssignments} canManage={canManage} pending={pending} staff={assignableStaff} onAssign={assignTeacher} />
      <LoginUsersTable canManage={canManage} currentUserId={currentUserId} pending={pending} schoolId={schoolId} users={users} onRole={updateRole} onSignature={updateTeacherSignature} onStatus={updateStatus} />
      <PendingInvites canManage={canManage} invitations={invitations} pending={pending} onRevoke={(id) => startTransition(async () => setMessage((await revokeStaffInvitationAction(id)).message))} />
      <style jsx>{`
        .input-dark {
          height: 2.75rem;
          border-radius: 0.75rem;
          border: 1px solid rgb(255 255 255 / 0.1);
          background: rgb(2 6 23 / 0.7);
          padding: 0 0.75rem;
          color: rgb(241 245 249);
          outline: none;
        }
      `}</style>
    </section>
  );
}

function ManualStaffTable({ staff, canManage, pending, schoolId, onEdit, onStatus, onSignature }: { staff: SchoolStaff[]; canManage: boolean; pending: boolean; schoolId: string; onEdit: (staff: SchoolStaff) => void; onStatus: (staff: SchoolStaff, active: boolean) => void; onSignature: (staffId: string, url: string) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-100">Manual Teachers / Staff</div>
      <div className="divide-y divide-white/10">
        {staff.length === 0 ? <p className="px-4 py-5 text-sm text-slate-400">No manual teachers have been added yet.</p> : staff.map((item) => (
          <div className="grid gap-3 px-4 py-4 text-sm text-slate-200 lg:grid-cols-[1.2fr_1fr_0.7fr_0.7fr_0.8fr_1fr]" key={item.id}>
            <span className="font-medium text-slate-50">{item.full_name}</span><span>{item.email ?? item.phone ?? "No contact"}</span><span className="capitalize">{item.role}</span><span className={item.is_active ? "text-emerald-300" : "text-red-300"}>{item.is_active ? "Active" : "Inactive"}</span><span>{item.signature_url ? "Signature uploaded" : "No signature"}</span>
            <div className="flex flex-wrap gap-2"><Button className="border-white/10 bg-white/5 text-slate-100" disabled={!canManage} type="button" variant="outline" onClick={() => onEdit(item)}>Edit</Button><Button className="border-white/10 bg-white/5 text-slate-100" disabled={!canManage || pending} type="button" variant="outline" onClick={() => onStatus(item, !item.is_active)}>{item.is_active ? "Deactivate" : "Reactivate"}</Button></div>
            <div className="lg:col-span-6"><ImageUploadField bucket="signatures" disabled={!canManage || pending} fixedBaseName="signature" label={`Signature for ${item.full_name}`} pathPrefix={`teachers/${item.id}`} schoolId={schoolId} value={item.signature_url ?? ""} onChange={(url) => onSignature(item.id, url)} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassTeacherAssignments({ assignments, staff, canManage, pending, onAssign }: { assignments: SchoolClassAssignment[]; staff: SchoolStaff[]; canManage: boolean; pending: boolean; onAssign: (classId: string, staffId: string) => void }) {
  const names = new Map(staff.map((item) => [item.id, item.full_name]));
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-100">Class Teacher Assignment</div>
      <div className="divide-y divide-white/10">
        {assignments.map((item) => (
          <div className="grid gap-3 px-4 py-4 text-sm text-slate-200 md:grid-cols-[1fr_1.2fr_1fr]" key={item.id}>
            <span className="font-medium text-slate-50">{item.name} <span className="text-slate-500">({item.academicYear})</span></span>
            <span>{item.classTeacherStaffId ? names.get(item.classTeacherStaffId) ?? "Assigned teacher not active" : "No class teacher assigned"}</span>
            <select className="input-dark" disabled={!canManage || pending} value={item.classTeacherStaffId} onChange={(event) => onAssign(item.id, event.target.value)}>
              <option value="">No teacher</option>
              {staff.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoginUsersTable({ users, currentUserId, canManage, pending, schoolId, onRole, onStatus, onSignature }: { users: SchoolUser[]; currentUserId: string; canManage: boolean; pending: boolean; schoolId: string; onRole: (id: string, role: "admin" | "headmaster" | "teacher") => void; onStatus: (id: string, active: boolean) => void; onSignature: (id: string, url: string) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-100">Login Users</div>
      <div className="divide-y divide-white/10">
        {users.map((user) => (
          <div className="grid gap-3 px-4 py-4 text-sm text-slate-200 lg:grid-cols-[1.2fr_1.2fr_0.8fr_0.7fr_0.8fr_1fr]" key={user.id}>
            <span className="font-medium text-slate-50">{user.full_name}{user.id === currentUserId ? " (you)" : ""}</span><span>{user.email ?? "No email"}</span>
            <select className="input-dark" disabled={!canManage || pending} value={user.role} onChange={(event) => onRole(user.id, event.target.value as "admin" | "headmaster" | "teacher")}><option value="admin">Admin</option><option value="headmaster">Headmaster</option><option value="teacher">Teacher</option></select>
            <span className={user.is_active ? "text-emerald-300" : "text-red-300"}>{user.is_active ? "Active" : "Inactive"}</span><span>{getMetadataString(getMetadataObject(user.metadata), "teacher_signature_url") ? "Signature uploaded" : "No signature"}</span>
            <Button className="border-white/10 bg-white/5 text-slate-200" disabled={!canManage || pending || user.id === currentUserId} type="button" variant="outline" onClick={() => onStatus(user.id, !user.is_active)}>{user.is_active ? "Deactivate" : "Reactivate"}</Button>
            {user.role === "teacher" ? <div className="lg:col-span-6"><ImageUploadField bucket="signatures" disabled={!canManage || pending} fixedBaseName="signature" label={`Teacher signature for ${user.full_name}`} pathPrefix={`teachers/${user.id}`} schoolId={schoolId} value={getMetadataString(getMetadataObject(user.metadata), "teacher_signature_url")} onChange={(url) => onSignature(user.id, url)} /></div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function PendingInvites({ invitations, canManage, pending, onRevoke }: { invitations: SchoolInvitation[]; canManage: boolean; pending: boolean; onRevoke: (id: string) => void }) {
  function copyInviteToken(token: string) { void navigator.clipboard?.writeText(`${window.location.origin}/accept-invite/${token}`); }
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10"><div className="bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-100">Pending Invites</div><div className="divide-y divide-white/10">{invitations.length === 0 ? <p className="px-4 py-5 text-sm text-slate-400">No invitations have been created yet.</p> : invitations.map((invitation) => <div className="grid gap-3 px-4 py-4 text-sm text-slate-200 lg:grid-cols-[1fr_1.2fr_0.7fr_0.7fr_0.8fr_1fr]" key={invitation.id}><span className="font-medium text-slate-50">{invitation.full_name ?? "Invited staff"}</span><span>{invitation.email}</span><span className="capitalize">{invitation.role}</span><span className="capitalize">{invitation.status}</span><span>{invitation.expires_at ? new Date(invitation.expires_at).toLocaleDateString() : "No expiry"}</span><div className="flex flex-wrap gap-2"><Button className="border-white/10 bg-white/5 text-slate-200" disabled={!canManage} type="button" variant="outline" onClick={() => copyInviteToken(invitation.token)}><Copy className="size-4" />Copy</Button>{invitation.status === "pending" ? <Button className="border-red-300/20 bg-red-500/10 text-red-100" disabled={!canManage || pending} type="button" variant="outline" onClick={() => onRevoke(invitation.id)}>Revoke</Button> : null}</div></div>)}</div></div>
  );
}

function CopyBox({ value }: { value: string }) {
  return <div className="flex flex-col gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-100 sm:flex-row sm:items-center sm:justify-between"><span className="break-all">{value}</span><Button className="border-emerald-300/20 bg-emerald-400/10 text-emerald-100" type="button" variant="outline" onClick={() => navigator.clipboard?.writeText(value)}><Copy className="size-4" />Copy</Button></div>;
}

function Field({ children, error, label }: { children: React.ReactNode; error?: string; label: string }) {
  return <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}{children}{error ? <span className="normal-case tracking-normal text-red-300">{error}</span> : null}</label>;
}
