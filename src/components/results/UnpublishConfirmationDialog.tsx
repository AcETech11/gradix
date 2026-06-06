"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeOff } from "lucide-react";

import { unpublishResultsAction } from "@/actions/results/unpublish-results-action";
import { Button } from "@/components/ui/button";

type UnpublishConfirmationDialogProps = {
  uploadId: string;
  disabled?: boolean;
  onMessage?: (message: string) => void;
};

export function UnpublishConfirmationDialog({ uploadId, disabled, onMessage }: UnpublishConfirmationDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function unpublish() {
    if (!window.confirm("Unpublishing will hide this result from parent access.")) {
      return;
    }

    startTransition(async () => {
      const response = await unpublishResultsAction(uploadId);
      onMessage?.(response.message);

      if (response.ok) {
        router.refresh();
      }
    });
  }

  return (
    <Button disabled={disabled || isPending} onClick={unpublish} type="button" variant="outline">
      <EyeOff />
      Unpublish
    </Button>
  );
}
