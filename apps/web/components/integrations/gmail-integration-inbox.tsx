"use client";

import Link from "next/link";
import type { InboxThread } from "@repo/types";
import { Badge } from "@repo/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { InboxSearch } from "../inbox/inbox-search";

export function GmailIntegrationInbox({
  threads,
  accountEmail,
  connected,
}: {
  threads: InboxThread[];
  accountEmail: string | null;
  connected: boolean;
}) {
  if (!connected) {
    return (
      <Card elevated>
        <CardHeader>
          <CardTitle>Inbox preview</CardTitle>
          <CardDescription>
            Connect Gmail to sync metadata, search threads, and read messages.
          </CardDescription>
        </CardHeader>
        <p className="text-sm text-secondary">
          After connecting, VanderBase syncs inbox metadata and prepares AI
          summaries, smart replies, and automation hooks.
        </p>
      </Card>
    );
  }

  return (
    <Card elevated className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-4">
        <div>
          <CardTitle className="text-base">Latest emails</CardTitle>
          <CardDescription className="mt-1">
            {accountEmail ? `${accountEmail} · synced inbox metadata` : "Gmail inbox"}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <InboxSearch placeholder="Search Gmail threads…" />
          <Link
            href="/inbox"
            className="inline-flex h-9 items-center rounded-xl border border-border bg-elevated px-3 text-xs text-foreground transition hover:bg-surface"
          >
            Open full inbox
          </Link>
        </div>
      </div>

      <ul className="divide-y divide-border/70">
        {threads.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-muted">
            Sync in progress or no threads yet. Try manual sync or open the full
            inbox.
          </li>
        ) : (
          threads.map((thread) => (
            <li key={thread.id}>
              <Link
                href={`/inbox/threads/${thread.id}`}
                className="flex flex-col gap-2 px-4 py-3 transition hover:bg-elevated/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {thread.isUnread ? (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    ) : null}
                    <p
                      className={`truncate text-sm ${
                        thread.isUnread
                          ? "font-semibold text-foreground"
                          : "font-medium text-foreground"
                      }`}
                    >
                      {thread.subject}
                    </p>
                    {thread.meetingDetected ? (
                      <Badge variant="accent">Meeting</Badge>
                    ) : null}
                    {thread.hasAttachments ? (
                      <Badge variant="default">Attachment</Badge>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-secondary">
                    {thread.snippet}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-1 text-xs text-muted sm:items-end">
                  <span>{thread.status}</span>
                  <span>
                    {new Date(thread.lastMessageAt).toLocaleString()}
                  </span>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>

      <div className="border-t border-border/70 bg-elevated/30 px-4 py-3 text-xs text-secondary">
        AI inbox features — summaries, smart replies, drafts, and automation —
        are available from thread detail and Kairos when AI access is enabled.
      </div>
    </Card>
  );
}
