import { FileSpreadsheet, PlusCircle } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { UploadInstructions } from "@/components/uploads/UploadInstructions";
import { UploadWizard } from "@/components/uploads/UploadWizard";
import { getUploadPageData } from "@/lib/uploads/data";

export default async function NewUploadPage() {
  const { classes, defaultAcademicYear } = await getUploadPageData();

  return (
    <div className="space-y-6">
      <PageHeader
        description="Upload a completed Gradix Excel template, validate every row, preview normalized results, and save clean rows without publishing."
        eyebrow="Uploads"
        title="Upload completed result template"
      />

      {classes.length === 0 ? (
        <EmptyState
          action={
            <Button asChild className="bg-orange-600 text-white hover:bg-orange-700">
              <Link href="/onboarding">
                <PlusCircle />
                Add classes
              </Link>
            </Button>
          }
          description="Create classes, assign subjects, and add students before uploading results."
          icon={FileSpreadsheet}
          title="No classes available"
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <UploadWizard classes={classes} defaultAcademicYear={defaultAcademicYear} />
          <UploadInstructions />
        </div>
      )}
    </div>
  );
}
