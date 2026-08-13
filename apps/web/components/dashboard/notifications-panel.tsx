import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import type { DashboardSnapshot } from "@repo/types";
import { ClientRelativeTime } from "./client-relative-time";
import { EmptyState, SectionShell } from "./section-shell";

export function NotificationsPanel({
  snapshot,
}: {
  snapshot: DashboardSnapshot;
}) {
  return (
    <SectionShell
      title="Notifications"
      description="Shared workspace alerts across every module."
      actionHref="/notifications"
      actionLabel="View all"
    >
      {snapshot.notifications.length === 0 ? (
        <EmptyState preset="notifications" />
      ) : (
        <ul className="space-y-2">
          {snapshot.notifications.map((notification) => (
            <li key={notification.id}>
              <Link
                href={notification.actionUrl ?? "/notifications"}
                className="flex items-start gap-3 rounded-xl border border-border bg-elevated px-3 py-2.5 transition hover:border-primary/40"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-primary">
                  <Bell className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {notification.title}
                    </span>
                    <Badge variant={notification.isRead ? "default" : "accent"}>
                      {notification.module}
                    </Badge>
                  </span>
                  {notification.body ? (
                    <span className="mt-1 line-clamp-2 block text-xs text-secondary">
                      {notification.body}
                    </span>
                  ) : null}
                  <span className="mt-1 block text-[11px] text-muted">
                    <ClientRelativeTime iso={notification.createdAt} />
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
