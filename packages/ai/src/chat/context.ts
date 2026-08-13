import type { AiGateway } from "../gateway";
import { DEFAULT_SYSTEM_PROMPT } from "../prompts/system";
import type { AiProviderId } from "../types/ai";
import {
  KAIROS_DEFAULT_MODEL,
  KAIROS_DEFAULT_PLAN,
  parseKairosPlanId,
  resolveKairosApiModel,
  type KairosChatModelId,
  type KairosPlanId,
  type KairosResolvedModelId,
} from "./kairos-models";
import { ensureSystemMessage, toAiMessages } from "./messages";
import type { ChatContext } from "./types";

export type BuildChatContextInput = {
  workspaceId: string;
  userId: string;
  conversationId: string;
  model: string;
  provider: AiProviderId;
  workspaceName?: string;
  systemPrompt?: string;
};

export function buildChatContext(input: BuildChatContextInput): ChatContext {
  return {
    workspaceId: input.workspaceId,
    userId: input.userId,
    conversationId: input.conversationId,
    model: input.model,
    provider: input.provider,
  };
}

export function buildChatSystemPrompt(input: {
  workspaceName?: string;
  systemPrompt?: string;
  memoryContext?: string;
}): string {
  const base = input.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT;
  const workspace = input.workspaceName
    ? `\n\nActive workspace: ${input.workspaceName}.`
    : "";
  const memory = input.memoryContext
    ? `\n\nKairos memory context (use as context, never invent missing facts):\n${input.memoryContext}`
    : "";
  return `${base}${workspace}${memory}`;
}

export async function buildGatewayMessages(input: {
  gateway: AiGateway;
  storedMessages: Parameters<typeof toAiMessages>[0];
  systemPrompt: string;
}) {
  const aiMessages = ensureSystemMessage(
    toAiMessages(input.storedMessages),
    input.systemPrompt,
  );
  return aiMessages;
}

export function resolveModelSelection(input: {
  model?: string;
  provider?: AiProviderId;
  message: string;
  fallbackModel?: string;
  fallbackProvider?: AiProviderId;
  plan?: KairosPlanId | null;
}): {
  preference: KairosChatModelId;
  model: KairosResolvedModelId;
  provider: AiProviderId;
  plan: KairosPlanId;
} {
  const plan = parseKairosPlanId(input.plan, KAIROS_DEFAULT_PLAN);
  const resolved = resolveKairosApiModel({
    preference: input.model,
    message: input.message,
    fallbackPreference: input.fallbackModel ?? KAIROS_DEFAULT_MODEL,
    plan,
  });
  return {
    preference: resolved.preference,
    model: resolved.apiModel,
    provider: input.provider ?? resolved.provider ?? input.fallbackProvider ?? "openai",
    plan,
  };
}
