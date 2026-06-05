import { AlertTriangle, CheckCircle2, Copy, FileWarning } from "lucide-react";

import type { UploadValidationSummary as Summary } from "@/lib/uploads/upload-types";

type UploadValidationSummaryProps = {
  summary: Summary;
};

export function UploadValidationSummary({ summary }: UploadValidationSummaryProps) {
  const cards = [
    { label: "Rows", value: summary.totalRows, icon: CheckCircle2 },
    { label: "Valid", value: summary.validRows, icon: CheckCircle2 },
    { label: "Invalid", value: summary.invalidRows, icon: AlertTriangle },
    { label: "Duplicates", value: summary.duplicateRows, icon: Copy },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4" key={card.label}>
          <card.icon className="size-5 text-orange-200" />
          <p className="mt-3 text-2xl font-semibold text-slate-50">{card.value}</p>
          <p className="text-sm text-slate-400">{card.label}</p>
        </div>
      ))}
      {summary.messages.length > 0 ? (
        <div className="sm:col-span-2 xl:col-span-4 rounded-2xl border border-orange-300/20 bg-orange-500/10 p-4 text-sm text-orange-100">
          <div className="flex items-center gap-2 font-medium">
            <FileWarning className="size-4" />
            Validation notes
          </div>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {summary.messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
