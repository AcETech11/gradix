import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ClassOption = {
  id: string;
  name: string;
  level: string;
  arm: string | null;
};

type StudentFiltersProps = {
  query: string;
  classId: string;
  status: string;
  classes: ClassOption[];
};

export function StudentFilters({ query, classId, status, classes }: StudentFiltersProps) {
  return (
    <form className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:items-end" method="get">
      <input name="page" type="hidden" value={1} />

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400" htmlFor="query">
          Search
        </label>
        <Input
          defaultValue={query}
          id="query"
          name="query"
          placeholder="Name, admission number, or student code"
          className="h-11 border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400" htmlFor="classId">
          Class
        </label>
        <select
          defaultValue={classId}
          id="classId"
          name="classId"
          className="h-11 w-full rounded-md border border-white/10 bg-slate-950/40 px-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:ring-2 focus:ring-orange-400/40"
        >
          <option value="">All classes</option>
          {classes.map((classOption) => (
            <option key={classOption.id} value={classOption.id}>
              {classOption.name} {classOption.arm ? `(${classOption.arm})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400" htmlFor="status">
          Status
        </label>
        <select
          defaultValue={status}
          id="status"
          name="status"
          className="h-11 w-full rounded-md border border-white/10 bg-slate-950/40 px-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:ring-2 focus:ring-orange-400/40"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="repeated">Repeated</option>
          <option value="graduated">Graduated</option>
          <option value="transferred">Transferred</option>
          <option value="withdrawn">Withdrawn</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex gap-2">
        <Button className="w-full bg-orange-500 text-slate-950 hover:bg-orange-400" type="submit">
          Filter
        </Button>
        <Button asChild className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" type="button" variant="outline">
          <Link href="/dashboard/students">Reset</Link>
        </Button>
      </div>
    </form>
  );
}
