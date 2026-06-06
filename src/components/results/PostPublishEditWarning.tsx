import { AlertTriangle } from "lucide-react";

export function PostPublishEditWarning() {
  return (
    <div className="flex gap-3 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <p>Post-publish edits are sensitive. Every score or remark change is flagged and stored in the audit log.</p>
    </div>
  );
}
