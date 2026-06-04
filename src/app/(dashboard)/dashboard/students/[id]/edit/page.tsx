import { redirect, notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { StudentForm } from "@/components/students/student-form";
import { getStudentEditData } from "@/lib/students/data";
import { buildStudentFormDefaults } from "@/lib/students/utils";
import { getCurrentUserProfile } from "@/lib/auth/session";

type StudentEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudentEditPage({ params }: StudentEditPageProps) {
  const profile = await getCurrentUserProfile();

  if (!profile || (profile.role !== "admin" && profile.role !== "teacher")) {
    redirect("/dashboard/students");
  }

  const { id } = await params;
  const data = await getStudentEditData(id);

  if (!data.student) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Students"
        title="Edit student"
        description="Update profile details, replace the passport photo, and reassign the student if needed."
      />

      <StudentForm
        classes={data.classes}
        initialValues={buildStudentFormDefaults(data.student)}
        mode="edit"
        schoolId={profile.school_id}
        studentId={data.student.id}
      />
    </div>
  );
}
