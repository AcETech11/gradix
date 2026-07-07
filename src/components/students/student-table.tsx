/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowRight, PencilLine, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatStudentName, getStudentInitials } from "@/lib/students/utils";
import type { StudentListItem } from "@/types/students";

import { StudentStatusBadge } from "./student-status-badge";

type StudentTableProps = {
  students: StudentListItem[];
  canManage: boolean;
};

export function StudentTable({ students, canManage }: StudentTableProps) {
  if (!students.length) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)]">
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Student Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {students.map((student) => {
              const fullName = formatStudentName(student);

              return (
                <tr className="text-sm text-slate-200" key={student.id}>
                  <td className="px-4 py-4">
                    <div className="flex size-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      {student.passport_url ? (
                        <img alt={fullName} className="size-full object-cover" src={student.passport_url} />
                      ) : (
                        <span className="text-xs font-semibold text-orange-200">{getStudentInitials(fullName)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 font-medium text-orange-200">{student.student_code}</td>
                  <td className="px-4 py-4">
                    <div>
                      <Link className="font-medium text-slate-50 hover:text-orange-200" href={`/dashboard/students/${student.id}`}>
                        {fullName}
                      </Link>
                      <p className="text-xs text-slate-400">{student.student_code}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-slate-50">{student.class_name ?? "Unassigned"}</p>
                      <p className="text-xs text-slate-400">{student.class_level ?? "No class"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StudentStatusBadge status={student.status} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Button asChild className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" size="sm" type="button" variant="outline">
                        <Link href={`/dashboard/students/${student.id}`}>
                          <UserRound className="size-4" />
                          View
                        </Link>
                      </Button>
                      {canManage ? (
                        <Button asChild className="bg-orange-500 text-slate-950 hover:bg-orange-400" size="sm" type="button">
                          <Link href={`/dashboard/students/${student.id}/edit`}>
                            <PencilLine className="size-4" />
                            Edit
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 lg:hidden">
        {students.map((student) => {
          const fullName = formatStudentName(student);

          return (
            <article className="rounded-2xl border border-white/10 bg-white/5 p-4" key={student.id}>
              <div className="flex items-start gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40">
                  {student.passport_url ? (
                    <img alt={fullName} className="size-full object-cover" src={student.passport_url} />
                  ) : (
                    <span className="text-xs font-semibold text-orange-200">{getStudentInitials(fullName)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link className="font-medium text-slate-50 hover:text-orange-200" href={`/dashboard/students/${student.id}`}>
                        {fullName}
                      </Link>
                      <p className="text-xs text-slate-400">{student.student_code}</p>
                    </div>
                    <StudentStatusBadge status={student.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Class</p>
                      <p className="mt-1 text-slate-100">{student.class_name ?? "Unassigned"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" size="sm" type="button" variant="outline">
                  <Link href={`/dashboard/students/${student.id}`}>
                    View
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                {canManage ? (
                  <Button asChild className="bg-orange-500 text-slate-950 hover:bg-orange-400" size="sm" type="button">
                    <Link href={`/dashboard/students/${student.id}/edit`}>
                      Edit
                      <PencilLine className="size-4" />
                    </Link>
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
