"use client";

import {
  BarChart3,
  CalendarDays,
  FileText,
  Mail,
  Megaphone,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import type { KairosState } from "../../lib/kairos";
import { KAIROS_SUGGESTED_PROMPTS } from "../../lib/kairos-chat-prompts";
import { KairosAvatar } from "../kairos/kairos-avatar";

type EmptyStateProps = {
  onSuggestion: (text: string) => void;
  kairosState?: KairosState;
};

const ICONS = {
  sparkles: Sparkles,
  users: Users,
  target: Target,
  calendar: CalendarDays,
  mail: Mail,
  chart: BarChart3,
  file: FileText,
  megaphone: Megaphone,
} as const;

const FEATURED_PROMPTS = KAIROS_SUGGESTED_PROMPTS.slice(0, 4);

export function EmptyState({ onSuggestion, kairosState = "idle" }: EmptyStateProps) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-4 py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,122,0,0.12),transparent_46%)]"
      />

      <div className="relative z-[1] flex w-full max-w-lg flex-col items-center text-center">
        <div className="relative mb-4">
          <span
            className="absolute inset-[-12px] rounded-full bg-primary/15 blur-xl"
            aria-hidden
          />
          <KairosAvatar state={kairosState} size="md" interactive aria-label="Kairos" />
        </div>

        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          How can Kairos help?
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-secondary">
          Ask anything — analyze, create, schedule, or execute across VanderBase.
        </p>

        <div className="mt-6 grid w-full gap-2.5 sm:grid-cols-2">
          {FEATURED_PROMPTS.map((suggestion) => {
            const Icon = ICONS[suggestion.icon];
            return (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => onSuggestion(suggestion.label)}
                className="group rounded-xl border border-border/70 bg-[#12121a]/80 px-3.5 py-3 text-left backdrop-blur transition duration-200 hover:border-primary/40 hover:bg-[#16161f]"
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="min-w-0 text-sm font-medium leading-5 text-foreground">
                    {suggestion.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
