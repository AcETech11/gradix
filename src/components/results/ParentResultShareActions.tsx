"use client";

import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

type ParentResultShareActionsProps = {
  studentCode: string;
  directResultLink: string;
  parentMessage: string;
  shareTitle: string;
};

export function ParentResultShareActions({ directResultLink, parentMessage, shareTitle, studentCode }: ParentResultShareActionsProps) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function flash(value: string) {
    setMessage(value);
    window.setTimeout(() => setMessage(""), 2400);
  }

  async function copy(value: string, feedback: string) {
    await navigator.clipboard.writeText(value);
    flash(feedback);
  }

  function share() {
    startTransition(async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: parentMessage,
            url: directResultLink,
          });
          flash("Sharing options opened");
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }

      await copy(parentMessage, "Parent message copied. You can paste it into WhatsApp.");
    });
  }

  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(parentMessage)}`;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <IconButton label="Copy Result Code" onClick={() => void copy(studentCode, "Result code copied")}>
          <Copy className="size-4" />
        </IconButton>
        <IconButton label="Copy Direct Result Link" onClick={() => void copy(directResultLink, "Direct result link copied")}>
          <Copy className="size-4" />
        </IconButton>
        <IconButton label="Copy Parent Message" onClick={() => void copy(parentMessage, "Parent message copied")}>
          <Check className="size-4" />
        </IconButton>
        <IconButton disabled={isPending} label="Share" onClick={share}>
          <Share2 className="size-4" />
        </IconButton>
        <Button asChild aria-label="Share via WhatsApp" className="size-9 border-white/10 bg-white/5 p-0 text-slate-100 hover:bg-white/10" size="icon" title="Share via WhatsApp" variant="outline">
          <a href={whatsappLink} rel="noreferrer" target="_blank">
            <MessageCircle className="size-4" />
          </a>
        </Button>
      </div>
      {message ? <p className="text-xs text-emerald-300">{message}</p> : null}
    </div>
  );
}

function IconButton({ children, disabled, label, onClick }: { children: ReactNode; disabled?: boolean; label: string; onClick: () => void }) {
  return (
    <Button aria-label={label} className="size-9 border-white/10 bg-white/5 p-0 text-slate-100 hover:bg-white/10" disabled={disabled} onClick={onClick} size="icon" title={label} type="button" variant="outline">
      {children}
    </Button>
  );
}
