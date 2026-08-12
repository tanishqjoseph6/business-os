"use client";

import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { cn } from "@repo/ui/utils";

export type ExecutionStep = {
  id: string;
  label: string;
  status: "pending" | "active" | "completed" | "failed";
};

type ActionExecutionPanelProps = {
  title?: string;
  steps: ExecutionStep[];
  phase?: "thinking" | "executing" | "completed" | "failed" | null;
};

export function ActionExecutionPanel({
  title = "Kairos is working…",
  steps,
  phase,
}: ActionExecutionPanelProps) {
  if (!steps.length && !phase) return null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-3 sm:px-6">
      <div className="rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 shadow-soft">
        <div className="mb-3 flex items-center gap-2">
          {phase === "completed" ? (
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
          ) : phase === "failed" ? (
            <XCircle className="h-4 w-4 text-error" aria-hidden />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
          )}
          <p className="text-sm font-medium text-foreground">
            {phase === "completed"
              ? "Completed"
              : phase === "failed"
                ? "Needs attention"
                : title}
          </p>
        </div>
        <ul className="space-y-2">
          {steps.map((step) => (
            <li key={step.id} className="flex items-center gap-2.5 text-sm">
              {step.status === "completed" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden />
              ) : step.status === "failed" ? (
                <XCircle className="h-3.5 w-3.5 text-error" aria-hidden />
              ) : step.status === "active" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted" aria-hidden />
              )}
              <span
                className={cn(
                  step.status === "completed" && "text-foreground",
                  step.status === "active" && "text-foreground",
                  step.status === "pending" && "text-muted",
                  step.status === "failed" && "text-error",
                )}
              >
                {step.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function buildExecutionSteps(input: {
  phase: "thinking" | "executing" | "completed" | "failed" | null;
  timeline: Array<{ id: string; tool: string; status: "completed" | "failed"; result: string }>;
}): ExecutionStep[] {
  if (!input.phase && input.timeline.length === 0) return [];

  const mapped = input.timeline.map((item) => ({
    id: item.id,
    label: formatToolLabel(item.tool, item.result),
    status: item.status as ExecutionStep["status"],
  }));

  if (input.phase === "thinking" && mapped.length === 0) {
    return [
      { id: "think", label: "Understanding your request", status: "active" },
      { id: "plan", label: "Planning next actions", status: "pending" },
      { id: "run", label: "Preparing workspace tools", status: "pending" },
    ];
  }

  if (input.phase === "executing") {
    const base =
      mapped.length > 0
        ? mapped
        : [
            { id: "crm", label: "Reading CRM", status: "completed" as const },
            { id: "calendar", label: "Checking calendar", status: "completed" as const },
            { id: "summary", label: "Preparing result", status: "active" as const },
          ];
    if (mapped.length > 0) {
      return [
        ...mapped,
        { id: "prepare", label: "Preparing summary", status: "active" },
      ];
    }
    return base;
  }

  if (input.phase === "completed") {
    return mapped.length
      ? mapped
      : [{ id: "done", label: "Completed", status: "completed" }];
  }

  if (input.phase === "failed") {
    return mapped.length
      ? mapped
      : [{ id: "failed", label: "Action failed", status: "failed" }];
  }

  return mapped;
}

function formatToolLabel(tool: string, result: string) {
  const nice = tool
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  const short = result.trim().slice(0, 72);
  return short ? `${nice} · ${short}` : nice;
}
