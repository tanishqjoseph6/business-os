import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  GmailSuggestedAction,
  GmailSyncProgress,
  InboxAccount,
  InboxAccountSecrets,
  InboxLabel,
  InboxMessage,
  InboxParticipant,
  InboxThread,
  InboxThreadStatus,
  Json,
} from "@repo/types";
import { createServerClient } from "./server";
import { createAdminClient } from "./admin";
import {
  decryptIntegrationSecret,
  encryptIntegrationSecret,
} from "./token-encryption";
import {
  listInboxAccounts,
  parseEmailThreadSummary,
  parseParticipants,
} from "./inbox";

type AccountRow = Database["public"]["Tables"]["inbox_accounts"]["Row"];
type ThreadRow = Database["public"]["Tables"]["inbox_threads"]["Row"];

async function clientOrDefault(client?: SupabaseClient<Database>) {
  return client ?? (await createServerClient());
}

function metadataToRecord(json: Json): Record<string, unknown> {
  if (typeof json === "object" && json !== null && !Array.isArray(json)) {
    return json as Record<string, unknown>;
  }
  return {};
}

const SYNC_PROGRESS_KEY = "syncProgress";

function isSyncProgress(value: unknown): value is GmailSyncProgress {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.jobId === "string" &&
    typeof record.status === "string" &&
    typeof record.phase === "string"
  );
}

export function parseGmailSyncProgress(
  metadata: Record<string, unknown>,
): GmailSyncProgress | null {
  const raw = metadata[SYNC_PROGRESS_KEY];
  return isSyncProgress(raw) ? raw : null;
}

export async function updateGmailSyncProgress(input: {
  workspaceId: string;
  accountId: string;
  progress: GmailSyncProgress;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { data: row, error: loadError } = await supabase
    .from("inbox_accounts")
    .select("metadata")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.accountId)
    .maybeSingle();
  if (loadError) {
    throw new Error(`Failed to load Gmail account metadata: ${loadError.message}`);
  }
  if (!row) {
    throw new Error("Gmail account not found");
  }

  const metadata = metadataToRecord(row.metadata);
  metadata[SYNC_PROGRESS_KEY] = input.progress as unknown as Json;

  const { error } = await supabase
    .from("inbox_accounts")
    .update({ metadata: metadata as Json })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.accountId);
  if (error) {
    throw new Error(`Failed to update Gmail sync progress: ${error.message}`);
  }
}

export async function getGmailSyncProgress(input: {
  workspaceId: string;
  accountId: string;
  client?: SupabaseClient<Database>;
}): Promise<GmailSyncProgress | null> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("inbox_accounts")
    .select("metadata, status, sync_error, last_synced_at, history_id")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.accountId)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load Gmail sync progress: ${error.message}`);
  }
  if (!data) return null;
  const progress = parseGmailSyncProgress(metadataToRecord(data.metadata));
  if (!progress) return null;
  return {
    ...progress,
    historyId: progress.historyId ?? data.history_id ?? null,
  };
}

function decryptStoredToken(stored: string | null): string | null {
  if (!stored) return null;
  if (stored.startsWith("vb1.")) {
    return decryptIntegrationSecret(stored);
  }
  return stored;
}

function encryptStoredToken(plaintext: string | null): string | null {
  if (!plaintext) return null;
  if (plaintext.startsWith("vb1.")) return plaintext;
  return encryptIntegrationSecret(plaintext);
}

function mapSecrets(row: AccountRow): InboxAccountSecrets {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    provider: row.provider,
    email: row.email,
    displayName: row.display_name,
    accessToken: decryptStoredToken(row.access_token),
    refreshToken: decryptStoredToken(row.refresh_token),
    tokenExpiresAt: row.token_expires_at,
    scopes: row.scopes,
    status: row.status,
    lastSyncedAt: row.last_synced_at,
    historyId: row.history_id ?? null,
    syncError: row.sync_error ?? null,
    metadata: metadataToRecord(row.metadata),
    createdBy: row.created_by,
  };
}

function participantsToJson(participants: InboxParticipant[]): Json {
  return participants as unknown as Json;
}

export async function getInboxAccountSecrets(input: {
  workspaceId: string;
  accountId: string;
  client?: SupabaseClient<Database>;
}): Promise<InboxAccountSecrets | null> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("inbox_accounts")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.accountId)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load inbox account secrets: ${error.message}`);
  }
  return data ? mapSecrets(data) : null;
}

/**
 * Load OAuth secrets with the service role — used by sync/refresh so token
 * reads are not blocked by the caller's session or RLS edge cases.
 */
export async function getInboxAccountSecretsForSync(input: {
  workspaceId: string;
  accountId: string;
}): Promise<InboxAccountSecrets | null> {
  const admin = createAdminClient();
  const account = await getInboxAccountSecrets({
    workspaceId: input.workspaceId,
    accountId: input.accountId,
    client: admin,
  });
  if (account) {
    console.info("[gmail.tokens] loaded account for sync", {
      accountId: account.id,
      email: account.email,
      hasAccessToken: Boolean(account.accessToken),
      hasRefreshToken: Boolean(account.refreshToken),
      tokenExpiresAt: account.tokenExpiresAt,
      scopes: account.scopes,
      status: account.status,
    });
  }
  return account;
}

export async function listGmailAccountSecrets(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<InboxAccountSecrets[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("inbox_accounts")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("provider", "gmail")
    .in("status", ["connected", "syncing", "error"])
    .order("updated_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to list Gmail accounts: ${error.message}`);
  }
  return (data ?? []).map(mapSecrets);
}

export async function upsertGmailAccountTokens(input: {
  workspaceId: string;
  userId: string;
  email: string;
  displayName?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  tokenExpiresAt: string;
  scopes: string[];
  historyId?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<InboxAccountSecrets> {
  const supabase = await clientOrDefault(input.client);
  const { data: existing } = await supabase
    .from("inbox_accounts")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("provider", "gmail")
    .eq("email", input.email)
    .maybeSingle();

  // Reconnect after partial sync: keep refresh token if Google omits it,
  // preserve history cursor + metadata, clear stuck syncing/error state.
  const refreshToken =
    input.refreshToken ??
    decryptStoredToken(existing?.refresh_token ?? null) ??
    null;
  const existingMetadata = metadataToRecord(existing?.metadata ?? {});
  const priorProgress = parseGmailSyncProgress(existingMetadata);
  if (priorProgress && priorProgress.status === "running") {
    existingMetadata.syncProgress = {
      ...priorProgress,
      status: "idle",
      phase: "done",
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      currentThreadSubject: null,
    };
  }

  const { data, error } = await supabase
    .from("inbox_accounts")
    .upsert(
      {
        workspace_id: input.workspaceId,
        created_by: existing?.created_by ?? input.userId,
        provider: "gmail",
        email: input.email,
        display_name: input.displayName ?? existing?.display_name ?? null,
        access_token: encryptStoredToken(input.accessToken),
        refresh_token: encryptStoredToken(refreshToken),
        token_expires_at: input.tokenExpiresAt,
        scopes: input.scopes.length ? input.scopes : (existing?.scopes ?? []),
        status: "connected",
        sync_error: null,
        history_id: input.historyId ?? existing?.history_id ?? null,
        last_synced_at: existing?.last_synced_at ?? null,
        metadata: existingMetadata as Json,
      },
      { onConflict: "workspace_id,provider,email" },
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to upsert Gmail account tokens: ${error?.message ?? "Unknown"}`,
    );
  }
  console.info("[gmail.tokens] upserted account", {
    accountId: data.id,
    email: data.email,
    reconnect: Boolean(existing),
    hasRefreshToken: Boolean(data.refresh_token),
    historyId: data.history_id,
    status: data.status,
  });
  return mapSecrets(data);
}

export async function updateGmailAccountTokens(input: {
  workspaceId: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string | null;
  tokenExpiresAt: string;
  scopes?: string[];
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = input.client ?? createAdminClient();
  const patch: Database["public"]["Tables"]["inbox_accounts"]["Update"] = {
    access_token: encryptStoredToken(input.accessToken),
    token_expires_at: input.tokenExpiresAt,
    status: "connected",
    sync_error: null,
  };
  if (input.refreshToken !== undefined) {
    patch.refresh_token = encryptStoredToken(input.refreshToken);
  }
  if (input.scopes) patch.scopes = input.scopes;

  const { error } = await supabase
    .from("inbox_accounts")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.accountId);
  if (error) {
    throw new Error(`Failed to update Gmail tokens: ${error.message}`);
  }
}

export async function setGmailAccountSyncState(input: {
  workspaceId: string;
  accountId: string;
  status: "connected" | "syncing" | "error" | "disconnected";
  historyId?: string | null;
  syncError?: string | null;
  lastSyncedAt?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["inbox_accounts"]["Update"] = {
    status: input.status,
  };
  if (input.historyId !== undefined) patch.history_id = input.historyId;
  if (input.syncError !== undefined) patch.sync_error = input.syncError;
  if (input.lastSyncedAt !== undefined) {
    patch.last_synced_at = input.lastSyncedAt;
  }
  const { error } = await supabase
    .from("inbox_accounts")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.accountId);
  if (error) {
    throw new Error(`Failed to update Gmail sync state: ${error.message}`);
  }
}

export async function upsertGmailLabel(input: {
  workspaceId: string;
  accountId: string;
  externalId: string;
  name: string;
  color?: string;
  client?: SupabaseClient<Database>;
}): Promise<InboxLabel> {
  const supabase = await clientOrDefault(input.client);
  const { data: existing } = await supabase
    .from("inbox_labels")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("account_id", input.accountId)
    .eq("external_id", input.externalId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("inbox_labels")
      .update({ name: input.name, color: input.color ?? existing.color })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(`Failed to update Gmail label: ${error?.message ?? "Unknown"}`);
    }
    return {
      id: data.id,
      workspaceId: data.workspace_id,
      accountId: data.account_id,
      name: data.name,
      color: data.color,
      externalId: data.external_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  const { data, error } = await supabase
    .from("inbox_labels")
    .insert({
      workspace_id: input.workspaceId,
      account_id: input.accountId,
      external_id: input.externalId,
      name: input.name,
      color: input.color ?? "#F97316",
    })
    .select("*")
    .single();
  if (error || !data) {
    // Name unique per workspace — fall back to name match for system labels.
    const { data: byName } = await supabase
      .from("inbox_labels")
      .select("*")
      .eq("workspace_id", input.workspaceId)
      .eq("name", input.name)
      .maybeSingle();
    if (byName) {
      const { data: updated, error: updateError } = await supabase
        .from("inbox_labels")
        .update({
          account_id: input.accountId,
          external_id: input.externalId,
        })
        .eq("id", byName.id)
        .select("*")
        .single();
      if (updateError || !updated) {
        throw new Error(
          `Failed to upsert Gmail label: ${updateError?.message ?? error.message}`,
        );
      }
      return {
        id: updated.id,
        workspaceId: updated.workspace_id,
        accountId: updated.account_id,
        name: updated.name,
        color: updated.color,
        externalId: updated.external_id,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      };
    }
    throw new Error(`Failed to create Gmail label: ${error.message}`);
  }
  return {
    id: data.id,
    workspaceId: data.workspace_id,
    accountId: data.account_id,
    name: data.name,
    color: data.color,
    externalId: data.external_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function upsertGmailThread(input: {
  workspaceId: string;
  accountId: string;
  externalId: string;
  subject: string;
  snippet: string;
  participants: InboxParticipant[];
  status: InboxThreadStatus;
  isUnread: boolean;
  isStarred: boolean;
  messageCount: number;
  hasAttachments: boolean;
  lastMessageAt: string;
  contactId?: string | null;
  companyId?: string | null;
  aiPriority?: string | null;
  aiClassification?: string | null;
  aiSuggestedActions?: GmailSuggestedAction[];
  client?: SupabaseClient<Database>;
}): Promise<InboxThread> {
  const supabase = await clientOrDefault(input.client);
  const { data: existing } = await supabase
    .from("inbox_threads")
    .select("*")
    .eq("account_id", input.accountId)
    .eq("external_id", input.externalId)
    .maybeSingle();

  const patch = {
    workspace_id: input.workspaceId,
    account_id: input.accountId,
    external_id: input.externalId,
    subject: input.subject,
    snippet: input.snippet,
    participants: participantsToJson(input.participants),
    status: input.status,
    is_unread: input.isUnread,
    is_starred: input.isStarred,
    message_count: input.messageCount,
    has_attachments: input.hasAttachments,
    last_message_at: input.lastMessageAt,
    contact_id:
      input.contactId !== undefined
        ? input.contactId
        : existing?.contact_id ?? null,
    company_id:
      input.companyId !== undefined
        ? input.companyId
        : existing?.company_id ?? null,
    ai_priority:
      input.aiPriority !== undefined
        ? input.aiPriority
        : existing?.ai_priority ?? null,
    ai_classification:
      input.aiClassification !== undefined
        ? input.aiClassification
        : existing?.ai_classification ?? null,
    ai_suggested_actions: (input.aiSuggestedActions ??
      existing?.ai_suggested_actions ??
      []) as unknown as Json,
  };

  let row: ThreadRow;
  if (existing) {
    const { data, error } = await supabase
      .from("inbox_threads")
      .update(patch)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(`Failed to update Gmail thread: ${error?.message ?? "Unknown"}`);
    }
    row = data;
  } else {
    const { data, error } = await supabase
      .from("inbox_threads")
      .insert(patch)
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(`Failed to insert Gmail thread: ${error?.message ?? "Unknown"}`);
    }
    row = data;
  }

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    accountId: row.account_id,
    externalId: row.external_id,
    subject: row.subject,
    snippet: row.snippet,
    participants: parseParticipants(row.participants),
    status: row.status,
    isUnread: row.is_unread,
    isStarred: row.is_starred,
    messageCount: row.message_count,
    hasAttachments: row.has_attachments,
    lastMessageAt: row.last_message_at,
    contactId: row.contact_id,
    companyId: row.company_id,
    aiSummary: row.ai_summary,
    aiSummaryStructured: parseEmailThreadSummary(row.ai_summary_structured),
    aiPriority: row.ai_priority ?? null,
    aiClassification: row.ai_classification ?? null,
    aiSuggestedActions: Array.isArray(row.ai_suggested_actions)
      ? (row.ai_suggested_actions as GmailSuggestedAction[])
      : [],
    meetingDetected: row.meeting_detected,
    meetingConfidence: Number(row.meeting_confidence),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function upsertGmailMessage(input: {
  workspaceId: string;
  accountId: string;
  threadId: string;
  externalId: string;
  direction: "inbound" | "outbound";
  fromEmail: string;
  fromName?: string | null;
  toEmails: InboxParticipant[];
  ccEmails: InboxParticipant[];
  subject: string;
  bodyText: string;
  bodyHtml?: string | null;
  sentAt: string;
  isDraft: boolean;
  client?: SupabaseClient<Database>;
}): Promise<InboxMessage> {
  const supabase = await clientOrDefault(input.client);
  const { data: existing } = await supabase
    .from("inbox_messages")
    .select("*")
    .eq("account_id", input.accountId)
    .eq("external_id", input.externalId)
    .maybeSingle();

  const patch = {
    workspace_id: input.workspaceId,
    account_id: input.accountId,
    thread_id: input.threadId,
    external_id: input.externalId,
    direction: input.direction,
    from_email: input.fromEmail,
    from_name: input.fromName ?? null,
    to_emails: participantsToJson(input.toEmails),
    cc_emails: participantsToJson(input.ccEmails),
    subject: input.subject,
    body_text: input.bodyText,
    body_html: input.bodyHtml ?? null,
    sent_at: input.sentAt,
    is_draft: input.isDraft,
  };

  const result = existing
    ? await supabase
        .from("inbox_messages")
        .update(patch)
        .eq("id", existing.id)
        .select("*")
        .single()
    : await supabase.from("inbox_messages").insert(patch).select("*").single();

  if (result.error || !result.data) {
    throw new Error(
      `Failed to upsert Gmail message: ${result.error?.message ?? "Unknown"}`,
    );
  }
  const row = result.data;
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    threadId: row.thread_id,
    accountId: row.account_id,
    externalId: row.external_id,
    direction: row.direction,
    fromEmail: row.from_email,
    fromName: row.from_name,
    toEmails: parseParticipants(row.to_emails),
    ccEmails: parseParticipants(row.cc_emails),
    subject: row.subject,
    bodyText: row.body_text,
    bodyHtml: row.body_html,
    sentAt: row.sent_at,
    isDraft: row.is_draft,
    aiSummary: row.ai_summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function upsertGmailAttachment(input: {
  workspaceId: string;
  messageId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  externalId: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { data: existing } = await supabase
    .from("inbox_attachments")
    .select("id")
    .eq("message_id", input.messageId)
    .eq("external_id", input.externalId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("inbox_attachments")
      .update({
        filename: input.filename,
        mime_type: input.mimeType,
        size_bytes: input.sizeBytes,
      })
      .eq("id", existing.id);
    return;
  }

  const { error } = await supabase.from("inbox_attachments").insert({
    workspace_id: input.workspaceId,
    message_id: input.messageId,
    filename: input.filename,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    external_id: input.externalId,
  });
  if (error) {
    throw new Error(`Failed to upsert Gmail attachment: ${error.message}`);
  }
}

export async function updateThreadAiClassification(input: {
  workspaceId: string;
  threadId: string;
  aiPriority?: string | null;
  aiClassification?: string | null;
  aiSuggestedActions?: GmailSuggestedAction[];
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["inbox_threads"]["Update"] = {};
  if (input.aiPriority !== undefined) patch.ai_priority = input.aiPriority;
  if (input.aiClassification !== undefined) {
    patch.ai_classification = input.aiClassification;
  }
  if (input.aiSuggestedActions !== undefined) {
    patch.ai_suggested_actions = input.aiSuggestedActions as unknown as Json;
  }
  const { error } = await supabase
    .from("inbox_threads")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.threadId);
  if (error) {
    throw new Error(`Failed to update thread AI fields: ${error.message}`);
  }
}

export async function assignThreadLabelsByExternalIds(input: {
  workspaceId: string;
  threadId: string;
  accountId: string;
  labelExternalIds: string[];
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { data: labels } = await supabase
    .from("inbox_labels")
    .select("id, external_id")
    .eq("workspace_id", input.workspaceId)
    .eq("account_id", input.accountId)
    .in("external_id", input.labelExternalIds);

  await supabase
    .from("inbox_thread_labels")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("thread_id", input.threadId);

  const rows = (labels ?? []).map((label) => ({
    workspace_id: input.workspaceId,
    thread_id: input.threadId,
    label_id: label.id,
  }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("inbox_thread_labels").insert(rows);
  if (error) {
    throw new Error(`Failed to assign thread labels: ${error.message}`);
  }
}

export async function listWorkspaceGmailAccounts(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<InboxAccount[]> {
  const accounts = await listInboxAccounts(input);
  return accounts.filter((account) => account.provider === "gmail");
}
