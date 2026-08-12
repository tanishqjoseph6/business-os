"use client";

import * as React from "react";
import { Button } from "@repo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Input } from "@repo/ui/input";
import { cn } from "@repo/ui/utils";
import type { ChatConversation } from "@repo/types";
import { useMounted } from "../../lib/use-mounted";

type ConversationListProps = {
  conversations: ChatConversation[];
  activeId?: string;
  onSelect: (conversationId: string) => void;
  onRename: (conversationId: string, title: string) => Promise<void>;
  onDelete: (conversationId: string) => Promise<void>;
  onPin: (conversationId: string, pinned: boolean) => Promise<void>;
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function conversationTime(conversation: ChatConversation) {
  return new Date(conversation.updatedAt || conversation.createdAt).getTime();
}

function buildStableGroups(conversations: ChatConversation[]) {
  const pinned = conversations.filter((conversation) => conversation.pinned);
  const unpinned = conversations.filter((conversation) => !conversation.pinned);
  return [
    pinned.length > 0 ? { label: "Pinned", items: pinned } : null,
    unpinned.length > 0 ? { label: "Recent", items: unpinned } : null,
  ].filter((bucket): bucket is { label: string; items: ChatConversation[] } => bucket !== null);
}

function groupConversations(conversations: ChatConversation[]) {
  const now = startOfDay(new Date());
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  const pinned: ChatConversation[] = [];
  const today: ChatConversation[] = [];
  const yesterdayItems: ChatConversation[] = [];
  const previous7: ChatConversation[] = [];
  const older: ChatConversation[] = [];

  for (const conversation of conversations) {
    if (conversation.pinned) {
      pinned.push(conversation);
      continue;
    }
    const time = conversationTime(conversation);
    if (time >= now.getTime()) today.push(conversation);
    else if (time >= yesterday.getTime()) yesterdayItems.push(conversation);
    else if (time >= weekAgo.getTime()) previous7.push(conversation);
    else older.push(conversation);
  }

  return [
    { label: "Pinned", items: pinned },
    { label: "Today", items: today },
    { label: "Yesterday", items: yesterdayItems },
    { label: "Previous 7 days", items: previous7 },
    { label: "Older", items: older },
  ].filter((bucket) => bucket.items.length > 0);
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onRename,
  onDelete,
  onPin,
}: ConversationListProps) {
  const mounted = useMounted();
  const [renameId, setRenameId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const groups = React.useMemo(
    () =>
      mounted
        ? groupConversations(conversations)
        : buildStableGroups(conversations),
    [conversations, mounted],
  );

  function openRename(conversation: ChatConversation) {
    setRenameId(conversation.id);
    setRenameValue(conversation.title);
  }

  async function submitRename() {
    if (!renameId || !renameValue.trim()) return;
    setBusyId(renameId);
    try {
      await onRename(renameId, renameValue.trim());
      setRenameId(null);
    } finally {
      setBusyId(null);
    }
  }

  if (conversations.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-xs text-muted">
        No conversations yet. Ask Kairos to get something done.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-1 p-2">
        {groups.map((group) => (
          <React.Fragment key={group.label}>
            <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted first:pt-1">
              {group.label}
            </p>
            {group.items.map((conversation) => {
              const active = conversation.id === activeId;
              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "group flex items-center gap-1 rounded-xl pr-1 transition",
                    active
                      ? "bg-primary/10 ring-1 ring-primary/20"
                      : "hover:bg-elevated/80",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left text-sm"
                  >
                    {conversation.pinned ? (
                      <span className="text-[10px] font-semibold text-primary">PIN</span>
                    ) : null}
                    <span className="truncate text-foreground/90">{conversation.title}</span>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 px-0 opacity-0 group-hover:opacity-100"
                      >
                        ···
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openRename(conversation)}>
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={async () => {
                          setBusyId(conversation.id);
                          try {
                            await onPin(conversation.id, !conversation.pinned);
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        {conversation.pinned ? "Unpin" : "Pin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-error"
                        onClick={async () => {
                          setBusyId(conversation.id);
                          try {
                            await onDelete(conversation.id);
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {busyId === conversation.id ? (
                    <span className="pr-2 text-[10px] text-muted">…</span>
                  ) : null}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <Dialog open={renameId !== null} onOpenChange={(open) => !open && setRenameId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            placeholder="Conversation title"
            autoFocus
          />
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setRenameId(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={submitRename} loading={busyId === renameId}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
