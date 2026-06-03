"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { getDashboardBreadcrumbLabel } from "./navigation";

type BreadcrumbsProps = {
  className?: string;
};

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (!segments.length || segments[0] !== "dashboard") {
    return null;
  }

  const items = [
    { label: "Dashboard", href: "/dashboard" },
    ...segments.slice(1).map((segment, index) => ({
      label: getDashboardBreadcrumbLabel(segment),
      href: `/dashboard/${segments.slice(1, index + 2).join("/")}`,
    })),
  ];

  return (
    <nav aria-label="Breadcrumb" className={cn("flex flex-wrap items-center gap-2 text-sm", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div className="flex items-center gap-2" key={item.href}>
            {index > 0 ? <ChevronRight className="size-4 text-slate-500" aria-hidden="true" /> : null}
            {isLast ? (
              <span className="font-medium text-slate-100">{item.label}</span>
            ) : (
              <Link className="text-slate-400 transition-colors hover:text-slate-100" href={item.href}>
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
