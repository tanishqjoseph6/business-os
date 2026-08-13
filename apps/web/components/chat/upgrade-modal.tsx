"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@repo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { KAIROS_UPGRADE_MESSAGE } from "@repo/ai/chat/kairos-models";

export const KAIROS_UPGRADE_HREF = "/checkout?product=pro";

type UpgradeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <DialogTitle>Unlock more powerful AI</DialogTitle>
          <DialogDescription>{KAIROS_UPGRADE_MESSAGE}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              router.push(KAIROS_UPGRADE_HREF);
            }}
          >
            Upgrade to Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
