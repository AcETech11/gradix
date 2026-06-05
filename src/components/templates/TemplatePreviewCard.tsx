import { AlertTriangle, BookOpenCheck, UsersRound } from "lucide-react";

import type { TemplateClassOption } from "@/lib/templates/template-types";

type TemplatePreviewCardProps = {
  selectedClass?: TemplateClassOption;
};

export function TemplatePreviewCard({ selectedClass }: TemplatePreviewCardProps) {
  if (!selectedClass) {
    return (
      <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-300">
        Select a class to preview the number of students and assigned subjects that will shape the Excel template.
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300/80">Template Preview</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-50">{selectedClass.name}</h2>
        <p className="mt-1 text-sm text-slate-400">Academic year: {selectedClass.academicYear}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <BookOpenCheck className="size-5 text-orange-200" />
          <p className="mt-3 text-2xl font-semibold text-slate-50">{selectedClass.subjectCount}</p>
          <p className="text-sm text-slate-400">assigned subjects</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <UsersRound className="size-5 text-orange-200" />
          <p className="mt-3 text-2xl font-semibold text-slate-50">{selectedClass.studentCount}</p>
          <p className="text-sm text-slate-400">students to prefill</p>
        </div>
      </div>

      {selectedClass.subjectNames.length > 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-slate-200">Subjects in this template</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedClass.subjectNames.map((subjectName) => (
              <span
                className="rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-100"
                key={subjectName}
              >
                {subjectName}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-medium text-slate-200">Template columns</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Student Code, Student Name, Admission Number, Class, then CA (0-40), Exam (0-60), and Remark for each assigned subject.
        </p>
      </div>

      {selectedClass.subjectCount === 0 ? (
        <WarningText message="This class has no subjects assigned. Assign subjects before downloading a result template." />
      ) : null}
      {selectedClass.studentCount === 0 ? (
        <WarningText message="No students found in this class. Add students first or download a blank sample template." />
      ) : null}
    </section>
  );
}

function WarningText({ message }: { message: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-orange-300/20 bg-orange-500/10 p-3 text-sm leading-6 text-orange-100">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
