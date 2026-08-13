import Link from "next/link";
import { FileText, Inbox, PenLine } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import type { DashboardSnapshot } from "@repo/types";
import { ClientRelativeTime } from "./client-relative-time";
import { EmptyState, SectionShell } from "./section-shell";

export function ContentOverview({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <SectionShell
      title="Content Overview"
      description="Inbox drafts, summaries, and content signals across your workspace."
      actionHref="/content"
      actionLabel="Content OS"
    >
      <div className="mb-4 grid grid-cols-3 gap-2">
        <StatChip label="AI drafts" value={snapshot.content.aiDrafts} />
        <StatChip
          label="Summaries"
          value={snapshot.content.summarizedThreads}
        />
        <StatChip label="Unread" value={snapshot.content.unreadThreads} />
      </div>

      {snapshot.content.items.length === 0 ? (
        <EmptyState
          title="No content signals yet"
          body="AI reply drafts and email summaries from Inbox will show here. Content OS planner arrives next."
          href="/inbox"
          cta="Open inbox"
        />
      ) : (
        <ul className="space-y-2">
          {snapshot.content.items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-start gap-3 rounded-xl border border-border bg-elevated px-3 py-2.5 transition duration-200 hover:border-primary/40"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-primary">
                  {item.kind === "draft" ? (
                    <PenLine className="h-4 w-4" aria-hidden />
                  ) : item.kind === "summary" ? (
                    <FileText className="h-4 w-4" aria-hidden />
                  ) : (
                    <Inbox className="h-4 w-4" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {item.title}
                    </span>
                    <Badge variant="default">{item.kind}</Badge>
                  </span>
                  <span className="mt-1 line-clamp-2 text-xs text-secondary">
                    {item.subtitle}
                  </span>
                  <span className="mt-1 block text-[11px] text-muted">
                    <ClientRelativeTime iso={item.updatedAt} />
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

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-center">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
