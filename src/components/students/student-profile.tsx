/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowLeft, CalendarDays, Edit3, Mail, Phone, School, UserRound, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatStudentName } from "@/lib/students/utils";
import type { StudentListItem } from "@/types/students";

import { StudentArchiveButton } from "./student-archive-button";
import { StudentStatusBadge } from "./student-status-badge";

type StudentProfileProps = {
  student: StudentListItem;
  canManage: boolean;
};

function InfoCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-200">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</p>
          <p className="mt-1 text-sm font-medium text-slate-50">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function StudentProfileView({ student, canManage }: StudentProfileProps) {
  const fullName = formatStudentName(student);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_20px_45px_-24px_rgba(2,6,23,0.8)] lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            {student.passport_url ? (
              <img alt={fullName} className="size-full object-cover" src={student.passport_url} />
            ) : (
              <span className="text-lg font-semibold text-orange-200">{fullName.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300/80">Student Profile</p>
              <StudentStatusBadge status={student.status} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">{fullName}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Code: {student.student_code}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                Admission: {student.admission_number ?? "Not set"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" type="button" variant="outline">
            <Link href="/dashboard/students">
              <ArrowLeft className="size-4" />
              Back to students
            </Link>
          </Button>
          {canManage ? (
            <Button asChild className="bg-orange-500 text-slate-950 hover:bg-orange-400" type="button">
              <Link href={`/dashboard/students/${student.id}/edit`}>
                <Edit3 className="size-4" />
                Edit student
              </Link>
            </Button>
          ) : null}
          {canManage && student.status !== "archived" ? <StudentArchiveButton studentId={student.id} /> : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold text-slate-50">Student Information</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard icon={UserRound} title="Full name" value={fullName} />
            <InfoCard icon={School} title="Class" value={student.class_name ?? "Unassigned"} />
            <InfoCard icon={CalendarDays} title="Date of birth" value={student.date_of_birth ?? "Not set"} />
            <InfoCard icon={UserRound} title="Gender" value={student.gender ?? "Not set"} />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold text-slate-50">Parent Information</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard icon={UserRound} title="Parent name" value={student.parent_name ?? "Not set"} />
            <InfoCard icon={Phone} title="Parent phone" value={student.parent_phone ?? "Not set"} />
            <InfoCard icon={Mail} title="Parent email" value={student.parent_email ?? "Not set"} />
            <InfoCard icon={UserRound} title="Relationship" value={student.parent_relationship ?? "Not set"} />
          </div>
        </section>
      </div>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold text-slate-50">Academic Information</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCard icon={School} title="Enrolled date" value={student.enrolled_at ?? "Not set"} />
          <InfoCard icon={School} title="Class name" value={student.class_name ?? "Unassigned"} />
          <InfoCard icon={School} title="Class level" value={student.class_level ?? "Not set"} />
          <InfoCard icon={UserRound} title="Status" value={student.status} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold text-slate-50">Profile Photo</h2>
          <div className="mt-4 flex min-h-80 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            {student.passport_url ? (
              <img alt={fullName} className="h-full w-full object-cover" src={student.passport_url} />
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex size-16 items-center justify-center rounded-3xl border border-orange-400/20 bg-orange-500/10 text-orange-200">
                  <UserRound className="size-7" />
                </div>
                <p className="text-sm text-slate-400">No passport photo uploaded yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-slate-50">Permanent Student Code</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {student.student_code} is the permanent code parents will use later for result access and portal verification.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-slate-50">Notes</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Student records are ready for future result uploads, report cards, and parent access workflows.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
