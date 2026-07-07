import { FileSpreadsheet } from "lucide-react";
import Link from "next/link";

export function UploadInstructions() {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
      <div className="flex gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-orange-400/20 bg-orange-500/10 text-orange-200">
          <FileSpreadsheet className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Upload checklist</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            <li>Use the official class template from the templates page.</li>
            <li>Do not rename headers or edit Student Code, Student Name, or Class.</li>
            <li>Fill CA from 0 to 40, Exam from 0 to 60, and optional remarks.</li>
            <li>Save the workbook as .xlsx before uploading.</li>
          </ul>
          <Link className="mt-4 inline-flex text-sm font-medium text-orange-200 hover:text-orange-100" href="/dashboard/templates">
            Download the correct template
          </Link>
        </div>
      </div>
    </section>
  );
}
