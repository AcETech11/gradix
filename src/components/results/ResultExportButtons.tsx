"use client";

import { useTransition } from "react";
import { Download, Table2 } from "lucide-react";

import { exportBroadsheetAction, exportResultsAction } from "@/actions/results/export-results-action";
import { Button } from "@/components/ui/button";

function downloadBase64File(fileName: string, base64: string) {
  const link = document.createElement("a");
  link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
  link.download = fileName;
  link.click();
}

export function ResultExportButtons({ uploadId }: { uploadId: string }) {
  const [isPending, startTransition] = useTransition();

  function exportResults() {
    startTransition(async () => {
      const result = await exportResultsAction(uploadId);
      if (result.ok && result.data) downloadBase64File(result.data.fileName, result.data.base64);
      else window.alert(result.message);
    });
  }

  function exportBroadsheet() {
    startTransition(async () => {
      const result = await exportBroadsheetAction(uploadId);
      if (result.ok && result.data) downloadBase64File(result.data.fileName, result.data.base64);
      else window.alert(result.message);
    });
  }

  return (
    <>
      <Button disabled={isPending} onClick={exportResults} size="sm" type="button" variant="outline">
        <Download />
        Export Results
      </Button>
      <Button disabled={isPending} onClick={exportBroadsheet} size="sm" type="button" variant="outline">
        <Table2 />
        Broadsheet
      </Button>
    </>
  );
}
