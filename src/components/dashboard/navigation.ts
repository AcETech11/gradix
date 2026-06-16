import type { LucideIcon } from "lucide-react";
import {
  FileBarChart2,
  FileSpreadsheet,
  Fingerprint,
  GraduationCap,
  HelpCircle,
  CreditCard,
  LineChart,
  LayoutDashboard,
  Settings2,
  ShieldAlert,
  UploadCloud,
  UsersRound,
} from "lucide-react";

import { hasPermission } from "@/lib/auth/permissions";
import type { AuthRole } from "@/types/auth";

export type DashboardNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: Parameters<typeof hasPermission>[1];
  roles?: AuthRole[];
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Students",
    href: "/dashboard/students",
    icon: UsersRound,
    roles: ["admin", "headmaster"],
  },
  {
    title: "Uploads",
    href: "/dashboard/uploads",
    icon: UploadCloud,
    roles: ["admin", "headmaster"],
  },
  {
    title: "Templates",
    href: "/dashboard/templates",
    icon: FileSpreadsheet,
    roles: ["admin", "headmaster"],
  },
  {
    title: "Results",
    href: "/dashboard/results",
    icon: FileBarChart2,
    roles: ["admin", "headmaster"],
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: LineChart,
    roles: ["admin", "headmaster"],
  },
  {
    title: "Parent Access",
    href: "/dashboard/parent-access",
    icon: Fingerprint,
    roles: ["admin", "headmaster"],
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
    roles: ["admin"],
  },
  {
    title: "Promotion",
    href: "/dashboard/promotion",
    icon: GraduationCap,
    roles: ["admin", "headmaster"],
  },
  {
    title: "Audit Logs",
    href: "/dashboard/audit",
    icon: ShieldAlert,
    permission: "audit_logs:view",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings2,
    roles: ["admin", "headmaster"],
  },
  {
    title: "Help",
    href: "/dashboard/help",
    icon: HelpCircle,
  },
];

export const DASHBOARD_BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  students: "Students",
  uploads: "Uploads",
  templates: "Templates",
  results: "Results",
  analytics: "Analytics",
  "parent-access": "Parent Access",
  billing: "Billing",
  promotion: "Promotion",
  audit: "Audit Logs",
  settings: "Settings",
  help: "Help",
};

export function getVisibleDashboardNavItems(role: AuthRole) {
  return DASHBOARD_NAV_ITEMS.filter((item) => {
    if (item.roles) {
      return item.roles.includes(role);
    }

    if (item.permission) {
      return hasPermission(role, item.permission);
    }

    return true;
  });
}

export function getDashboardBreadcrumbLabel(segment: string) {
  return DASHBOARD_BREADCRUMB_LABELS[segment] ?? segment.replace(/-/g, " ");
}
