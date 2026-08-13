import type { ChatStreamEvent } from "@repo/ai";
import type { KairosCustomerContext, KairosSelectedRecord } from "@repo/types";

export type StreamChatInput = {
  conversationId?: string;
  message: string;
  model?: string;
  provider?: string;
  regenerate?: boolean;
  signal?: AbortSignal;
  endpoint?: string;
  kairosContext?: {
    currentPage?: string;
    selectedCustomer?: KairosCustomerContext;
    selectedRecords?: KairosSelectedRecord[];
  };
};

export type StreamChatCallbacks = {
  onEvent: (event: ChatStreamEvent) => void;
};

export type StreamChatHttpErrorPayload = {
  error?: string;
  code?: string;
  requiredPlan?: string;
};

export class ChatStreamRequestError extends Error {
  status: number;
  code?: string;
  requiredPlan?: string;

  constructor(message: string, status: number, code?: string, requiredPlan?: string) {
    super(message);
    this.name = "ChatStreamRequestError";
    this.status = status;
    this.code = code;
    this.requiredPlan = requiredPlan;
  }
}

export async function streamChatRequest(
  input: StreamChatInput,
  callbacks: StreamChatCallbacks,
): Promise<void> {
  const endpoint = input.endpoint ?? "/api/chat/stream";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId: input.conversationId,
      message: input.message,
      model: input.model,
      provider: input.provider,
      regenerate: input.regenerate,
      kairosContext: input.kairosContext,
    }),
    signal: input.signal,
  });

  if (!response.ok) {
    let message = "Chat request failed";
    let code: string | undefined;
    let requiredPlan: string | undefined;
    try {
      const payload = (await response.json()) as StreamChatHttpErrorPayload;
      message = payload.error ?? message;
      code = payload.code;
      requiredPlan = payload.requiredPlan;
    } catch {
      // ignore
    }
    throw new ChatStreamRequestError(message, response.status, code, requiredPlan);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response stream");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      const json = line.slice(5).trim();
      if (!json) continue;
      try {
        const event = JSON.parse(json) as ChatStreamEvent;
        callbacks.onEvent(event);
      } catch {
        // ignore malformed chunks
      }
    }
  }
}
