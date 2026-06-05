import { FileSpreadsheet, PlusCircle } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { TemplateDownloadForm } from "@/components/templates/TemplateDownloadForm";
import { TemplateInstructions } from "@/components/templates/TemplateInstructions";
import { Button } from "@/components/ui/button";
import { getTemplatePageData } from "@/lib/templates/data";

export default async function TemplatesPage() {
  const { classes, defaultAcademicYear } = await getTemplatePageData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Templates"
        title="Download class-ready Excel result templates."
        description="Generate wide-format result sheets from each class's assigned subjects and enrolled students."
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
          description="Create classes during onboarding before downloading result templates."
          icon={FileSpreadsheet}
          title="No classes available"
        />
      ) : (
        <>
          <TemplateDownloadForm classes={classes} defaultAcademicYear={defaultAcademicYear} />
          <TemplateInstructions />
        </>
      )}
    </div>
  );
}
