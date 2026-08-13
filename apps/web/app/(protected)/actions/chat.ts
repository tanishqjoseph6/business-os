"use server";

import { getUser } from "@repo/auth/server";
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  listMessages,
  updateConversation,
} from "@repo/database/chat";
import { getWorkspaceCredits } from "@repo/database/credits";
import { getMembershipRole } from "@repo/database/workspace";
import {
  createConversationSchema,
  deleteConversationSchema,
  pinConversationSchema,
  renameConversationSchema,
  searchConversationsSchema,
} from "@repo/types";
import { listKairosChatModels } from "@repo/ai";
import { getWorkspacePlan } from "@repo/database/billing";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export type ChatActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireWorkspaceContext() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const context = await resolveActiveWorkspace();
  if (!context) {
    throw new Error("No active workspace");
  }

  const role = await getMembershipRole(context.active.workspace.id, user.id);
  if (!role) {
    throw new Error("Forbidden");
  }

  return {
    userId: user.id,
    workspaceId: context.active.workspace.id,
    workspaceName: context.active.workspace.name,
  };
}

export async function listChatConversationsAction(
  input: unknown,
): Promise<
  ChatActionResult<{
    conversations: Awaited<ReturnType<typeof listConversations>>;
  }>
> {
  try {
    const ctx = await requireWorkspaceContext();
    const parsed = searchConversationsSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const conversations = await listConversations({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      query: parsed.data.query,
    });

    return { ok: true, data: { conversations } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load conversations",
    };
  }
}

export async function createChatConversationAction(
  input: unknown,
): Promise<ChatActionResult<{ conversation: Awaited<ReturnType<typeof createConversation>> }>> {
  try {
    const ctx = await requireWorkspaceContext();
    const parsed = createConversationSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const conversation = await createConversation({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      title: parsed.data.title,
      model: parsed.data.model,
      provider: parsed.data.provider,
    });

    return { ok: true, data: { conversation } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create conversation",
    };
  }
}

export async function renameChatConversationAction(
  input: unknown,
): Promise<ChatActionResult<{ conversation: Awaited<ReturnType<typeof updateConversation>> }>> {
  try {
    const ctx = await requireWorkspaceContext();
    const parsed = renameConversationSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const existing = await getConversation({ conversationId: parsed.data.conversationId });
    if (!existing || existing.userId !== ctx.userId) {
      return { ok: false, error: "Conversation not found" };
    }

    const conversation = await updateConversation({
      conversationId: parsed.data.conversationId,
      title: parsed.data.title,
    });

    return { ok: true, data: { conversation } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to rename conversation",
    };
  }
}

export async function pinChatConversationAction(
  input: unknown,
): Promise<ChatActionResult<{ conversation: Awaited<ReturnType<typeof updateConversation>> }>> {
  try {
    const ctx = await requireWorkspaceContext();
    const parsed = pinConversationSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const existing = await getConversation({ conversationId: parsed.data.conversationId });
    if (!existing || existing.userId !== ctx.userId) {
      return { ok: false, error: "Conversation not found" };
    }

    const conversation = await updateConversation({
      conversationId: parsed.data.conversationId,
      pinned: parsed.data.pinned,
    });

    return { ok: true, data: { conversation } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update conversation",
    };
  }
}

export async function deleteChatConversationAction(
  input: unknown,
): Promise<ChatActionResult<{ deleted: true }>> {
  try {
    const ctx = await requireWorkspaceContext();
    const parsed = deleteConversationSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const existing = await getConversation({ conversationId: parsed.data.conversationId });
    if (!existing || existing.userId !== ctx.userId) {
      return { ok: false, error: "Conversation not found" };
    }

    await deleteConversation({ conversationId: parsed.data.conversationId });
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to delete conversation",
    };
  }
}

export async function loadChatConversationAction(input: {
  conversationId: string;
}): Promise<
  ChatActionResult<{
    conversation: NonNullable<Awaited<ReturnType<typeof getConversation>>>;
    messages: Awaited<ReturnType<typeof listMessages>>;
  }>
> {
  try {
    const ctx = await requireWorkspaceContext();
    const conversation = await getConversation({ conversationId: input.conversationId });
    if (
      !conversation ||
      conversation.userId !== ctx.userId ||
      conversation.workspaceId !== ctx.workspaceId
    ) {
      return { ok: false, error: "Conversation not found" };
    }

    const messages = await listMessages({ conversationId: input.conversationId });
    return { ok: true, data: { conversation, messages } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load conversation",
    };
  }
}

export async function getChatBootstrapAction(): Promise<
  ChatActionResult<{
    models: ReturnType<typeof listKairosChatModels>;
    credits: Awaited<ReturnType<typeof getWorkspaceCredits>>;
    plan: Awaited<ReturnType<typeof getWorkspacePlan>>;
  }>
> {
  try {
    const ctx = await requireWorkspaceContext();
    const [credits, plan] = await Promise.all([
      getWorkspaceCredits({ workspaceId: ctx.workspaceId }),
      getWorkspacePlan({ workspaceId: ctx.workspaceId, userId: ctx.userId }),
    ]);
    return {
      ok: true,
      data: {
        models: listKairosChatModels(),
        credits,
        plan,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load chat settings",
    };
  }
}
