import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { StudentForm } from "@/components/students/student-form";
import { getStudentFormData } from "@/lib/students/data";
import { getCurrentUserProfile } from "@/lib/auth/session";

export default async function NewStudentPage() {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard/students");
  }

  const data = await getStudentFormData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Students"
        title="Add a student"
        description="Create a new student record with a passport photo, class assignment, and parent contact details."
      />

      <StudentForm classes={data.classes} mode="create" schoolId={profile.school_id} />
    </div>
  );
}
