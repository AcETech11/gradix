"use server";

import * as XLSX from "xlsx";

import { requireCanManageResultOperations } from "@/lib/auth/authorization";
import { buildParentShareMessage, buildSchoolPortalLink, buildStudentResultLink } from "@/lib/parent-portal/public-result-links";
import { calculateOverallPositions, calculateSubjectPositions, formatPosition } from "@/lib/results/calculate-positions";
import { getPerformanceBand } from "@/lib/results/performance-scale";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/types/auth";

function cleanFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function loadUploadDataset(uploadId: string) {
  const profile = await requireCanManageResultOperations();
  const supabase = await createClient();
  const { data: upload, error: uploadError } = await supabase
    .from("result_uploads")
    .select("*")
    .eq("id", uploadId)
    .eq("school_id", profile.school_id)
    .maybeSingle();

  if (uploadError || !upload) throw new Error(uploadError?.message ?? "Result upload was not found.");

  const { data: results, error: resultsError } = await supabase
    .from("results")
    .select("id, student_id, subject_id, continuous_assessment, exam_score, total_score, grade, remark, is_published, published_at")
    .eq("school_id", profile.school_id)
    .eq("class_id", upload.class_id)
    .eq("term", upload.term)
    .eq("academic_year", upload.academic_year);

  if (resultsError) throw resultsError;

  // Filter out placeholder/not offered subjects where both CA and Exam scores are zero
  const realResults = (results ?? []).filter(
    (row) => !(Number(row.continuous_assessment ?? 0) === 0 && Number(row.exam_score ?? 0) === 0)
  );

  const studentIds = Array.from(new Set(realResults.map((row) => row.student_id)));
  const subjectIds = Array.from(new Set(realResults.map((row) => row.subject_id)));
  const [studentsResult, subjectsResult, commentsResult] = await Promise.all([
    studentIds.length
      ? supabase.from("students").select("id, permanent_code, first_name, middle_name, last_name").eq("school_id", profile.school_id).in("id", studentIds)
      : Promise.resolve({ data: [], error: null }),
    subjectIds.length
      ? supabase.from("subjects").select("id, name").eq("school_id", profile.school_id).in("id", subjectIds)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length
      ? supabase
          .from("student_term_reports")
          .select("student_id, class_teacher_comment")
          .eq("school_id", profile.school_id)
          .eq("class_id", upload.class_id)
          .eq("term", upload.term)
          .eq("academic_year", upload.academic_year)
          .in("student_id", studentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (studentsResult.error || subjectsResult.error || commentsResult.error) {
    throw studentsResult.error ?? subjectsResult.error ?? commentsResult.error;
  }

  const students = new Map((studentsResult.data ?? []).map((student) => [student.id, student]));
  const subjects = new Map((subjectsResult.data ?? []).map((subject) => [subject.id, subject]));
  const comments = new Map((commentsResult.data ?? []).map((row) => [row.student_id, row.class_teacher_comment ?? ""]));
  const studentTotals = new Map<string, { total: number; count: number }>();

  realResults.forEach((row) => {
    const current = studentTotals.get(row.student_id) ?? { total: 0, count: 0 };
    studentTotals.set(row.student_id, { total: current.total + Number(row.total_score ?? 0), count: current.count + 1 });
  });

  const subjectPositions = calculateSubjectPositions(realResults.map((row) => ({ studentId: row.student_id, subjectId: row.subject_id, totalScore: Number(row.total_score ?? 0) })));
  const overallPositions = calculateOverallPositions(
    Array.from(studentTotals.entries()).map(([studentId, summary]) => ({
      studentId,
      totalScore: summary.total,
      averageScore: summary.count ? summary.total / summary.count : 0,
    })),
  );

  return { upload, results: realResults, students, subjects, comments, studentTotals, subjectPositions, overallPositions };
}

async function loadPublishedSharingDataset(uploadId: string) {
  const profile = await requireCanManageResultOperations();
  const supabase = await createClient();
  const { data: upload, error: uploadError } = await supabase
    .from("result_uploads")
    .select("*")
    .eq("id", uploadId)
    .eq("school_id", profile.school_id)
    .eq("status", "published")
    .maybeSingle();

  if (uploadError || !upload) throw new Error(uploadError?.message ?? "Published result upload was not found.");

  const { data: school, error: schoolError } = await supabase.from("schools").select("name, slug").eq("id", profile.school_id).maybeSingle();

  if (schoolError || !school) throw new Error(schoolError?.message ?? "School profile was not found.");
  if (!school.slug) throw new Error("Your school does not have a valid portal slug yet.");

  const { data: results, error: resultsError } = await supabase
    .from("results")
    .select("student_id")
    .eq("school_id", profile.school_id)
    .eq("upload_id", upload.id)
    .eq("is_published", true);

  if (resultsError) throw resultsError;

  const studentIds = Array.from(new Set((results ?? []).map((row) => row.student_id)));
  const { data: students, error: studentsError } = studentIds.length
    ? await supabase
        .from("students")
        .select("id, permanent_code, first_name, middle_name, last_name")
        .eq("school_id", profile.school_id)
        .in("id", studentIds)
    : { data: [], error: null };

  if (studentsError) throw studentsError;

  return { profile, upload, school, students: students ?? [] };
}

export async function exportResultsAction(uploadId: string): Promise<AuthActionState<{ fileName: string; base64: string }>> {
  try {
    const data = await loadUploadDataset(uploadId);
    const rows = data.results.map((result) => {
      const student = data.students.get(result.student_id);
      const summary = data.studentTotals.get(result.student_id) ?? { total: 0, count: 0 };

      return {
        "Student Code": student?.permanent_code ?? "",
        "Student Name": student ? [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ") : "",
        Class: data.upload.class_name,
        "Academic Year": data.upload.academic_year,
        Term: data.upload.term,
        Subject: data.subjects.get(result.subject_id)?.name ?? "",
        "CA Score": result.continuous_assessment,
        "Exam Score": result.exam_score,
        "Total Score": result.total_score,
        Grade: result.grade,
        Remark: result.remark ?? "",
        "Subject Position": formatPosition(data.subjectPositions.get(`${result.student_id}:${result.subject_id}`)),
        "Overall Position": formatPosition(data.overallPositions.get(result.student_id)),
        Status: result.is_published ? "Published" : "Draft",
        "Published Date": result.published_at ? new Date(result.published_at).toLocaleDateString() : data.upload.published_at ? new Date(data.upload.published_at).toLocaleDateString() : "",
        "Average Score": summary.count ? (summary.total / summary.count).toFixed(2) : "0.00",
      };
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Results");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;

    return { ok: true, message: "Results exported.", data: { fileName: `gradix-results-${cleanFilePart(data.upload.class_name)}-${data.upload.term}-${cleanFilePart(data.upload.academic_year)}.xlsx`, base64: buffer.toString("base64") } };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Results could not be exported." };
  }
}

export async function exportBroadsheetAction(uploadId: string): Promise<AuthActionState<{ fileName: string; base64: string }>> {
  try {
    const data = await loadUploadDataset(uploadId);
    const subjects = Array.from(data.subjects.values()).sort((a, b) => a.name.localeCompare(b.name));
    const studentIds = Array.from(data.studentTotals.keys());
    const resultByStudentSubject = new Map(data.results.map((row) => [`${row.student_id}:${row.subject_id}`, row]));
    const rows = studentIds.map((studentId) => {
      const student = data.students.get(studentId);
      const summary = data.studentTotals.get(studentId) ?? { total: 0, count: 0 };
      const row: Record<string, string | number> = {
        Position: formatPosition(data.overallPositions.get(studentId)),
        "Student Code": student?.permanent_code ?? "",
        "Student Name": student ? [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ") : "",
      };

      subjects.forEach((subject) => {
        const result = resultByStudentSubject.get(`${studentId}:${subject.id}`);
        row[subject.name] = result ? `${result.total_score} (${result.grade})` : "";
      });

      row["Total Score"] = summary.total.toFixed(1);
      row["Average Score"] = summary.count ? (summary.total / summary.count).toFixed(2) : "0.00";
      row["Overall Grade"] = summary.count ? getPerformanceBand(summary.total / summary.count).grade : "";
      row["Class Teacher Comment"] = data.comments.get(studentId) ?? "";
      row["Result Status"] = data.upload.status;
      return row;
    });
    const breakdown = data.results.map((result) => {
      const student = data.students.get(result.student_id);
      return {
        "Student Name": student ? [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ") : "",
        Subject: data.subjects.get(result.subject_id)?.name ?? "",
        CA: result.continuous_assessment,
        Exam: result.exam_score,
        Total: result.total_score,
        Grade: result.grade,
        Remark: result.remark ?? "",
        "Subject Position": formatPosition(data.subjectPositions.get(`${result.student_id}:${result.subject_id}`)),
      };
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Broadsheet");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(breakdown), "Subject Breakdown");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;

    return { ok: true, message: "Broadsheet exported.", data: { fileName: `gradix-broadsheet-${cleanFilePart(data.upload.class_name)}-${data.upload.term}-${cleanFilePart(data.upload.academic_year)}.xlsx`, base64: buffer.toString("base64") } };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Broadsheet could not be exported." };
  }
}

export async function exportParentResultSharingSheetAction(uploadId: string): Promise<AuthActionState<{ fileName: string; base64: string }>> {
  try {
    const data = await loadPublishedSharingDataset(uploadId);
    const schoolPortalLink = buildSchoolPortalLink({ schoolSlug: data.school.slug });
    const exportedAt = new Date().toLocaleString();
    const rows = data.students
      .sort((a, b) => [a.first_name, a.middle_name, a.last_name].filter(Boolean).join(" ").localeCompare([b.first_name, b.middle_name, b.last_name].filter(Boolean).join(" ")))
      .map((student) => {
        const studentName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ");
        const directResultLink = buildStudentResultLink({ schoolSlug: data.school.slug, studentCode: student.permanent_code });
        const parentMessage = buildParentShareMessage({
          schoolName: data.school.name,
          studentName,
          studentCode: student.permanent_code,
          className: data.upload.class_name,
          term: data.upload.term,
          academicYear: data.upload.academic_year,
          schoolPortalLink,
          directResultLink,
        });

        return {
          "Student Name": studentName,
          Class: data.upload.class_name,
          "Academic Year": data.upload.academic_year,
          Term: data.upload.term,
          "Result Code": student.permanent_code,
          "School Portal Link": schoolPortalLink,
          "Direct Result Link": directResultLink,
          "Parent Share Message": parentMessage,
          "Result Status": "Published",
        };
      });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(
      [
        [`${data.school.name} - Parent Result Links`],
        [`Class: ${data.upload.class_name} | ${data.upload.term} term | ${data.upload.academic_year} | Exported: ${exportedAt}`],
        ["This sheet contains student result codes and private result links. Share it only with authorised school staff."],
      ],
    );
    XLSX.utils.sheet_add_json(worksheet, rows, { origin: "A4" });
    worksheet["!cols"] = [
      { wch: 28 },
      { wch: 16 },
      { wch: 16 },
      { wch: 12 },
      { wch: 20 },
      { wch: 44 },
      { wch: 52 },
      { wch: 70 },
      { wch: 16 },
    ];
    worksheet["!freeze"] = { xSplit: 0, ySplit: 4 };
    worksheet["!autofilter"] = { ref: `A4:J${Math.max(rows.length + 4, 4)}` };
    XLSX.utils.book_append_sheet(workbook, worksheet, "Parent Result Links");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;

    const supabase = await createClient();
    await supabase.from("audit_logs").insert({
      school_id: data.profile.school_id,
      actor_id: data.profile.id,
      actor_role: data.profile.role,
      action: "export",
      table_name: "result_uploads",
      record_id: data.upload.id,
      details: {
        export_type: "parent_result_sharing_sheet",
        class_id: data.upload.class_id,
        class_name: data.upload.class_name,
        term: data.upload.term,
        academic_year: data.upload.academic_year,
        row_count: rows.length,
      },
    });

    return {
      ok: true,
      message: "Parent result sharing sheet exported.",
      data: {
        fileName: `gradix-parent-result-links-${cleanFilePart(data.upload.class_name)}-${data.upload.term}-${cleanFilePart(data.upload.academic_year)}.xlsx`,
        base64: buffer.toString("base64"),
      },
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Parent result sharing sheet could not be exported." };
  }
}
