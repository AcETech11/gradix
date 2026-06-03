import { LogOut } from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
        <LogOut />
        Logout
      </Button>
    </form>
  );
}
