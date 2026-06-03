import { UsersRound } from "lucide-react";

import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

export default function StudentsPage() {
  return (
    <PlaceholderPage
      actionLabel="Add student"
      description="Prepare the student registry that future class, result, and parent-access flows will use."
      emptyTitle="No students yet"
      emptyDescription="Add your first student to begin using Gradix."
      eyebrow="Students"
      filterPlaceholder="Search students"
      icon={UsersRound}
      tableDescription="Student records will appear here once the management module ships."
      tableTitle="Student registry"
      title="Student records are ready to be added."
    />
  );
}
