import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpenCheck, GraduationCap, Home, Menu, Search } from "lucide-react";

import { siteConfig } from "@/config/site";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  children: ReactNode;
};

const navItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: Home,
  },
] as const;

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="grid min-h-dvh bg-muted/30 lg:grid-cols-[17rem_1fr]">
      <aside className="hidden border-r bg-sidebar text-sidebar-foreground lg:block">
        <div className="flex h-16 items-center gap-3 border-b px-5">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold">{siteConfig.name}</p>
            <p className="text-xs text-muted-foreground">Learning workspace</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                item.href === "/dashboard" && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
              href={item.href}
              key={item.href}
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <Button aria-label="Open navigation" size="icon" variant="ghost" className="lg:hidden">
              <Menu />
            </Button>
            <div className="flex items-center gap-2 lg:hidden">
              <GraduationCap className="size-5" aria-hidden="true" />
              <span className="text-sm font-semibold">{siteConfig.name}</span>
            </div>
            <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
              <BookOpenCheck className="size-4" aria-hidden="true" />
              <span>Phase 1 foundation</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="hidden gap-2 sm:inline-flex">
              <Search />
              Search
            </Button>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
