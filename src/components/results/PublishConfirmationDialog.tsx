"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

import { publishResultsAction } from "@/actions/results/publish-results-action";
import { Button } from "@/components/ui/button";

type PublishConfirmationDialogProps = {
  uploadId: string;
  disabled?: boolean;
  onMessage?: (message: string) => void;
};

export function PublishConfirmationDialog({ uploadId, disabled, onMessage }: PublishConfirmationDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function publish() {
    if (!window.confirm("Publishing will make this result available to parents once parent portal is enabled.")) {
      return;
    }

    startTransition(async () => {
      const response = await publishResultsAction(uploadId);
      onMessage?.(response.message);

      if (response.ok) {
        router.refresh();
      }
    });
  }

  return (
    <Button className="bg-orange-600 text-white hover:bg-orange-700" disabled={disabled || isPending} onClick={publish} type="button">
      <Send />
      Publish
    </Button>
  );
}
