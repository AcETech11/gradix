"use client";

import { useMemo, useState } from "react";

import { ClassTeacherCommentDialog } from "@/components/results/ClassTeacherCommentDialog";
import { ParentResultShareActions } from "@/components/results/ParentResultShareActions";
import { ReportDetailsDialog } from "@/components/results/ReportDetailsDialog";
import { ResultStatusBadge } from "@/components/results/ResultStatusBadge";
import { ScoreEditDialog } from "@/components/results/ScoreEditDialog";
import { buildParentShareMessage, buildSchoolPortalLink, buildStudentResultLink } from "@/lib/parent-portal/public-result-links";
import type { ResultReviewRow } from "@/lib/results/result-types";

type ResultReviewTableProps = {
  rows: ResultReviewRow[];
  canEdit: boolean;
  uploadId: string;
  schoolOpenDays: number | null;
  canEditReportDetails: boolean;
  schoolName: string;
  schoolSlug: string | null;
  className: string;
  term: string;
  academicYear: string;
};

function formatRatings(ratings: Record<string, number | undefined>) {
  const entries = Object.entries(ratings).filter(([, rating]) => rating !== undefined);

  return entries.length ? entries.map(([trait, rating]) => `${trait}: ${rating}`).join("; ") : "";
}

export function ResultReviewTable({ academicYear, canEdit, canEditReportDetails, className, rows, schoolName, schoolSlug, term, uploadId, schoolOpenDays }: ResultReviewTableProps) {
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");
  const [grade, setGrade] = useState("all");
  const [editedOnly, setEditedOnly] = useState(false);
  const [publishedOnly, setPublishedOnly] = useState(false);
  const subjects = useMemo(() => Array.from(new Set(rows.map((row) => row.subjectName))).sort(), [rows]);
  const grades = useMemo(() => Array.from(new Set(rows.map((row) => row.grade))).sort(), [rows]);
  const shareActionRowIds = useMemo(() => {
    const seenStudents = new Set<string>();
    const rowIds = new Set<string>();

    rows.forEach((row) => {
      if (!row.isPublished || seenStudents.has(row.studentId)) return;
      seenStudents.add(row.studentId);
      rowIds.add(row.id);
    });

    return rowIds;
  }, [rows]);
  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const matchesSearch = [row.studentCode, row.studentName, row.subjectName]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesSubject = subject === "all" || row.subjectName === subject;
        const matchesGrade = grade === "all" || row.grade === grade;
        const matchesEdited = !editedOnly || row.editCount > 0;
        const matchesPublished = !publishedOnly || row.isPublished;

        return matchesSearch && matchesSubject && matchesGrade && matchesEdited && matchesPublished;
      }),
    [editedOnly, grade, publishedOnly, rows, search, subject],
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Review result rows</h2>
          <p className="text-sm text-slate-400">Inspect normalized scores before official publishing.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:flex">
          <input
            className="h-10 rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-50 outline-none focus:border-orange-300"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student"
            value={search}
          />
          <select className="h-10 rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-50" onChange={(event) => setSubject(event.target.value)} value={subject}>
            <option value="all">All subjects</option>
            {subjects.map((subjectName) => (
              <option key={subjectName} value={subjectName}>
                {subjectName}
              </option>
            ))}
          </select>
          <select className="h-10 rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-50" onChange={(event) => setGrade(event.target.value)} value={grade}>
            <option value="all">All grades</option>
            {grades.map((gradeValue) => (
              <option key={gradeValue} value={gradeValue}>
                {gradeValue}
              </option>
            ))}
          </select>
          <label className="flex h-10 items-center gap-2 rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-200">
            <input checked={editedOnly} onChange={(event) => setEditedOnly(event.target.checked)} type="checkbox" />
            Edited
          </label>
          <label className="flex h-10 items-center gap-2 rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-200">
            <input checked={publishedOnly} onChange={(event) => setPublishedOnly(event.target.checked)} type="checkbox" />
            Published
          </label>
        </div>
      </div>

      {message ? <div className="mt-4 rounded-xl border border-orange-300/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">{message}</div> : null}

      <div className="mt-4 hidden overflow-x-auto lg:block">
        <table className="min-w-[82rem] w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-slate-400">
            <tr className="border-b border-white/10">
              {["Student Code", "Student Name", "Subject", "CA", "Exam", "Total", "Grade", "Remark", "Attendance", "Domains", "Teacher Comment", "Parent Views", "Status", "Edited", "Actions"].map((header) => (
                <th className="px-3 py-3 font-medium" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr className="border-b border-white/5 text-slate-200" key={row.id}>
                <td className="px-3 py-3 font-mono text-xs">{row.studentCode}</td>
                <td className="px-3 py-3">{row.studentName}</td>
                <td className="px-3 py-3">{row.subjectName}</td>
                <td className="px-3 py-3">{row.continuousAssessment}</td>
                <td className="px-3 py-3">{row.examScore}</td>
                <td className="px-3 py-3">{row.totalScore}</td>
                <td className="px-3 py-3">{row.grade}</td>
                <td className="max-w-56 px-3 py-3">{row.remark ?? "-"}</td>
                <td className="px-3 py-3">
                  {row.attendancePresent !== null || row.attendanceAbsent !== null ? `${row.attendancePresent ?? "-"} / ${row.attendanceAbsent ?? "-"}` : "-"}
                </td>
                <td className="max-w-72 px-3 py-3 text-xs leading-5">
                  {[formatRatings(row.affectiveDomain), formatRatings(row.psychomotorDomain)].filter(Boolean).join(" | ") || "-"}
                </td>
                <td className="max-w-64 px-3 py-3">{row.classTeacherComment ?? "-"}</td>
                <td className="px-3 py-3 text-xs text-slate-300">{formatParentViews(row)}</td>
                <td className="px-3 py-3">
                  <ResultStatusBadge status={row.isPublished ? "published" : "validated"}>{row.isPublished ? "Published" : "Unpublished"}</ResultStatusBadge>
                </td>
                <td className="px-3 py-3">
                  {row.editedAfterPublish ? <ResultStatusBadge status="edited-after-publish" /> : row.editCount > 0 ? <ResultStatusBadge status="edited" /> : "-"}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <ScoreEditDialog disabled={!canEdit} onMessage={setMessage} result={row} />
                    <ClassTeacherCommentDialog disabled={!canEdit} onMessage={setMessage} result={row} uploadId={uploadId} />
                    <ReportDetailsDialog disabled={!canEditReportDetails} onMessage={setMessage} result={row} schoolOpenDays={schoolOpenDays} uploadId={uploadId} />
                    {row.isPublished && schoolSlug && shareActionRowIds.has(row.id) ? (
                      <ParentResultShareActions
                        directResultLink={buildStudentResultLink({ schoolSlug, studentCode: row.studentCode })}
                        parentMessage={buildParentShareMessage({
                          schoolName,
                          studentName: row.studentName,
                          studentCode: row.studentCode,
                          className,
                          term,
                          academicYear,
                          schoolPortalLink: buildSchoolPortalLink({ schoolSlug }),
                          directResultLink: buildStudentResultLink({ schoolSlug, studentCode: row.studentCode }),
                        })}
                        shareTitle={`${schoolName} Student Result`}
                        studentCode={row.studentCode}
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 lg:hidden">
        {filteredRows.map((row) => (
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4" key={row.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-50">{row.studentName}</p>
                <p className="mt-1 font-mono text-xs text-slate-400">{row.studentCode}</p>
              </div>
              <ResultStatusBadge status={row.isPublished ? "published" : "validated"}>{row.isPublished ? "Published" : "Unpublished"}</ResultStatusBadge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
              <p>Subject: {row.subjectName}</p>
              <p>Grade: {row.grade}</p>
              <p>CA: {row.continuousAssessment}</p>
              <p>Exam: {row.examScore}</p>
              <p>Total: {row.totalScore}</p>
              <p className="col-span-2">Teacher comment: {row.classTeacherComment ?? "-"}</p>
              <p className="col-span-2">Attendance: {row.attendancePresent ?? "-"} present / {row.attendanceAbsent ?? "-"} absent</p>
              <p className="col-span-2">Domains: {[formatRatings(row.affectiveDomain), formatRatings(row.psychomotorDomain)].filter(Boolean).join(" | ") || "-"}</p>
              <p className="col-span-2">Parent Views: {formatParentViews(row)}</p>
            </div>
            {row.editedAfterPublish ? <div className="mt-3"><ResultStatusBadge status="edited-after-publish" /></div> : null}
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                <ScoreEditDialog disabled={!canEdit} onMessage={setMessage} result={row} />
                <ClassTeacherCommentDialog disabled={!canEdit} onMessage={setMessage} result={row} uploadId={uploadId} />
                <ReportDetailsDialog disabled={!canEditReportDetails} onMessage={setMessage} result={row} schoolOpenDays={schoolOpenDays} uploadId={uploadId} />
                {row.isPublished && schoolSlug && shareActionRowIds.has(row.id) ? (
                  <ParentResultShareActions
                    directResultLink={buildStudentResultLink({ schoolSlug, studentCode: row.studentCode })}
                    parentMessage={buildParentShareMessage({
                      schoolName,
                      studentName: row.studentName,
                      studentCode: row.studentCode,
                      className,
                      term,
                      academicYear,
                      schoolPortalLink: buildSchoolPortalLink({ schoolSlug }),
                      directResultLink: buildStudentResultLink({ schoolSlug, studentCode: row.studentCode }),
                    })}
                    shareTitle={`${schoolName} Student Result`}
                    studentCode={row.studentCode}
                  />
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatParentViews(row: ResultReviewRow) {
  if (!row.isPublished) return "Not published";
  if (row.parentAccessUseCount === null && row.parentAccessMaxUses === null) return "Parent Views: 0 / 10";
  if (row.parentAccessMaxUses === null) return "Parent Views: Unlimited";

  return `Parent Views: ${row.parentAccessUseCount ?? 0} / ${row.parentAccessMaxUses}`;
}
