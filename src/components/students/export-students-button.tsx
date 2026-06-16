"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";

import { exportStudentsAction } from "@/actions/students/export-students-action";
import { Button } from "@/components/ui/button";
import type { StudentFilters } from "@/types/students";

function downloadBase64File(fileName: string, base64: string) {
  const link = document.createElement("a");
  link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
  link.download = fileName;
  link.click();
}

export function ExportStudentsButton({ filters, disabled }: { filters: Partial<StudentFilters>; disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();

  function exportStudents() {
    startTransition(async () => {
      const result = await exportStudentsAction(filters);
      if (result.ok && result.data) {
        downloadBase64File(result.data.fileName, result.data.base64);
      } else {
        window.alert(result.message);
      }
    });
  }

  return (
    <Button className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" disabled={disabled || isPending} type="button" variant="outline" onClick={exportStudents}>
      <Download className="size-4" />
      {isPending ? "Exporting..." : "Export Students"}
    </Button>
  );
}
