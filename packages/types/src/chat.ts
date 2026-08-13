import { z } from "zod";

export type ChatProviderId = "openai" | "anthropic" | "gemini" | "groq";
export type ChatMessageRole = "system" | "user" | "assistant" | "tool";

export type ChatAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url?: string;
};

export type ChatConversation = {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  model: string;
  provider: ChatProviderId;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  role: ChatMessageRole;
  content: string;
  model: string | null;
  inputTokens: number;
  outputTokens: number;
  createdAt: string;
  attachments?: ChatAttachment[];
};

export type Conversation = ChatConversation;
export type Message = ChatMessage;
export type Attachment = ChatAttachment;

export type WorkspaceCredits = {
  workspaceId: string;
  balance: number;
  updatedAt: string;
};

export type CreditTransaction = {
  id: string;
  workspaceId: string;
  userId: string;
  amount: number;
  reason: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export const chatProviderSchema = z.enum(["openai", "anthropic", "gemini", "groq"]);

export const createConversationSchema = z.object({
  title: z.string().trim().max(120).optional(),
  model: z.string().min(1).optional(),
  provider: chatProviderSchema.optional(),
});

export const renameConversationSchema = z.object({
  conversationId: z.string().uuid(),
  title: z.string().trim().min(1).max(120),
});

export const kairosChatModelSchema = z.enum([
  "auto",
  "gpt-5.1",
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
]);

export const chatStreamRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(32000),
  model: kairosChatModelSchema.optional(),
  provider: chatProviderSchema.optional(),
  regenerate: z.boolean().optional(),
  kairosContext: z
    .object({
      currentPage: z.string().max(500).optional(),
      selectedCustomer: z
        .object({
          id: z.string().max(200),
          name: z.string().max(200).optional(),
          email: z.string().email().max(320).optional(),
        })
        .optional(),
      selectedRecords: z
        .array(
          z.object({
            type: z.string().max(80),
            id: z.string().max(200),
            label: z.string().max(200).optional(),
          }),
        )
        .max(10)
        .optional(),
    })
    .optional(),
});

export const pinConversationSchema = z.object({
  conversationId: z.string().uuid(),
  pinned: z.boolean(),
});

export const deleteConversationSchema = z.object({
  conversationId: z.string().uuid(),
});

export const searchConversationsSchema = z.object({
  query: z.string().trim().max(120).optional(),
});
