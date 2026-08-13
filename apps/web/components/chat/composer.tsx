"use client";

import * as React from "react";
import { Button } from "@repo/ui/button";
import { IconSparkles } from "@repo/ui/icons";
import { cn } from "@repo/ui/utils";
import { Mic, Paperclip } from "lucide-react";
import { ModelSelector } from "./model-selector";
import type { KairosChatModelId, KairosPlanId } from "@repo/ai/chat/kairos-models";

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  model: KairosChatModelId;
  onModelChange: (model: KairosChatModelId) => void;
  plan?: KairosPlanId;
  onLockedModel?: () => void;
};

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  disabled,
  model,
  onModelChange,
  plan,
  onLockedModel,
}: ComposerProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && !isStreaming && value.trim()) {
        onSubmit();
      }
    }
  }

  return (
    <div className="shrink-0 border-t border-border/70 bg-gradient-to-t from-background via-background to-transparent px-4 pb-3 pt-3 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="relative overflow-hidden rounded-[24px] border border-border/80 bg-[#12121a]/95 shadow-[0_0_0_1px_rgba(255,122,0,0.08),0_20px_50px_rgba(0,0,0,0.28)] backdrop-blur">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          />
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Kairos to get something done..."
            rows={1}
            disabled={disabled}
            className={cn(
              "max-h-[200px] min-h-[56px] w-full resize-none bg-transparent px-4 py-4 text-sm leading-6 text-foreground outline-none placeholder:text-muted",
              disabled && "opacity-60",
            )}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 px-0 text-muted"
                disabled
                title="Attachments coming soon"
                aria-label="Attach file"
              >
                <Paperclip className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 px-0 text-muted"
                disabled
                title="Voice input coming soon"
                aria-label="Voice input"
              >
                <Mic className="h-4 w-4" aria-hidden />
              </Button>
              <ModelSelector
                model={model}
                onChange={onModelChange}
                plan={plan}
                disabled={isStreaming}
                onLockedSelect={onLockedModel}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-[11px] text-muted sm:inline">Enter to send</span>
              {isStreaming ? (
                <Button type="button" variant="secondary" size="sm" onClick={onStop}>
                  Stop
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={disabled || !value.trim()}
                  onClick={onSubmit}
                  className="gap-1.5"
                >
                  <IconSparkles className="h-3.5 w-3.5" />
                  Send
                </Button>
              )}
            </div>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">
          Kairos can take actions across VanderBase. Confirm before irreversible changes.
        </p>
      </div>
    </div>
  );
}
