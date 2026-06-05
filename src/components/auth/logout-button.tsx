"use client";

import { LogOut } from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { logAuthDebug } from "@/lib/auth/debug";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button
        type="submit"
        variant="ghost"
        className="gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => logAuthDebug("logout button clicked")}
      >
        <LogOut />
        Logout
      </Button>
    </form>
  );
}
