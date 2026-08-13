import type { AiProviderId, AiUsage, AiCost } from "../types/ai";

export type ChatStreamEvent =
  | { type: "conversation"; conversationId: string }
  | { type: "text_delta"; text: string }
  | { type: "usage"; usage: AiUsage; cost: AiCost; credits: number; balance: number }
  | { type: "message"; messageId: string; role: "assistant"; content: string }
  | {
      type: "error";
      message: string;
      code?: "model_unavailable" | "rate_limited" | "upgrade_required" | "generic";
    }
  | { type: "done" };

export type ChatContext = {
  workspaceId: string;
  userId: string;
  conversationId: string;
  model: string;
  provider: AiProviderId;
};

export type ChatTurnInput = {
  workspaceId: string;
  userId: string;
  conversationId?: string;
  message: string;
  model?: string;
  provider?: AiProviderId;
  /** Server-resolved billing plan. Defaults to free if omitted. */
  plan?: "free" | "pro" | "business";
  regenerate?: boolean;
  kairosContext?: {
    currentPage?: string;
    selectedCustomer?: {
      id: string;
      name?: string;
      email?: string;
    };
    selectedRecords?: Array<{
      type: string;
      id: string;
      label?: string;
    }>;
  };
};

export type ChatTurnResult = {
  conversationId: string;
  assistantMessageId: string;
  content: string;
  usage: AiUsage;
  cost: AiCost;
  creditsDeducted: number;
  creditBalance: number;
};

export type ChatModelOption = {
  id: string;
  provider: AiProviderId;
  model: string;
  label: string;
};
