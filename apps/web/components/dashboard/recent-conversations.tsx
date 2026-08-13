import Link from "next/link";
import { Badge } from "@repo/ui/badge";
import type { DashboardSnapshot } from "@repo/types";
import { KairosAvatar } from "../kairos/kairos-avatar";
import { ClientRelativeTime } from "./client-relative-time";
import { EmptyState, SectionShell } from "./section-shell";

export function RecentConversations({
  snapshot,
}: {
  snapshot: DashboardSnapshot;
}) {
  return (
    <SectionShell
      title="Recent Conversations"
      description="Your latest Kairos threads."
      actionHref="/chat"
      actionLabel="Open chat"
    >
      {snapshot.conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          body="Start a chat with Kairos for workspace-aware help across CRM and Inbox."
          href="/chat"
          cta="Ask Kairos"
        />
      ) : (
        <ul className="space-y-2">
          {snapshot.conversations.map((conversation) => (
            <li key={conversation.id}>
              <Link
                href={conversation.href}
                className="flex items-center gap-3 rounded-xl border border-border bg-elevated px-3 py-2.5 transition duration-200 hover:border-primary/40"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-muted">
                  <KairosAvatar size="xs" state="idle" aria-label="" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {conversation.title}
                    </span>
                    {conversation.pinned ? (
                      <Badge variant="accent">Pinned</Badge>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {conversation.provider} · {conversation.model} ·{" "}
                    <ClientRelativeTime iso={conversation.updatedAt} />
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
