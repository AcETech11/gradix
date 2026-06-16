import { BookOpenCheck, FileSpreadsheet, GraduationCap, Printer, UploadCloud, UsersRound } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { GettingStartedChecklist } from "@/components/help/GettingStartedChecklist";
import { WorkflowStepCard } from "@/components/help/WorkflowStepCard";
import { Button } from "@/components/ui/button";

const steps = [
  { title: "Complete school setup", description: "Add school profile, logo, signatures, classes, and subjects before daily use.", href: "/onboarding", icon: BookOpenCheck },
  { title: "Add students", description: "Create student records with permanent codes and parent contact details.", href: "/dashboard/students", icon: UsersRound },
  { title: "Download template", description: "Generate class-specific Excel templates with student identities prefilled.", href: "/dashboard/templates", icon: FileSpreadsheet },
  { title: "Upload and validate", description: "Upload completed sheets, review validation messages, and save normalized results.", href: "/dashboard/uploads", icon: UploadCloud },
  { title: "Publish and print", description: "Publish results, test the parent checker, and print official report cards.", href: "/dashboard/results", icon: Printer },
  { title: "Promote students", description: "After third term, move learners to the next class while preserving historical results.", href: "/dashboard/promotion", icon: GraduationCap },
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Help"
        title="How to use Gradix"
        description="A practical guide for school admins and headmasters running the full result workflow."
        actions={
          <Button asChild className="bg-orange-500 text-slate-950 hover:bg-orange-400">
            <Link href="/dashboard/help/print">Printable guide</Link>
          </Button>
        }
      />
      <GettingStartedChecklist />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step) => (
          <WorkflowStepCard key={step.title} {...step} />
        ))}
      </section>
      <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5">
        <h2 className="text-lg font-semibold text-slate-50">Recommended school workflow</h2>
        <ol className="mt-4 grid gap-3 text-sm leading-6 text-slate-300 md:grid-cols-2">
          {[
            "Complete school setup.",
            "Add classes and subjects.",
            "Add students.",
            "Download Excel template.",
            "Send template to teachers externally.",
            "Upload completed result sheet.",
            "Validate, preview, and publish results.",
            "Parents check results with student code.",
            "Print/download report cards.",
            "Monitor parent access and reset limits if needed.",
            "Review audit logs and analytics.",
            "Promote students after third term.",
          ].map((item, index) => (
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3" key={item}>
              <span className="mr-2 font-semibold text-orange-200">{index + 1}.</span>
              {item}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
