import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ChatConversation,
  ChatMessage,
  ChatProviderId,
  Database,
} from "@repo/types";
import { createServerClient } from "./server";

type ConversationRow = Database["public"]["Tables"]["ai_conversations"]["Row"];
type MessageRow = Database["public"]["Tables"]["ai_messages"]["Row"];

function mapConversation(row: ConversationRow): ChatConversation {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    title: row.title,
    model: row.model,
    provider: row.provider as ChatProviderId,
    pinned: row.pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role as ChatMessage["role"],
    content: row.content,
    model: row.model,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    createdAt: row.created_at,
  };
}

export async function listConversations(input: {
  workspaceId: string;
  userId: string;
  query?: string;
  client?: SupabaseClient<Database>;
}): Promise<ChatConversation[]> {
  const supabase = input.client ?? (await createServerClient());
  let builder = supabase
    .from("ai_conversations")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", input.userId)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (input.query) {
    builder = builder.ilike("title", `%${input.query}%`);
  }

  const { data, error } = await builder;
  if (error) {
    throw new Error(`Failed to list conversations: ${error.message}`);
  }

  return (data ?? []).map(mapConversation);
}

export async function getConversation(input: {
  conversationId: string;
  client?: SupabaseClient<Database>;
}): Promise<ChatConversation | null> {
  const supabase = input.client ?? (await createServerClient());
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("id", input.conversationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load conversation: ${error.message}`);
  }

  return data ? mapConversation(data) : null;
}

export async function createConversation(input: {
  workspaceId: string;
  userId: string;
  title?: string;
  model?: string;
  provider?: ChatProviderId;
  client?: SupabaseClient<Database>;
}): Promise<ChatConversation> {
  const supabase = input.client ?? (await createServerClient());
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({
      workspace_id: input.workspaceId,
      user_id: input.userId,
      title: input.title ?? "New chat",
      model: input.model ?? "auto",
      provider: input.provider ?? "openai",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create conversation: ${error?.message ?? "Unknown"}`);
  }

  return mapConversation(data);
}

export async function updateConversation(input: {
  conversationId: string;
  title?: string;
  model?: string;
  provider?: ChatProviderId;
  pinned?: boolean;
  client?: SupabaseClient<Database>;
}): Promise<ChatConversation> {
  const supabase = input.client ?? (await createServerClient());
  const patch: Database["public"]["Tables"]["ai_conversations"]["Update"] = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.model !== undefined) patch.model = input.model;
  if (input.provider !== undefined) patch.provider = input.provider;
  if (input.pinned !== undefined) patch.pinned = input.pinned;

  const { data, error } = await supabase
    .from("ai_conversations")
    .update(patch)
    .eq("id", input.conversationId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update conversation: ${error?.message ?? "Unknown"}`);
  }

  return mapConversation(data);
}

export async function deleteConversation(input: {
  conversationId: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = input.client ?? (await createServerClient());
  const { error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("id", input.conversationId);

  if (error) {
    throw new Error(`Failed to delete conversation: ${error.message}`);
  }
}

export async function listMessages(input: {
  conversationId: string;
  client?: SupabaseClient<Database>;
}): Promise<ChatMessage[]> {
  const supabase = input.client ?? (await createServerClient());
  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", input.conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list messages: ${error.message}`);
  }

  return (data ?? []).map(mapMessage);
}

export async function insertMessage(input: {
  conversationId: string;
  role: ChatMessage["role"];
  content: string;
  model?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  client?: SupabaseClient<Database>;
}): Promise<ChatMessage> {
  const supabase = input.client ?? (await createServerClient());
  const { data, error } = await supabase
    .from("ai_messages")
    .insert({
      conversation_id: input.conversationId,
      role: input.role,
      content: input.content,
      model: input.model ?? null,
      input_tokens: input.inputTokens ?? 0,
      output_tokens: input.outputTokens ?? 0,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert message: ${error?.message ?? "Unknown"}`);
  }

  await supabase
    .from("ai_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.conversationId);

  return mapMessage(data);
}

export async function deleteLastAssistantMessage(input: {
  conversationId: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = input.client ?? (await createServerClient());
  const { data, error } = await supabase
    .from("ai_messages")
    .select("id, role")
    .eq("conversation_id", input.conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to find last message: ${error.message}`);
  }

  if (!data || data.role !== "assistant") {
    return;
  }

  const { error: deleteError } = await supabase
    .from("ai_messages")
    .delete()
    .eq("id", data.id);

  if (deleteError) {
    throw new Error(`Failed to delete assistant message: ${deleteError.message}`);
  }
}

export async function touchConversation(input: {
  conversationId: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = input.client ?? (await createServerClient());
  await supabase
    .from("ai_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.conversationId);
}

export function chatMessagesToAiMessages(
  messages: ChatMessage[],
): Array<{ role: "system" | "user" | "assistant" | "tool"; content: string }> {
  return messages
    .filter((message) => message.role !== "tool" || message.content.length > 0)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

export async function generateConversationTitle(input: {
  firstMessage: string;
}): Promise<string> {
  const trimmed = input.firstMessage.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 48) {
    return trimmed || "New chat";
  }
  return `${trimmed.slice(0, 45)}…`;
}
