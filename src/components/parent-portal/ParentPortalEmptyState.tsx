import { AlertCircle } from "lucide-react";
import Link from "next/link";

type ParentPortalEmptyStateProps = {
  title: string;
  description: string;
  href?: string;
};

export function ParentPortalEmptyState({ description, href = "/results", title }: ParentPortalEmptyStateProps) {
  return (
    <section className="w-full max-w-xl rounded-[1.75rem] border border-slate-200 bg-white p-6 text-center shadow-[0_30px_80px_-45px_rgba(15,23,42,0.35)]">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-700">
        <AlertCircle className="size-7" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold text-slate-950">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <Link className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white" href={href}>
        Try another code
      </Link>
    </section>
  );
}
