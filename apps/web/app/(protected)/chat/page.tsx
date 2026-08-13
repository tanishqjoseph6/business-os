import { redirect } from "next/navigation";
import { KAIROS_DEFAULT_MODEL, listKairosChatModels } from "@repo/ai";
import { listConversations, listMessages } from "@repo/database/chat";
import { getWorkspaceCredits } from "@repo/database/credits";
import { getWorkspacePlan } from "@repo/database/billing";
import { ChatLayout } from "../../../components/chat/chat-layout";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export const dynamic = "force-dynamic";

type ChatPageProps = {
  searchParams: Promise<{ c?: string; prompt?: string }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const context = await resolveActiveWorkspace();
  if (!context) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const conversationId = params.c;
  const initialPrompt = params.prompt?.trim() || undefined;

  const [conversations, credits, plan] = await Promise.all([
    listConversations({
      workspaceId: context.active.workspace.id,
      userId: context.userId,
    }),
    getWorkspaceCredits({ workspaceId: context.active.workspace.id }),
    getWorkspacePlan({
      workspaceId: context.active.workspace.id,
      userId: context.userId,
    }),
  ]);

  let initialMessages: Awaited<ReturnType<typeof listMessages>> = [];
  let activeConversationId = conversationId;

  if (conversationId) {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (conversation) {
      initialMessages = await listMessages({ conversationId });
    } else {
      activeConversationId = undefined;
    }
  }

  return (
    <ChatLayout
      initialConversations={conversations}
      initialConversationId={activeConversationId}
      initialMessages={initialMessages.filter((m) => m.role !== "system")}
      models={listKairosChatModels()}
      initialModel={KAIROS_DEFAULT_MODEL}
      initialProvider="openai"
      initialCreditBalance={credits.balance}
      plan={plan}
      initialPrompt={initialPrompt}
    />
  );
}
