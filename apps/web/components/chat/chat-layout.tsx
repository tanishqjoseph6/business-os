"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@repo/ui/button";
import { IconMenu } from "@repo/ui/icons";
import { TriangleAlert } from "lucide-react";
import type { ChatConversation, ChatMessage } from "@repo/types";
import type { ChatModelOption } from "@repo/ai";
import type { AiProviderId } from "@repo/ai";
import {
  deleteChatConversationAction,
  loadChatConversationAction,
  listChatConversationsAction,
  pinChatConversationAction,
  renameChatConversationAction,
} from "../../app/(protected)/actions/chat";
import { streamChatRequest } from "../../lib/chat-stream";
import { executeKairosActionRequest } from "../../lib/kairos-actions-client";
import type { KairosActionResponse } from "../../lib/kairos-actions/types";
import { deriveKairosChatState } from "../kairos/use-kairos-state";
import { KairosAvatar } from "../kairos/kairos-avatar";
import { KAIROS_TAGLINE } from "../../lib/kairos";
import { ChatSidebar } from "./chat-sidebar";
import { Composer } from "./composer";
import { EmptyState } from "./empty-state";
import { MessageList } from "./message-list";
import {
  ActionExecutionPanel,
  buildExecutionSteps,
} from "./action-execution-panel";
import {
  timelineToToolActivity,
  type ToolActivity,
} from "./structured-response";

type ChatLayoutProps = {
  initialConversations: ChatConversation[];
  initialConversationId?: string;
  initialMessages: ChatMessage[];
  models: ChatModelOption[];
  initialModel: string;
  initialProvider: AiProviderId;
  initialCreditBalance: number;
  initialPrompt?: string;
  variant?: "page" | "panel";
  streamEndpoint?: string;
};

function createLocalMessage(input: {
  role: ChatMessage["role"];
  content: string;
  conversationId: string;
}): ChatMessage {
  return {
    id: `local-${crypto.randomUUID()}`,
    conversationId: input.conversationId,
    role: input.role,
    content: input.content,
    model: null,
    inputTokens: 0,
    outputTokens: 0,
    createdAt: new Date().toISOString(),
  };
}

type ActionPhase = "thinking" | "executing" | "completed" | "failed" | null;

type ActionTimelineItem = {
  id: string;
  timestamp: string;
  userId: string;
  tool: string;
  status: "completed" | "failed";
  result: string;
};

function summarizeActionResult(result: KairosActionResponse): string {
  if (result.status === "completed") {
    const payload = result.result;
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      try {
        return JSON.stringify(payload, null, 2);
      } catch {
        // fall through
      }
    }
    const body = JSON.stringify(result.result);
    return `${result.action.label} completed via ${result.action.tool}.\n${body.length > 600 ? `${body.slice(0, 600)}…` : body}`;
  }
  if (result.status === "confirmation_required") {
    return `Confirmation required for ${result.action?.label ?? "this action"}.`;
  }
  return result.message;
}

function isLikelyActionCommand(input: string): boolean {
  const text = input.trim().toLowerCase();
  return /^(create|add|update|move|delete|assign|schedule|search|find|lookup|show)\b/.test(text) ||
    /follow[- ]?up email/.test(text) ||
    /^dashboard summary\b/.test(text);
}

export function ChatLayout({
  initialConversations,
  initialConversationId,
  initialMessages,
  models,
  initialModel,
  initialProvider,
  initialCreditBalance,
  initialPrompt,
  variant = "page",
  streamEndpoint = "/api/chat/stream",
}: ChatLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCustomerId = searchParams.get("customerId") ?? undefined;
  const [conversations, setConversations] = React.useState(initialConversations);
  const [activeId, setActiveId] = React.useState<string | undefined>(
    initialConversationId,
  );
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = React.useState(initialPrompt ?? "");
  const [model, setModel] = React.useState(initialModel);
  const [provider, setProvider] = React.useState<AiProviderId>(initialProvider);
  const [creditBalance, setCreditBalance] = React.useState(initialCreditBalance);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [streamingContent, setStreamingContent] = React.useState("");
  const [usageLabel, setUsageLabel] = React.useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isOnline, setIsOnline] = React.useState(true);
  const [lastAttempt, setLastAttempt] = React.useState<{
    message: string;
    conversationId?: string;
    regenerate?: boolean;
  } | null>(null);
  const [kairosPhase, setKairosPhase] = React.useState<"success" | "completed" | null>(null);
  const [actionPhase, setActionPhase] = React.useState<ActionPhase>(null);
  const [actionStatusLabel, setActionStatusLabel] = React.useState<string | null>(null);
  const [actionTimeline, setActionTimeline] = React.useState<ActionTimelineItem[]>([]);
  const [pendingConfirmation, setPendingConfirmation] = React.useState<{
    command: string;
    title: string;
    body: string;
  } | null>(null);
  const [lastToolActivity, setLastToolActivity] = React.useState<ToolActivity[]>(
    [],
  );
  const [lastActionMessageId, setLastActionMessageId] = React.useState<
    string | null
  >(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const searchTimer = React.useRef<number | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const refreshConversations = React.useCallback(async (query?: string) => {
    const result = await listChatConversationsAction({ query });
    if (result.ok) {
      setConversations(result.data.conversations);
    }
  }, []);

  React.useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  React.useEffect(() => {
    if (searchTimer.current) {
      window.clearTimeout(searchTimer.current);
    }
    searchTimer.current = window.setTimeout(() => {
      void refreshConversations(searchQuery || undefined);
    }, 250);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [searchQuery, refreshConversations]);

  React.useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: isStreaming ? "auto" : "smooth",
    });
  }, [messages, streamingContent, isStreaming]);

  async function selectConversation(conversationId: string) {
    setError(null);
    setActiveId(conversationId);
    const result = await loadChatConversationAction({ conversationId });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessages(result.data.messages.filter((m) => m.role !== "system"));
    setModel(result.data.conversation.model);
    setProvider(result.data.conversation.provider);
    setUsageLabel(null);
  }

  function handleNewChat() {
    setActiveId(undefined);
    setMessages([]);
    setDraft("");
    setUsageLabel(null);
    setError(null);
    setActionTimeline([]);
    setActionPhase(null);
    setPendingConfirmation(null);
    setLastToolActivity([]);
    setLastActionMessageId(null);
  }

  async function runKairosAction(input: {
    command: string;
    confirm?: boolean;
  }): Promise<"handled" | "no_match"> {
    setPendingConfirmation(null);
    setActionStatusLabel("Thinking...");
    setActionPhase("thinking");
    setError(null);

    const selectedRecords = selectedCustomerId
      ? [{ type: "customer", id: selectedCustomerId }]
      : undefined;

    setActionPhase("executing");
    setActionStatusLabel("Executing...");

    try {
      const result = await executeKairosActionRequest({
        command: input.command,
        confirm: input.confirm,
        currentRoute: pathname,
        selectedRecords,
      });

      setActionTimeline(result.timeline as ActionTimelineItem[]);

      if (result.status === "no_match") {
        setActionPhase(null);
        setActionStatusLabel(null);
        return "no_match";
      }

      if (!input.confirm) {
        setMessages((prev) => [
          ...prev,
          createLocalMessage({
            role: "user",
            content: input.command,
            conversationId: activeId ?? "kairos-actions",
          }),
        ]);
      }

      if (result.status === "confirmation_required") {
        setActionPhase("failed");
        setActionStatusLabel("Failed");
        setPendingConfirmation({
          command: input.command,
          title: result.confirmation?.title ?? "Confirm action?",
          body: result.confirmation?.body ?? "This action cannot be undone.",
        });
        setError(result.message);
        return "handled";
      }

      if (!result.ok) {
        setActionPhase("failed");
        setActionStatusLabel("Failed");
        setError(result.message);
        return "handled";
      }

      const summary = summarizeActionResult(result);
      const assistantMessage = createLocalMessage({
        role: "assistant",
        content: summary,
        conversationId: activeId ?? "kairos-actions",
      });
      setMessages((prev) => [...prev, assistantMessage]);
      setLastActionMessageId(assistantMessage.id);
      setLastToolActivity(
        timelineToToolActivity(result.timeline as ActionTimelineItem[]),
      );
      setDraft("");
      setKairosPhase("success");
      setActionPhase("completed");
      setActionStatusLabel("Completed");
      window.setTimeout(() => {
        setKairosPhase("completed");
        window.setTimeout(() => setKairosPhase(null), 1200);
      }, 500);
      window.setTimeout(() => {
        setActionPhase(null);
        setActionStatusLabel(null);
      }, 2400);
      return "handled";
    } catch (actionError) {
      setActionPhase("failed");
      setActionStatusLabel("Failed");
      setError(
        actionError instanceof Error ? actionError.message : "Action request failed",
      );
      return "handled";
    }
  }

  async function runStream(input: {
    message: string;
    conversationId?: string;
    regenerate?: boolean;
  }) {
    if (!isOnline) {
      setError("You are offline. Reconnect to continue chatting with Kairos.");
      return;
    }
    setError(null);
    setLastAttempt(input);
    setIsStreaming(true);
    setStreamingContent("");
    setUsageLabel(null);

    const controller = new AbortController();
    abortRef.current = controller;

    let conversationId = input.conversationId;
    let assistantContent = "";

    let streamOk = true;

    if (!input.regenerate) {
      const tempUser = createLocalMessage({
        role: "user",
        content: input.message,
        conversationId: conversationId ?? "pending",
      });
      setMessages((prev) => [...prev, tempUser]);
      setDraft("");
    }

    try {
      await streamChatRequest(
        {
          conversationId,
          message: input.message,
          model,
          provider,
          regenerate: input.regenerate,
          signal: controller.signal,
          endpoint: streamEndpoint,
          kairosContext: {
            currentPage: pathname,
            selectedCustomer: selectedCustomerId
              ? { id: selectedCustomerId }
              : undefined,
            selectedRecords: selectedCustomerId
              ? [{ type: "customer", id: selectedCustomerId }]
              : undefined,
          },
        },
        {
          onEvent(event) {
            if (event.type === "conversation") {
              conversationId = event.conversationId;
              setActiveId(event.conversationId);
            }
            if (event.type === "text_delta") {
              assistantContent += event.text;
              setStreamingContent(assistantContent);
            }
            if (event.type === "usage") {
              setCreditBalance(event.balance);
              setUsageLabel(
                `${event.usage.totalTokens} tokens · ${event.credits} credits`,
              );
            }
            if (event.type === "message") {
              setMessages((prev) => {
                const users = prev.filter(
                  (m) => m.role === "user" && m.id.startsWith("local-"),
                );
                const assistant = createLocalMessage({
                  role: "assistant",
                  content: event.content,
                  conversationId: conversationId ?? "unknown",
                });
                assistant.id = event.messageId;
                const persisted = prev.filter((m) => !m.id.startsWith("local-"));
                return [...persisted, ...users, assistant];
              });
              setStreamingContent("");
            }
            if (event.type === "done" && conversationId) {
              void loadChatConversationAction({ conversationId }).then((result) => {
                if (result.ok) {
                  setMessages(result.data.messages.filter((m) => m.role !== "system"));
                }
              });
            }
            if (event.type === "error") {
              streamOk = false;
              setError(event.message);
            }
          },
        },
      );
      await refreshConversations(searchQuery || undefined);
    } catch (streamError) {
      streamOk = false;
      if (streamError instanceof Error && streamError.name === "AbortError") {
        if (assistantContent) {
          setMessages((prev) => [
            ...prev.filter((m) => !m.id.startsWith("local-")),
            createLocalMessage({
              role: "assistant",
              content: assistantContent,
              conversationId: conversationId ?? "unknown",
            }),
          ]);
        }
      } else {
        setDraft(input.message);
        setError(
          streamError instanceof Error ? streamError.message : "Stream failed",
        );
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      abortRef.current = null;
      if (streamOk) {
        setKairosPhase("success");
        window.setTimeout(() => {
          setKairosPhase("completed");
          window.setTimeout(() => setKairosPhase(null), 1200);
        }, 900);
      }
    }
  }

  async function handleSubmit() {
    const text = draft.trim();
    if (!text || isStreaming || actionPhase === "thinking" || actionPhase === "executing") return;
    setKairosPhase(null);
    if (isLikelyActionCommand(text)) {
      const actionOutcome = await runKairosAction({ command: text });
      if (actionOutcome === "handled") return;
    }
    await runStream({ message: text, conversationId: activeId });
  }

  async function handleSuggestion(text: string) {
    if (!text.trim() || isStreaming || actionPhase === "thinking" || actionPhase === "executing") {
      return;
    }
    setDraft(text);
    setKairosPhase(null);
    if (isLikelyActionCommand(text)) {
      const actionOutcome = await runKairosAction({ command: text });
      if (actionOutcome === "handled") return;
    }
    await runStream({ message: text, conversationId: activeId });
  }

  async function handleSmartAction(prompt: string) {
    setDraft(prompt);
    await handleSuggestion(prompt);
  }

  async function handleRetry() {
    if (!lastAttempt || isStreaming || actionPhase === "thinking" || actionPhase === "executing") return;
    await runStream(lastAttempt);
  }

  async function handleRegenerate() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (
      !lastUser ||
      !activeId ||
      isStreaming ||
      actionPhase === "thinking" ||
      actionPhase === "executing"
    ) {
      return;
    }
    setMessages((prev) => {
      const copy = [...prev];
      if (copy[copy.length - 1]?.role === "assistant") {
        copy.pop();
      }
      return copy;
    });
    await runStream({
      message: lastUser.content,
      conversationId: activeId,
      regenerate: true,
    });
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  async function handleConfirmAction() {
    if (!pendingConfirmation || isStreaming) return;
    setError(null);
    await runKairosAction({
      command: pendingConfirmation.command,
      confirm: true,
    });
  }

  async function handleRename(conversationId: string, title: string) {
    const result = await renameChatConversationAction({ conversationId, title });
    if (result.ok) {
      setConversations((prev) =>
        prev.map((item) =>
          item.id === conversationId ? result.data.conversation : item,
        ),
      );
    }
  }

  async function handleDelete(conversationId: string) {
    const result = await deleteChatConversationAction({ conversationId });
    if (result.ok) {
      setConversations((prev) => prev.filter((item) => item.id !== conversationId));
      if (activeId === conversationId) {
        handleNewChat();
      }
    }
  }

  async function handlePin(conversationId: string, pinned: boolean) {
    const result = await pinChatConversationAction({ conversationId, pinned });
    if (result.ok) {
      await refreshConversations(searchQuery || undefined);
    }
  }

  const kairosState = deriveKairosChatState({
    isStreaming: isStreaming || actionPhase === "thinking" || actionPhase === "executing",
    streamingContent:
      isStreaming || !actionStatusLabel
        ? streamingContent
        : `Kairos ${actionStatusLabel.toLowerCase()}`,
    draft,
    error,
    phase: kairosPhase,
  });

  const executionSteps = buildExecutionSteps({
    phase: actionPhase,
    timeline: actionTimeline,
  });

  const toolActivityByMessageId = lastActionMessageId
    ? { [lastActionMessageId]: lastToolActivity }
    : {};

  return (
    <div
      className={
        variant === "panel"
          ? "flex h-full min-h-0 overflow-hidden"
          : "flex h-full min-h-0 flex-1 overflow-hidden"
      }
    >
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        creditBalance={creditBalance}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewChat={handleNewChat}
        onSelect={selectConversation}
        onRename={handleRename}
        onDelete={handleDelete}
        onPin={handlePin}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        kairosState={kairosState}
        isOnline={isOnline}
      />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.08),transparent_34%),#0b0b10]">
        <header className="flex shrink-0 items-center justify-between border-b border-border/70 bg-[#0f0f15]/80 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <IconMenu />
            </Button>
            <KairosAvatar size="xs" state={kairosState} aria-label="Kairos" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-sm font-semibold text-foreground">
                  {activeId
                    ? conversations.find((c) => c.id === activeId)?.title ?? "Kairos"
                    : "Kairos"}
                </h1>
                <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                  {isOnline ? "Ready" : "Offline"}
                </span>
              </div>
              <p className="truncate text-xs text-muted">
                {usageLabel ?? KAIROS_TAGLINE}
              </p>
            </div>
          </div>
          <p className="hidden text-xs text-muted sm:block">
            {creditBalance.toLocaleString()} credits
          </p>
        </header>

        {!isOnline ? (
          <div className="shrink-0 border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning sm:px-6" role="status">
            You&apos;re offline. Kairos will be ready when your connection returns.
          </div>
        ) : null}
        {error ? (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-error/30 bg-error/10 px-4 py-2 text-sm text-error sm:px-6" role="alert">
            <span>{error}</span>
            {lastAttempt ? (
              <Button type="button" variant="secondary" size="sm" onClick={() => void handleRetry()} disabled={!isOnline || isStreaming}>
                Retry
              </Button>
            ) : null}
          </div>
        ) : null}
        {pendingConfirmation ? (
          <div className="shrink-0 border-b border-warning/30 bg-warning/10 px-4 py-3 sm:px-6">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-4 w-4 text-warning" aria-hidden />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-semibold text-foreground">{pendingConfirmation.title}</p>
                <p className="text-xs text-muted">{pendingConfirmation.body}</p>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={() => void handleConfirmAction()} disabled={isStreaming}>
                    Confirm
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setPendingConfirmation(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {(actionPhase || executionSteps.length > 0) && actionPhase ? (
          <div className="shrink-0">
            <ActionExecutionPanel
              phase={actionPhase}
              steps={executionSteps}
              title={
                actionPhase === "thinking"
                  ? "Kairos is thinking…"
                  : "Kairos is working…"
              }
            />
          </div>
        ) : null}

        <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {messages.length === 0 && !isStreaming && !actionPhase ? (
            <EmptyState
              kairosState={kairosState}
              onSuggestion={(text) => {
                void handleSuggestion(text);
              }}
            />
          ) : (
            <MessageList
              messages={
                isStreaming && streamingContent
                  ? [
                      ...messages,
                      createLocalMessage({
                        role: "assistant",
                        content: streamingContent,
                        conversationId: activeId ?? "pending",
                      }),
                    ]
                  : messages
              }
              streamingContent={streamingContent}
              isStreaming={isStreaming}
              onRegenerate={handleRegenerate}
              kairosState={kairosState}
              toolActivityByMessageId={toolActivityByMessageId}
              onSmartAction={(prompt) => {
                void handleSmartAction(prompt);
              }}
              smartActionsDisabled={
                isStreaming ||
                actionPhase === "thinking" ||
                actionPhase === "executing"
              }
            />
          )}
        </div>

        <div className="shrink-0">
          <Composer
            value={draft}
            onChange={setDraft}
            onSubmit={handleSubmit}
            onStop={handleStop}
            disabled={!isOnline}
            isStreaming={isStreaming}
            models={models}
            model={model}
            provider={provider}
            onModelChange={(nextModel, nextProvider) => {
              setModel(nextModel);
              setProvider(nextProvider);
            }}
          />
        </div>
      </div>
    </div>
  );
}
