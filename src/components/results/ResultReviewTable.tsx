"use client";

import { useMemo, useState } from "react";

import { ResultStatusBadge } from "@/components/results/ResultStatusBadge";
import { ScoreEditDialog } from "@/components/results/ScoreEditDialog";
import type { ResultReviewRow } from "@/lib/results/result-types";

type ResultReviewTableProps = {
  rows: ResultReviewRow[];
  canEdit: boolean;
};

export function ResultReviewTable({ canEdit, rows }: ResultReviewTableProps) {
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");
  const [grade, setGrade] = useState("all");
  const [editedOnly, setEditedOnly] = useState(false);
  const [publishedOnly, setPublishedOnly] = useState(false);
  const subjects = useMemo(() => Array.from(new Set(rows.map((row) => row.subjectName))).sort(), [rows]);
  const grades = useMemo(() => Array.from(new Set(rows.map((row) => row.grade))).sort(), [rows]);
  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const matchesSearch = [row.studentCode, row.studentName, row.admissionNumber ?? "", row.subjectName]
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
              {["Student Code", "Student Name", "Admission", "Subject", "CA", "Exam", "Total", "Grade", "Remark", "Status", "Edited", "Actions"].map((header) => (
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
                <td className="px-3 py-3">{row.admissionNumber ?? "N/A"}</td>
                <td className="px-3 py-3">{row.subjectName}</td>
                <td className="px-3 py-3">{row.continuousAssessment}</td>
                <td className="px-3 py-3">{row.examScore}</td>
                <td className="px-3 py-3">{row.totalScore}</td>
                <td className="px-3 py-3">{row.grade}</td>
                <td className="max-w-56 px-3 py-3">{row.remark ?? "-"}</td>
                <td className="px-3 py-3">
                  <ResultStatusBadge status={row.isPublished ? "published" : "validated"}>{row.isPublished ? "Published" : "Unpublished"}</ResultStatusBadge>
                </td>
                <td className="px-3 py-3">
                  {row.editedAfterPublish ? <ResultStatusBadge status="edited-after-publish" /> : row.editCount > 0 ? <ResultStatusBadge status="edited" /> : "-"}
                </td>
                <td className="px-3 py-3">
                  <ScoreEditDialog disabled={!canEdit} onMessage={setMessage} result={row} />
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
              <p>Admission: {row.admissionNumber ?? "N/A"}</p>
            </div>
            {row.editedAfterPublish ? <div className="mt-3"><ResultStatusBadge status="edited-after-publish" /></div> : null}
            <div className="mt-4">
              <ScoreEditDialog disabled={!canEdit} onMessage={setMessage} result={row} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
