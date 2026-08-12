"use client";

import * as React from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { IconSearch, IconSparkles } from "@repo/ui/icons";
import { Badge } from "@repo/ui/badge";
import { Plus } from "lucide-react";
import type { ChatConversation } from "@repo/types";
import { ConversationList } from "./conversation-list";
import { KairosAvatar } from "../kairos/kairos-avatar";
import type { KairosState } from "../../lib/kairos";

type ChatSidebarProps = {
  conversations: ChatConversation[];
  activeId?: string;
  creditBalance: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewChat: () => void;
  onSelect: (conversationId: string) => void;
  onRename: (conversationId: string, title: string) => Promise<void>;
  onDelete: (conversationId: string) => Promise<void>;
  onPin: (conversationId: string, pinned: boolean) => Promise<void>;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  kairosState?: KairosState;
  isOnline?: boolean;
};

export function ChatSidebar({
  conversations,
  activeId,
  creditBalance,
  searchQuery,
  onSearchChange,
  onNewChat,
  onSelect,
  onRename,
  onDelete,
  onPin,
  mobileOpen,
  onMobileClose,
  kairosState = "idle",
  isOnline = true,
}: ChatSidebarProps) {
  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      ) : null}
      <aside
        className={[
          "z-50 flex h-full min-h-0 w-[272px] shrink-0 flex-col border-r border-border/80 bg-[#0f0f15]/95 backdrop-blur",
          "fixed inset-y-0 left-0 transition duration-200 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <KairosAvatar size="xs" state={kairosState} aria-label="Kairos" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <IconSparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                <span className="text-sm font-semibold">Kairos</span>
              </div>
              <p className="truncate text-[11px] text-muted">
                {isOnline ? "Ready" : "Offline"} · AI Copilot
              </p>
            </div>
          </div>
          <Badge variant="accent" className="shrink-0 text-[10px]">
            {creditBalance.toLocaleString()}
          </Badge>
        </div>

        <div className="space-y-3 border-b border-border/70 p-3">
          <Button type="button" className="w-full gap-1.5" onClick={onNewChat}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New chat
          </Button>
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search conversations"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => {
              onSelect(id);
              onMobileClose?.();
            }}
            onRename={onRename}
            onDelete={onDelete}
            onPin={onPin}
          />
        </div>
      </aside>
    </>
  );
}
