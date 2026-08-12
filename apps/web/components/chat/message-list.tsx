"use client";

import type { ChatMessage } from "@repo/types";
import type { KairosState } from "../../lib/kairos";
import { Message } from "./message";
import { TypingIndicator } from "./typing-indicator";
import type { ToolActivity } from "./structured-response";

type MessageListProps = {
  messages: ChatMessage[];
  streamingContent?: string;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  kairosState?: KairosState;
  toolActivityByMessageId?: Record<string, ToolActivity[]>;
  onSmartAction?: (prompt: string) => void;
  smartActionsDisabled?: boolean;
};

export function MessageList({
  messages,
  streamingContent,
  isStreaming,
  onRegenerate,
  kairosState = "idle",
  toolActivityByMessageId = {},
  onSmartAction,
  smartActionsDisabled,
}: MessageListProps) {
  const visible = messages.filter((message) => message.role !== "system");
  const lastAssistantIndex = [...visible]
    .map((message, index) => ({ message, index }))
    .reverse()
    .find(({ message }) => message.role === "assistant")?.index;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-0 pb-4 pt-2">
      {visible.map((message, index) => {
        const isLastAssistant =
          message.role === "assistant" && index === lastAssistantIndex;
        const showStreaming =
          isStreaming &&
          isLastAssistant &&
          streamingContent !== undefined &&
          message.content !== streamingContent;

        return (
          <Message
            key={message.id}
            message={
              showStreaming
                ? { ...message, content: streamingContent }
                : message
            }
            isStreaming={showStreaming}
            canRegenerate={isLastAssistant && !isStreaming}
            onRegenerate={onRegenerate}
            kairosState={isLastAssistant ? kairosState : "idle"}
            toolActivity={
              isLastAssistant ? toolActivityByMessageId[message.id] : undefined
            }
            onSmartAction={isLastAssistant ? onSmartAction : undefined}
            smartActionsDisabled={smartActionsDisabled}
          />
        );
      })}
      {isStreaming && (!streamingContent || streamingContent.trim().length === 0) ? (
        <div className="px-6 py-4">
          <TypingIndicator />
        </div>
      ) : null}
    </div>
  );
}
