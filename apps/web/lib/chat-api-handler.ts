import { getUser } from "@repo/auth/server";
import { consumeRateLimit } from "@repo/auth/rate-limit";
import {
  createChatService,
  createChatGateway,
  createSseResponse,
  type ChatRepository,
  type CreditRepository,
} from "@repo/ai";
import {
  createConversation,
  deleteLastAssistantMessage,
  getConversation,
  insertMessage,
  listMessages,
  updateConversation,
} from "@repo/database/chat";
import { deductWorkspaceCredits } from "@repo/database/credits";
import { getMembershipRole } from "@repo/database/workspace";
import {
  getKairosMemoryContext,
  rememberKairosSessionContext,
} from "@repo/database";
import { getWorkspacePlan } from "@repo/database/billing";
import { authorizeKairosChatModel } from "@repo/ai/chat/kairos-models";
import { chatStreamRequestSchema } from "@repo/types";
import type { WorkspaceMembership } from "@repo/types";
import { resolveActiveWorkspace } from "./workspace-context";
import {
  buildKairosContext,
} from "./kairos-context-engine";

const chatRepo: ChatRepository = {
  async getConversation(conversationId) {
    const conversation = await getConversation({ conversationId });
    if (!conversation) return null;
    return {
      id: conversation.id,
      workspaceId: conversation.workspaceId,
      userId: conversation.userId,
      title: conversation.title,
      model: conversation.model,
      provider: conversation.provider,
    };
  },
  async createConversation(input) {
    const conversation = await createConversation(input);
    return { id: conversation.id };
  },
  async updateConversation(input) {
    await updateConversation(input);
  },
  async listMessages(conversationId) {
    const messages = await listMessages({ conversationId });
    return messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
    }));
  },
  async insertMessage(input) {
    const message = await insertMessage(input);
    return { id: message.id };
  },
  async deleteLastAssistantMessage(conversationId) {
    await deleteLastAssistantMessage({ conversationId });
  },
};

const creditRepo: CreditRepository = {
  async deduct(input) {
    return deductWorkspaceCredits(input);
  },
};

export type ChatApiDependencies = {
  gateway: ReturnType<typeof createChatGateway>;
  chatRepo: ChatRepository;
  creditRepo: CreditRepository;
};

export const defaultChatApiDependencies: ChatApiDependencies = {
  gateway: createChatGateway(),
  chatRepo,
  creditRepo,
};

function providerConfigured(): boolean {
  return Boolean(
    process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GROQ_API_KEY,
  );
}

export async function handleChatStreamRequest(
  request: Request,
  dependencies: ChatApiDependencies = defaultChatApiDependencies,
) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = consumeRateLimit(`ai:${user.id}`, 30, 60_000);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Too many AI requests. Please try again shortly." },
      {
        status: 429,
        headers: { "retry-after": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const context = await resolveActiveWorkspace();
  if (!context) {
    return Response.json({ error: "No active workspace" }, { status: 403 });
  }

  const role = await getMembershipRole(context.active.workspace.id, user.id);
  if (!role) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = chatStreamRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const plan = await getWorkspacePlan({
    workspaceId: context.active.workspace.id,
    userId: user.id,
  });
  const authorized = authorizeKairosChatModel(plan, parsed.data.model);
  if (!authorized.ok) {
    return Response.json(
      {
        error: authorized.message,
        code: authorized.code,
        requiredPlan: authorized.requiredPlan,
      },
      { status: 403 },
    );
  }

  if (!providerConfigured()) {
    return Response.json(
      {
        error:
          "Kairos AI is not configured yet. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to enable responses.",
        code: "provider_not_configured",
      },
      { status: 503 },
    );
  }

  const chat = createChatService({
    gateway: dependencies.gateway,
    chatRepo: dependencies.chatRepo,
    creditRepo: dependencies.creditRepo,
    workspaceName: context.active.workspace.name,
    memoryContext: await buildMemoryContext({
      workspaceId: context.active.workspace.id,
      userId: user.id,
      workspaceName: context.active.workspace.name,
      currentPage: parsed.data.kairosContext?.currentPage,
      selectedCustomer: parsed.data.kairosContext?.selectedCustomer,
      selectedRecords: parsed.data.kairosContext?.selectedRecords,
      memberships: context.memberships,
      workspace: context.active,
      email: context.email,
    }),
  });

  try {
    const stream = await chat.streamTurn({
      workspaceId: context.active.workspace.id,
      userId: user.id,
      conversationId: parsed.data.conversationId,
      message: parsed.data.message,
      model: authorized.model,
      provider: parsed.data.provider,
      plan,
      regenerate: parsed.data.regenerate,
      kairosContext: parsed.data.kairosContext,
    });

    return createSseResponse(stream);
  } catch (error) {
    console.error("[chat.stream]", {
      userId: user.id,
      workspaceId: context.active.workspace.id,
      error: error instanceof Error ? error.message : "unknown error",
    });
    return Response.json(
      { error: "Chat failed. Please try again." },
      { status: 500 },
    );
  }
}

async function buildMemoryContext(input: {
  workspaceId: string;
  userId: string;
  workspaceName: string;
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
  memberships: WorkspaceMembership[];
  workspace: WorkspaceMembership;
  email: string | null;
}): Promise<string | undefined> {
  try {
    const [memory, appContext] = await Promise.all([
      (async () => {
        await rememberKairosSessionContext(input);
        return getKairosMemoryContext(input);
      })(),
      buildKairosContext({
        userId: input.userId,
        userEmail: input.email,
        workspace: input.workspace,
        memberships: input.memberships,
        currentRoute: input.currentPage,
        selectedRecords: input.selectedRecords,
      }),
    ]);
    return JSON.stringify({
      memory,
      contextEngine: appContext,
    });
  } catch (error) {
    // Memory is an enhancement; a database/migration issue must not prevent chat.
    console.warn("[kairos.memory] unavailable", {
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}
