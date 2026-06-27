"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ReloadPageButton() {
  return (
    <Button
      className="mt-6 bg-orange-500 text-slate-950 hover:bg-orange-400"
      onClick={() => window.location.reload()}
      type="button"
    >
      <RefreshCw className="size-4" aria-hidden="true" />
      Try Again
    </Button>
  );
}
