"use client";

import { LoaderCircle, Save } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SettingsSaveButton({ loading, label = "Save changes" }: { loading: boolean; label?: string }) {
  return (
    <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400" disabled={loading} type="submit">
      {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
      {loading ? "Saving..." : label}
    </Button>
  );
}
