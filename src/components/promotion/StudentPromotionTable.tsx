"use client";

import { useMemo, useState, useTransition } from "react";
import { Archive, CheckSquare, GraduationCap, Repeat2, Send, UserMinus, type LucideIcon } from "lucide-react";

import { promoteStudentsAction, updatePromotionStudentStatusAction } from "@/actions/promotion/promote-students-action";
import { StudentStatusBadge } from "@/components/promotion/StudentStatusBadge";
import { Button } from "@/components/ui/button";
import type { PromotionClassOption, PromotionStudent } from "@/lib/promotion/promotion-types";
import type { StudentStatus } from "@/types/database";

type StudentPromotionTableProps = {
  students: PromotionStudent[];
  classes: PromotionClassOption[];
  selected: {
    fromAcademicYear: string;
    toAcademicYear: string;
    fromClassId: string;
    toClassId: string;
  };
};

type PendingAction =
  | { type: "promote" }
  | { type: "status"; status: Extract<StudentStatus, "repeated" | "graduated" | "transferred" | "withdrawn" | "archived"> };

export function StudentPromotionTable({ classes, selected, students }: StudentPromotionTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectedCount = selectedIds.length;
  const fromClass = classes.find((schoolClass) => schoolClass.id === selected.fromClassId);
  const toClass = classes.find((schoolClass) => schoolClass.id === selected.toClassId);
  const allSelected = students.length > 0 && selectedIds.length === students.length;
  const selectedStudents = useMemo(() => students.filter((student) => selectedIds.includes(student.id)), [selectedIds, students]);

  function toggleAll() {
    setSelectedIds(allSelected ? [] : students.map((student) => student.id));
  }

  function toggleStudent(studentId: string) {
    setSelectedIds((current) => current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId]);
  }

  function runAction() {
    if (!pendingAction || selectedIds.length === 0) return;

    startTransition(async () => {
      const result =
        pendingAction.type === "promote"
          ? await promoteStudentsAction({
              ...selected,
              studentIds: selectedIds,
            })
          : await updatePromotionStudentStatusAction({
              academicYear: selected.fromAcademicYear,
              classId: selected.fromClassId,
              studentIds: selectedIds,
              status: pendingAction.status,
            });

      setMessage(result.message);
      if (result.ok) {
        setSelectedIds([]);
        setPendingAction(null);
      }
    });
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Promote students</h2>
          <p className="text-sm leading-6 text-slate-400">Select students and confirm the action. Historical result rows are never modified.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" disabled={!students.length} type="button" variant="outline" onClick={toggleAll}>
            <CheckSquare className="size-4" />
            {allSelected ? "Clear" : "Select all"}
          </Button>
          <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400" disabled={!selectedCount || !selected.toClassId} type="button" onClick={() => setPendingAction({ type: "promote" })}>
            <Send className="size-4" />
            Promote
          </Button>
        </div>
      </div>

      {message ? <p className={message.includes("could not") || message.includes("Check") ? "mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200" : "mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"}>{message}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusAction icon={Repeat2} label="Mark Repeated" disabled={!selectedCount} onClick={() => setPendingAction({ type: "status", status: "repeated" })} />
        <StatusAction icon={GraduationCap} label="Graduate" disabled={!selectedCount} onClick={() => setPendingAction({ type: "status", status: "graduated" })} />
        <StatusAction icon={UserMinus} label="Transferred" disabled={!selectedCount} onClick={() => setPendingAction({ type: "status", status: "transferred" })} />
        <StatusAction icon={UserMinus} label="Withdrawn" disabled={!selectedCount} onClick={() => setPendingAction({ type: "status", status: "withdrawn" })} />
        <StatusAction icon={Archive} label="Archive" disabled={!selectedCount} onClick={() => setPendingAction({ type: "status", status: "archived" })} />
      </div>

      <div className="mt-4 hidden overflow-x-auto lg:block">
        <table className="min-w-[58rem] w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-slate-400">
            <tr className="border-b border-white/10">
              {["", "Student", "Current Class", "Status", "Target Warning"].map((header) => (
                <th className="px-3 py-3 font-semibold" key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr className="border-b border-white/5 text-slate-200 last:border-0" key={student.id}>
                <td className="px-3 py-3">
                  <input checked={selectedIds.includes(student.id)} className="size-4" type="checkbox" onChange={() => toggleStudent(student.id)} />
                </td>
                <td className="px-3 py-3">
                  <p className="font-semibold text-slate-50">{student.name}</p>
                  <p className="font-mono text-xs text-slate-400">{student.studentCode}</p>
                </td>
                <td className="px-3 py-3">{student.className}</td>
                <td className="px-3 py-3"><StudentStatusBadge status={student.status} /></td>
                <td className="px-3 py-3">{student.hasTargetEnrollment ? <span className="text-amber-200">Already enrolled in target year</span> : <span className="text-slate-400">Ready</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 lg:hidden">
        {students.map((student) => (
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4" key={student.id}>
            <div className="flex items-start justify-between gap-3">
              <label className="flex min-w-0 items-start gap-3">
                <input checked={selectedIds.includes(student.id)} className="mt-1 size-4" type="checkbox" onChange={() => toggleStudent(student.id)} />
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-50">{student.name}</span>
                  <span className="mt-1 block font-mono text-xs text-slate-400">{student.studentCode}</span>
                </span>
              </label>
              <StudentStatusBadge status={student.status} />
            </div>
            <div className="mt-3 grid gap-2 text-sm text-slate-300">
              <p>Class: {student.className}</p>
              {student.hasTargetEnrollment ? <p className="text-amber-200">Already enrolled in target year.</p> : null}
            </div>
          </article>
        ))}
      </div>

      {students.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-50">No active students found</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">Select a class with active or repeated students to begin promotion.</p>
        </div>
      ) : null}

      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/80 p-3 backdrop-blur sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-50">
              {pendingAction.type === "promote" ? "Promote selected students?" : pendingAction.status === "graduated" ? "Mark selected students as graduated?" : `Mark selected as ${pendingAction.status}?`}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {pendingAction.type === "promote"
                ? `You are about to move ${selectedCount} students from ${fromClass?.name ?? "the selected class"} to ${toClass?.name ?? "the target class"} for ${selected.toAcademicYear}. Historical results will not be changed.`
                : `This will update ${selectedCount} students. Historical results will remain available and unchanged.`}
            </p>
            {selectedStudents.some((student) => student.hasTargetEnrollment) ? (
              <p className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">Some selected students already have target-year enrollment and will be skipped during promotion.</p>
            ) : null}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button className="border-white/10 bg-white/5 text-slate-100" disabled={isPending} type="button" variant="outline" onClick={() => setPendingAction(null)}>Cancel</Button>
              <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400" disabled={isPending} type="button" onClick={runAction}>{isPending ? "Saving..." : "Confirm"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function StatusAction({ disabled, icon: Icon, label, onClick }: { disabled: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <Button className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" disabled={disabled} type="button" variant="outline" onClick={onClick}>
      <Icon className="size-4" />
      {label}
    </Button>
  );
}
