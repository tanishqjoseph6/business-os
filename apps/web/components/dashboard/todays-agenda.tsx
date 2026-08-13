import Link from "next/link";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import type { DashboardSnapshot } from "@repo/types";
import { formatDateTime } from "./format";
import { EmptyState, SectionShell } from "./section-shell";

export function TodaysAgenda({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <SectionShell
      title="Today's Agenda"
      description="Tasks and meetings due today from Inbox and Calendar."
      actionHref="/calendar"
      actionLabel="Calendar"
    >
      {snapshot.agenda.length === 0 ? (
        <EmptyState
          title="Nothing scheduled for today"
          body="Upcoming meetings and open tasks will appear here."
          href="/inbox/tasks"
          cta="View all tasks"
        />
      ) : (
        <ul className="space-y-2">
          {snapshot.agenda.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-start gap-3 rounded-xl border border-border bg-elevated px-3 py-2.5 transition duration-200 hover:border-primary/40"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-primary">
                  {item.kind === "event" ? (
                    <CalendarDays className="h-4 w-4" aria-hidden />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {item.title}
                    </span>
                    <Badge variant="default">{item.kind}</Badge>
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {formatDateTime(item.at)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
}
