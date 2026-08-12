"use client";

import { KairosAvatar, KairosThinkingMessage } from "../kairos/kairos-avatar";

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
      <KairosAvatar size="sm" state="thinking" aria-label="Kairos is thinking" />
      <div className="min-w-0 pt-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Kairos
        </p>
        <div className="mt-1">
          <KairosThinkingMessage state="thinking" />
        </div>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/70 [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/40 [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}
