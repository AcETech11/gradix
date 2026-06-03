import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { DataTableShell } from "./data-table-shell";
import { EmptyState } from "./empty-state";
import { FilterBar } from "./filter-bar";
import { PageHeader } from "./page-header";

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  icon: LucideIcon;
  actionLabel: string;
  filterPlaceholder: string;
  tableTitle: string;
  tableDescription: string;
  children?: ReactNode;
};

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  emptyTitle,
  emptyDescription,
  icon,
  actionLabel,
  filterPlaceholder,
  tableTitle,
  tableDescription,
  children,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <Button className="border border-orange-400/20 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20" disabled type="button" variant="outline">
            {actionLabel}
          </Button>
        }
      />

      <DataTableShell
        description={tableDescription}
        filters={<FilterBar disabled searchPlaceholder={filterPlaceholder} />}
        title={tableTitle}
      >
        {children ?? <EmptyState description={emptyDescription} icon={icon} title={emptyTitle} />}
      </DataTableShell>
    </div>
  );
}
