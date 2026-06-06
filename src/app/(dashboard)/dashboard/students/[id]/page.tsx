import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { StudentProfileView } from "@/components/students/student-profile";
import { getStudentDetailData } from "@/lib/students/data";

type StudentProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudentProfilePage({ params }: StudentProfilePageProps) {
  const { id } = await params;
  const data = await getStudentDetailData(id);

  if (!data) {
    notFound();
  }

  const canManage = data.profile.role === "admin";

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Students" title="Student profile" description="Review a student record before result uploads and report workflows are added." />
      <StudentProfileView canManage={canManage} student={data.student} />
    </div>
  );
}
