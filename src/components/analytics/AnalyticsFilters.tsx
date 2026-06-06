"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Filter, X } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { analyticsFilterSchema, type AnalyticsFilterOptions, type AnalyticsFilters as AnalyticsFilterValues } from "@/lib/analytics/analytics-types";

type AnalyticsFilterFormValues = z.input<typeof analyticsFilterSchema>;

export function AnalyticsFilters({ options }: { options: AnalyticsFilterOptions }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const form = useForm<AnalyticsFilterFormValues, unknown, AnalyticsFilterValues>({
    resolver: zodResolver(analyticsFilterSchema),
    defaultValues: {
      academicYear: searchParams.get("academicYear") ?? options.defaults.academicYear ?? "",
      term: (searchParams.get("term") as AnalyticsFilterValues["term"]) ?? options.defaults.term,
      classId: searchParams.get("classId") ?? "",
      subjectId: searchParams.get("subjectId") ?? "",
    },
  });

  function submit(values: AnalyticsFilterValues) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(values)) {
      if (value?.trim()) {
        params.set(key, value.trim());
      }
    }

    router.push(`/dashboard/analytics${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function clear() {
    form.reset({
      academicYear: options.defaults.academicYear ?? "",
      term: options.defaults.term,
      classId: "",
      subjectId: "",
    });
    router.push("/dashboard/analytics");
  }

  return (
    <form className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 md:grid-cols-4" onSubmit={form.handleSubmit(submit)}>
      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Academic Year</span>
        <select className="h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-100" {...form.register("academicYear")}>
          <option value="">Latest year</option>
          {options.academicYears.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Term</span>
        <select className="h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-100" {...form.register("term")}>
          <option value="">Latest term</option>
          {options.terms.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Class</span>
        <select className="h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-100" {...form.register("classId")}>
          <option value="">All classes</option>
          {options.classes.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Subject</span>
        <select className="h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-100" {...form.register("subjectId")}>
          <option value="">All subjects</option>
          {options.subjects.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-2 md:col-span-4">
        <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400" type="submit">
          <Filter className="size-4" />
          Apply filters
        </Button>
        <Button className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" type="button" variant="outline" onClick={clear}>
          <X className="size-4" />
          Reset
        </Button>
      </div>
    </form>
  );
}
