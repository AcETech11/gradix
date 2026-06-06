"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";

import { exportParentAccessAction } from "@/actions/parent-access/export-parent-access-action";
import { Button } from "@/components/ui/button";
import type { ParentAccessFilters } from "@/lib/parent-access/parent-access-types";

export function ParentAccessExportButton({ filters }: { filters: ParentAccessFilters }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function download() {
    setMessage("");
    startTransition(async () => {
      const result = await exportParentAccessAction(filters);

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      const link = document.createElement("a");
      link.href = `data:${result.mimeType};base64,${result.base64}`;
      link.download = result.fileName;
      link.click();
    });
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400" disabled={pending} type="button" onClick={download}>
        <Download className="size-4" />
        {pending ? "Preparing..." : "Export Excel"}
      </Button>
      {message ? <p className="text-sm text-red-300">{message}</p> : null}
    </div>
  );
}
