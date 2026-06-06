"use client";

import { Download, Printer } from "lucide-react";

export function PrintActions() {
  function printReport() {
    window.print();
  }

  return (
    <div className="print-hidden flex flex-col gap-2 sm:flex-row sm:justify-end">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 sm:mr-auto">
        For best PDF output, disable browser headers and footers in the print dialog.
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          onClick={printReport}
          type="button"
        >
          <Printer className="size-4" />
          Print Result
        </button>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-200 hover:bg-slate-800"
          onClick={printReport}
          type="button"
        >
          <Download className="size-4" />
          Download PDF
        </button>
      </div>
    </div>
  );
}
