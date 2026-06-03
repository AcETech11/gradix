import { GraduationCap } from "lucide-react";

type AuthCardHeaderProps = {
  title: string;
  description: string;
};

export function AuthCardHeader({ title, description }: AuthCardHeaderProps) {
  return (
    <div className="mb-7">
      <div className="mb-6 flex items-center gap-3 lg:hidden">
        <div className="flex size-10 items-center justify-center rounded-lg bg-orange-500 text-white">
          <GraduationCap className="size-5" aria-hidden="true" />
        </div>
        <span className="text-base font-semibold text-slate-950">Gradix</span>
      </div>
      <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
