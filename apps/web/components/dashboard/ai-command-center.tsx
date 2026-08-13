"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import type { DashboardSnapshot } from "@repo/types";
import { KairosAvatar } from "../kairos/kairos-avatar";
import { useKairosChat } from "../kairos/chat";
import { EmptyState, SectionShell } from "./section-shell";

const PROMPTS = [
  "Summarize today's business",
  "Show me new customers",
  "Analyze revenue",
  "Draft a follow-up email",
  "Create a marketing campaign",
  "Plan my day",
] as const;

export function AiCommandCenter({ snapshot }: { snapshot: DashboardSnapshot }) {
  const { openChat } = useKairosChat();

  return (
    <SectionShell
      title="Ask Kairos"
      description="Your AI business copilot."
      elevated
      actionHref="/chat"
      actionLabel="Open chat"
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-transparent p-4 sm:flex-row sm:items-center">
          <KairosAvatar size="sm" state="idle" interactive aria-label="Kairos" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Kairos is ready</p>
            <p className="text-xs text-secondary">
              Analyze, create, schedule, and execute across VanderBase.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">
              {snapshot.kpis.aiCredits.toLocaleString()} credits
            </Badge>
            <Badge variant="default">
              {snapshot.chat.conversations} conversations
            </Badge>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Suggested prompts
          </p>
          <div className="flex flex-wrap gap-2">
            {PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => openChat(prompt)}
                className="rounded-full border border-border/70 bg-elevated/60 px-3 py-1.5 text-xs text-secondary transition hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Insights
          </p>
          {snapshot.insights.length === 0 ? (
            <EmptyState
              title="No insights yet"
              body="Connect Inbox or CRM activity to generate AI recommendations."
              href="/chat"
              cta="Ask Kairos"
            />
          ) : (
            snapshot.insights.slice(0, 4).map((insight) => (
              <Link
                key={`${insight.module}-${insight.title}`}
                href={insight.actionUrl}
                className="group flex gap-3 rounded-2xl border border-border/70 bg-surface/80 p-3 transition duration-200 hover:border-primary/40 hover:bg-elevated"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-primary">
                  <Sparkles className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {insight.title}
                    </span>
                    <Badge
                      variant={
                        insight.severity === "warning"
                          ? "warning"
                          : insight.severity === "success"
                            ? "success"
                            : "info"
                      }
                    >
                      {insight.module}
                    </Badge>
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-secondary">
                    {insight.body}
                  </span>
                </span>
                <ArrowRight className="mt-2 h-4 w-4 text-muted transition group-hover:text-primary" />
              </Link>
            ))
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => openChat()}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Open chat
          </Button>
          <Link href="/chat">
            <Button type="button" size="sm" variant="secondary">
              Full chat workspace
            </Button>
          </Link>
          <Link href="/ai">
            <Button type="button" size="sm" variant="ghost">
              AI Studio
            </Button>
          </Link>
        </div>
      </div>
    </SectionShell>
  );
}
