import Link from "next/link";
import { Plus } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { StudentFilters } from "@/components/students/student-filters";
import { ExportStudentsButton } from "@/components/students/export-students-button";
import { StudentImportPanel } from "@/components/students/student-import-panel";
import { StudentTable } from "@/components/students/student-table";
import { getStudentsPageData } from "@/lib/students/data";

type StudentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type StudentQueryFilters = {
  query: string;
  classId: string;
  status: "all" | "active" | "inactive" | "graduated" | "archived";
  page: number;
};

function normalizeSearchParams(searchParams: Record<string, string | string[] | undefined> | undefined): StudentQueryFilters {
  const status = typeof searchParams?.status === "string" ? searchParams.status : "all";

  return {
    query: typeof searchParams?.query === "string" ? searchParams.query : "",
    classId: typeof searchParams?.classId === "string" ? searchParams.classId : "",
    status:
      status === "active" || status === "inactive" || status === "graduated" || status === "archived" || status === "all"
        ? status
        : "all",
    page: typeof searchParams?.page === "string" ? Number(searchParams.page) || 1 : 1,
  };
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = normalizeSearchParams(await searchParams);
  const data = await getStudentsPageData(params);
  const canManage = data.profile.role === "admin";
  const hasStudents = data.students.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Students"
        title="Student management"
        description="Search, filter, and maintain the student registry that powers results, report cards, and parent access."
        actions={
          <>
            <StudentImportPanel
              canManage={canManage}
              classes={data.classes}
              existingStudentKeys={data.existingStudentKeys}
            />
            {data.profile.role === "admin" || data.profile.role === "headmaster" ? <ExportStudentsButton disabled={data.pagination.total === 0} filters={params} /> : null}
            {canManage ? (
              <Button asChild className="bg-orange-500 text-slate-950 hover:bg-orange-400">
                <Link href="/dashboard/students/new">
                  <Plus className="size-4" />
                  Add student
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <StudentFilters classId={params.classId} classes={data.classes} query={params.query} status={params.status} />

      {hasStudents ? (
        <div className="space-y-4">
          <StudentTable canManage={canManage} students={data.students} />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            <p>
              Page <span className="font-semibold text-slate-50">{data.pagination.page}</span> of{" "}
              <span className="font-semibold text-slate-50">{data.pagination.totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              {data.pagination.hasPreviousPage ? (
                <Button asChild className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" type="button" variant="outline">
                  <Link
                    href={{
                      pathname: "/dashboard/students",
                      query: { ...params, page: data.pagination.page - 1 },
                    }}
                  >
                    Previous
                  </Link>
                </Button>
              ) : null}
              {data.pagination.hasNextPage ? (
                <Button asChild className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" type="button" variant="outline">
                  <Link
                    href={{
                      pathname: "/dashboard/students",
                      query: { ...params, page: data.pagination.page + 1 },
                    }}
                  >
                    Next
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          action={
            canManage ? (
              <div className="flex flex-wrap justify-center gap-2">
                <StudentImportPanel canManage={canManage} classes={data.classes} existingStudentKeys={data.existingStudentKeys} />
                <ExportStudentsButton disabled filters={params} />
                <Button asChild className="bg-orange-500 text-slate-950 hover:bg-orange-400">
                  <Link href="/dashboard/students/new">
                    <Plus className="size-4" />
                    Add Student
                  </Link>
                </Button>
              </div>
            ) : undefined
          }
          description="Add students manually or upload a completed student template to get started faster."
          icon={Plus}
          title="No students added yet."
        />
      )}
    </div>
  );
}
