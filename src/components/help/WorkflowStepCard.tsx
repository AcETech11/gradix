import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function WorkflowStepCard({ description, href, icon: Icon, title }: { title: string; description: string; href?: string; icon: LucideIcon }) {
  const content = (
    <article className="h-full rounded-2xl border border-white/10 bg-slate-900/75 p-5 transition hover:border-orange-400/30">
      <div className="flex size-11 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-200">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 font-semibold text-slate-50">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </article>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
