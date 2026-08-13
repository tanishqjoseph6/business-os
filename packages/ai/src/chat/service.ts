import type { AiGateway } from "../gateway";
import { creditEngine } from "../credits/engine";
import { emptyCost, emptyUsage } from "../utils";
import {
  AiProviderError,
  type AiProviderId,
  type AiStreamChunk,
} from "../types/ai";
import {
  buildChatSystemPrompt,
  buildGatewayMessages,
  resolveModelSelection,
} from "./context";
import { classifyKairosProviderError } from "./kairos-models";
import { truncateForTitle } from "./messages";
import { chatEventsToReadableStream } from "./streaming";
import type { ChatStreamEvent, ChatTurnInput } from "./types";

export type ChatRepository = {
  getConversation: (conversationId: string) => Promise<{
    id: string;
    workspaceId: string;
    userId: string;
    title: string;
    model: string;
    provider: AiProviderId;
  } | null>;
  createConversation: (input: {
    workspaceId: string;
    userId: string;
    title?: string;
    model: string;
    provider: AiProviderId;
  }) => Promise<{ id: string }>;
  updateConversation: (input: {
    conversationId: string;
    title?: string;
    model?: string;
    provider?: AiProviderId;
  }) => Promise<void>;
  listMessages: (conversationId: string) => Promise<
    Array<{
      id: string;
      role: "system" | "user" | "assistant" | "tool";
      content: string;
    }>
  >;
  insertMessage: (input: {
    conversationId: string;
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    model?: string | null;
    inputTokens?: number;
    outputTokens?: number;
  }) => Promise<{ id: string }>;
  deleteLastAssistantMessage: (conversationId: string) => Promise<void>;
};

export type CreditRepository = {
  deduct: (input: {
    workspaceId: string;
    amount: number;
    reason: string;
    metadata?: Record<string, unknown>;
  }) => Promise<{ balance: number }>;
};

export type ChatServiceDeps = {
  gateway: AiGateway;
  chatRepo: ChatRepository;
  creditRepo: CreditRepository;
  workspaceName?: string;
  memoryContext?: string;
};

export function createChatService(deps: ChatServiceDeps) {
  const systemPrompt = buildChatSystemPrompt({
    workspaceName: deps.workspaceName,
    memoryContext: deps.memoryContext,
  });

  async function prepareTurn(input: ChatTurnInput) {
    let conversationId = input.conversationId;
    let conversation:
      | Awaited<ReturnType<ChatRepository["getConversation"]>>
      | null = null;

    if (conversationId) {
      conversation = await deps.chatRepo.getConversation(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      if (
        conversation.workspaceId !== input.workspaceId ||
        conversation.userId !== input.userId
      ) {
        throw new Error("Forbidden");
      }
    }

    const selection = resolveModelSelection({
      model: input.model,
      provider: input.provider,
      message: input.message,
      fallbackModel: conversation?.model ?? "auto",
      fallbackProvider: conversation?.provider ?? "openai",
      plan: input.plan,
    });

    if (!conversationId) {
      const created = await deps.chatRepo.createConversation({
        workspaceId: input.workspaceId,
        userId: input.userId,
        title: truncateForTitle(input.message),
        model: selection.preference,
        provider: selection.provider,
      });
      conversationId = created.id;
    } else if (
      selection.preference !== conversation?.model ||
      selection.provider !== conversation?.provider
    ) {
      await deps.chatRepo.updateConversation({
        conversationId,
        model: selection.preference,
        provider: selection.provider,
      });
    }

    if (input.regenerate) {
      await deps.chatRepo.deleteLastAssistantMessage(conversationId);
    } else {
      await deps.chatRepo.insertMessage({
        conversationId,
        role: "user",
        content: input.message,
      });

      const existingMessages = await deps.chatRepo.listMessages(conversationId);
      const userMessages = existingMessages.filter((m) => m.role === "user");
      if (userMessages.length === 1) {
        await deps.chatRepo.updateConversation({
          conversationId,
          title: truncateForTitle(input.message),
        });
      }
    }

    const storedMessages = await deps.chatRepo.listMessages(conversationId);
    const gatewayMessages = await buildGatewayMessages({
      gateway: deps.gateway,
      storedMessages,
      systemPrompt,
    });

    return {
      conversationId,
      selection,
      gatewayMessages,
    };
  }

  async function finalizeTurn(input: {
    conversationId: string;
    workspaceId: string;
    content: string;
    model: string;
    provider: AiProviderId;
    usage: ReturnType<typeof emptyUsage>;
    cost: ReturnType<typeof emptyCost>;
  }) {

    const assistant = await deps.chatRepo.insertMessage({
      conversationId: input.conversationId,
      role: "assistant",
      content: input.content,
      model: input.model,
      inputTokens: input.usage.inputTokens,
      outputTokens: input.usage.outputTokens,
    });

    const credits = creditEngine.tokensToCredits(input.usage.totalTokens);
    const { balance } = await deps.creditRepo.deduct({
      workspaceId: input.workspaceId,
      amount: credits,
      reason: "ai_chat_completion",
      metadata: creditEngine.buildMetadata({
        totalTokens: input.usage.totalTokens,
        model: input.model,
        provider: input.provider,
        conversationId: input.conversationId,
      }),
    });

    return {
      assistantMessageId: assistant.id,
      usage: input.usage,
      cost: input.cost,
      creditsDeducted: credits,
      creditBalance: balance,
    };
  }

  return {
    async streamTurn(input: ChatTurnInput): Promise<ReadableStream<Uint8Array>> {
      const { conversationId, selection, gatewayMessages } =
        await prepareTurn(input);

      async function* events(): AsyncGenerator<ChatStreamEvent> {
        yield { type: "conversation", conversationId };

        let content = "";
        let usageChunk: AiStreamChunk | undefined;

        try {
          for await (const chunk of deps.gateway.stream({
            messages: gatewayMessages,
            model: selection.model,
            provider: selection.provider,
          })) {
            if (chunk.type === "text_delta" && chunk.text) {
              content += chunk.text;
              yield { type: "text_delta", text: chunk.text };
            }
            if (chunk.type === "usage") {
              usageChunk = chunk;
            }
            if (chunk.type === "done") {
              usageChunk = chunk;
            }
            if (chunk.type === "error") {
              throw new AiProviderError(chunk.error, {
                provider: selection.provider,
                code: "unknown",
              });
            }
          }

          const usage =
            usageChunk?.type === "usage"
              ? usageChunk.usage
              : usageChunk?.type === "done"
                ? usageChunk.response.usage
                : emptyUsage();
          const cost =
            usageChunk?.type === "usage"
              ? usageChunk.cost
              : usageChunk?.type === "done"
                ? usageChunk.response.cost
                : emptyCost();

          const assistant = await deps.chatRepo.insertMessage({
            conversationId,
            role: "assistant",
            content,
            model: selection.model,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
          });

          const credits = creditEngine.tokensToCredits(usage.totalTokens);
          const { balance } = await deps.creditRepo.deduct({
            workspaceId: input.workspaceId,
            amount: credits,
            reason: "ai_chat_completion",
            metadata: creditEngine.buildMetadata({
              totalTokens: usage.totalTokens,
              model: selection.model,
              provider: selection.provider,
              conversationId,
            }),
          });

          yield {
            type: "usage",
            usage,
            cost,
            credits,
            balance,
          };
          yield {
            type: "message",
            messageId: assistant.id,
            role: "assistant",
            content,
          };
          yield { type: "done" };
        } catch (error) {
          const classified = classifyKairosProviderError(error);
          yield {
            type: "error",
            message: classified.message,
            code: classified.code,
          };
        }
      }

      return chatEventsToReadableStream(events());
    },

    async completeTurn(input: ChatTurnInput) {
      const { conversationId, selection, gatewayMessages } =
        await prepareTurn(input);

      const response = await deps.gateway.complete({
        messages: gatewayMessages,
        model: selection.model,
        provider: selection.provider,
      });

      const content =
        typeof response.message.content === "string"
          ? response.message.content
          : response.message.content
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join("\n");

      const result = await finalizeTurn({
        conversationId,
        workspaceId: input.workspaceId,
        content,
        model: response.model,
        provider: response.provider,
        usage: response.usage,
        cost: response.cost,
      });

      return {
        conversationId,
        assistantMessageId: result.assistantMessageId,
        content,
        usage: result.usage,
        cost: result.cost,
        creditsDeducted: result.creditsDeducted,
        creditBalance: result.creditBalance,
      };
    },
  };
}

export { encodeSseEvent, chatEventsToReadableStream, createSseResponse } from "./streaming";
export { listChatModels, groupChatModelsByProvider, createChatGateway } from "./session";
export { truncateForTitle, visibleChatMessages } from "./messages";
export type * from "./types";
