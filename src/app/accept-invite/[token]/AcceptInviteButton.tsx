"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

import { acceptStaffInvitationAction } from "@/actions/settings/staff-invitation-actions";
import { Button } from "@/components/ui/button";

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      className="h-12 bg-orange-600 text-white hover:bg-orange-700"
      disabled={pending}
      type="button"
      onClick={() =>
        startTransition(async () => {
          const result = await acceptStaffInvitationAction(token);

          if (result.ok && result.data?.redirectTo) {
            router.push(result.data.redirectTo);
            return;
          }

          alert(result.message);
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Accept invitation
    </Button>
  );
}
