"use client";

import { Button } from "@repo/ui/button";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  FileText,
  Mail,
  Users,
} from "lucide-react";

export type SmartAction = {
  id: string;
  label: string;
  prompt: string;
};

export type ToolActivity = {
  id: string;
  tool: string;
  summary: string;
};

export type MetricItem = {
  label: string;
  value: string;
};

function tryParseJsonObject(content: string): Record<string, unknown> | null {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() || trimmed;
  if (!candidate.startsWith("{") || !candidate.endsWith("}")) return null;
  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

function humanizeKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMetricValue(value: unknown): string | null {
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

export function extractMetricsFromContent(content: string): {
  title: string;
  metrics: MetricItem[];
} | null {
  const parsed = tryParseJsonObject(content);
  if (!parsed) return null;

  const preferredKeys = [
    "revenue",
    "newCustomers",
    "new_customers",
    "customers",
    "openDeals",
    "open_deals",
    "deals",
    "tasksDue",
    "tasks_due",
    "tasks",
    "meetings",
    "leads",
    "invoices",
  ];

  const metrics: MetricItem[] = [];
  for (const key of preferredKeys) {
    if (!(key in parsed)) continue;
    const formatted = formatMetricValue(parsed[key]);
    if (!formatted) continue;
    metrics.push({ label: humanizeKey(key), value: formatted });
  }

  if (metrics.length < 2) {
    for (const [key, value] of Object.entries(parsed)) {
      if (metrics.some((item) => item.label === humanizeKey(key))) continue;
      const formatted = formatMetricValue(value);
      if (!formatted) continue;
      metrics.push({ label: humanizeKey(key), value: formatted });
      if (metrics.length >= 6) break;
    }
  }

  if (metrics.length < 2) return null;
  return {
    title:
      typeof parsed.title === "string"
        ? parsed.title
        : typeof parsed.summary === "string"
          ? "Summary"
          : "Today's Business",
    metrics: metrics.slice(0, 6),
  };
}

export function inferSmartActions(content: string): SmartAction[] {
  const text = content.toLowerCase();
  if (/lead|customer|crm|contact/.test(text)) {
    return [
      { id: "follow-up", label: "Create follow-up", prompt: "Create a follow-up task for these customers" },
      { id: "email", label: "Send email", prompt: "Draft a follow-up email for these customers" },
      { id: "task", label: "Add task", prompt: "Add a task to follow up with these leads" },
    ];
  }
  if (/revenue|invoice|finance|analytics|mrr/.test(text)) {
    return [
      { id: "analyze", label: "Analyze revenue", prompt: "Analyze this month's revenue in more detail" },
      { id: "report", label: "Create report", prompt: "Create a revenue report I can share" },
      { id: "analytics", label: "View analytics", prompt: "Show analytics for this revenue data" },
    ];
  }
  if (/meeting|calendar|schedule|follow-?up/.test(text)) {
    return [
      { id: "schedule", label: "Schedule follow-ups", prompt: "Schedule my follow-ups for this week" },
      { id: "email", label: "Draft emails", prompt: "Draft follow-up emails for these meetings" },
      { id: "tasks", label: "Convert to tasks", prompt: "Create tasks from these follow-ups" },
    ];
  }
  if (/deal|pipeline|opportunit/.test(text)) {
    return [
      { id: "attention", label: "Prioritize deals", prompt: "Find deals that need attention" },
      { id: "email", label: "Draft outreach", prompt: "Draft outreach emails for these deals" },
      { id: "task", label: "Add next steps", prompt: "Create next-step tasks for these deals" },
    ];
  }
  return [
    { id: "summarize", label: "Summarize", prompt: "Summarize today's business" },
    { id: "next", label: "Suggest next actions", prompt: "What should I do next based on this?" },
  ];
}

export function ToolActivityList({ items }: { items: ToolActivity[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-border/70 bg-elevated/50 px-3 py-2.5"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Using {item.tool}
          </p>
          <div className="mt-1 flex items-start gap-2 text-sm text-secondary">
            <span className="text-muted">↓</span>
            <span>{item.summary}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MetricsCard({
  title,
  metrics,
}: {
  title: string;
  metrics: MetricItem[];
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-border/80 bg-[#12121a]">
      <div className="border-b border-border/70 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          {title}
        </p>
      </div>
      <div className="grid gap-px bg-border/60 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-[#12121a] px-4 py-3">
            <p className="text-xs text-muted">{metric.label}</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SmartActionBar({
  actions,
  onAction,
  disabled,
}: {
  actions: SmartAction[];
  onAction: (prompt: string) => void;
  disabled?: boolean;
}) {
  if (!actions.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.id}
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled}
          onClick={() => onAction(action.prompt)}
          className="rounded-full"
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}

export function timelineToToolActivity(
  timeline: Array<{ id: string; tool: string; result: string; status: string }>,
): ToolActivity[] {
  return timeline.slice(0, 4).map((item) => ({
    id: item.id,
    tool: niceToolName(item.tool),
    summary: item.result || (item.status === "completed" ? "Completed" : item.status),
  }));
}

function niceToolName(tool: string) {
  const lower = tool.toLowerCase();
  if (lower.includes("crm") || lower.includes("customer") || lower.includes("deal")) return "CRM";
  if (lower.includes("calendar") || lower.includes("meeting")) return "Calendar";
  if (lower.includes("mail") || lower.includes("email")) return "Email";
  if (lower.includes("invoice") || lower.includes("finance")) return "Finance";
  if (lower.includes("task")) return "Tasks";
  if (lower.includes("analytics") || lower.includes("revenue")) return "Analytics";
  return tool.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ResultTypeIcon({ content }: { content: string }) {
  const text = content.toLowerCase();
  if (/customer|lead|crm/.test(text)) return <Users className="h-3.5 w-3.5" />;
  if (/calendar|meeting/.test(text)) return <CalendarDays className="h-3.5 w-3.5" />;
  if (/email|mail/.test(text)) return <Mail className="h-3.5 w-3.5" />;
  if (/revenue|analytics/.test(text)) return <BarChart3 className="h-3.5 w-3.5" />;
  if (/invoice|document/.test(text)) return <FileText className="h-3.5 w-3.5" />;
  return <CheckCircle2 className="h-3.5 w-3.5" />;
}
