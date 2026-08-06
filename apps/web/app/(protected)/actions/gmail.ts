"use server";

import { z } from "zod";
import { getUser } from "@repo/auth/server";
import { getMembershipRole } from "@repo/database/workspace";
import { disconnectInboxAccount } from "@repo/database/inbox";
import { listWorkspaceGmailAccounts } from "@repo/database/gmail";
import {
  gmailCreateDraftSchema,
  gmailCreateLeadSchema,
  gmailForwardSchema,
  gmailMoveLabelsSchema,
  gmailReadStateSchema,
  gmailReplySchema,
  gmailSearchSchema,
  gmailSendSchema,
  gmailStarSchema,
  gmailSyncSchema,
  gmailThreadActionSchema,
  startGmailOAuthSchema,
  summarizeThreadSchema,
} from "@repo/types";
import {
  buildGmailAuthUrl,
  describeGmailOAuthConfig,
  encodeOAuthState,
} from "@repo/ai";
import { ensureGmailAiToolsRegistered } from "../../../lib/gmail-ai";
import { ensureInboxAiToolsRegistered } from "../../../lib/inbox-ai";
import {
  classifyGmailThreadWithAi,
  createLeadFromGmailThread,
  gmailForward,
  gmailMoveLabels,
  gmailSetReadState,
  gmailStar,
  readGmailSyncProgress,
  startGmailSyncInBackground,
  syncGmailAccount,
} from "../../../lib/gmail-sync";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export type GmailActionResult<T> =
  | { ok: true; data: T; tools?: string[] }
  | { ok: false; error: string };

async function requireGmailContext() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  const context = await resolveActiveWorkspace();
  if (!context) throw new Error("No active workspace");
  const role = await getMembershipRole(context.active.workspace.id, user.id);
  if (!role) throw new Error("Forbidden");
  const { registered } = ensureGmailAiToolsRegistered();
  ensureInboxAiToolsRegistered();
  return {
    userId: user.id,
    workspaceId: context.active.workspace.id,
    tools: registered,
  };
}

function fail(error: unknown): GmailActionResult<never> {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Gmail action failed",
  };
}

export async function startGmailOAuthAction(
  input: unknown,
): Promise<
  GmailActionResult<{
    authUrl: string;
    redirectUri: string;
    googleCloudMustAllow: string;
  }>
> {
  try {
    const ctx = await requireGmailContext();
    const parsed = startGmailOAuthSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const oauthConfig = describeGmailOAuthConfig();
    const redirectUri = oauthConfig.redirectUri;

    console.info("[gmail.oauth] startGmailOAuthAction — config check", {
      NEXT_PUBLIC_SITE_URL: oauthConfig.siteUrl,
      redirect_uri: redirectUri,
      GOOGLE_CLIENT_ID: oauthConfig.clientIdSet ? "SET" : "MISSING",
      GOOGLE_CLIENT_SECRET: oauthConfig.clientSecretSet ? "SET" : "MISSING",
      scopes: oauthConfig.scopes,
      note: "Custom OAuth (Next.js). Do NOT use Supabase /auth/v1/callback for Gmail.",
      googleCloudMustAllow: redirectUri,
    });

    if (!oauthConfig.clientIdSet || !oauthConfig.clientSecretSet) {
      return {
        ok: false,
        error:
          "Gmail OAuth is not configured. Add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET (or GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) to apps/web/.env.local.",
      };
    }

    const state = encodeOAuthState({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      provider: "gmail",
      displayName: parsed.data.displayName,
      returnTo: parsed.data.returnTo ?? "/inbox/accounts",
    });
    const authUrl = buildGmailAuthUrl({
      redirectUri,
      state,
    });

    console.info(
      "[gmail.oauth] redirecting browser to Google with redirect_uri=",
      redirectUri,
    );

    return {
      ok: true,
      data: {
        authUrl,
        redirectUri,
        googleCloudMustAllow: redirectUri,
      },
      tools: ctx.tools,
    };
  } catch (error) {
    return fail(error);
  }
}

/** Diagnostics for Google Cloud redirect URI configuration. */
export async function getGmailOAuthRedirectUriAction(): Promise<
  GmailActionResult<{
    redirectUri: string;
    siteUrl: string;
    clientIdSet: boolean;
    clientSecretSet: boolean;
    scopes: string[];
  }>
> {
  try {
    await requireGmailContext();
    const config = describeGmailOAuthConfig();
    return {
      ok: true,
      data: {
        redirectUri: config.redirectUri,
        siteUrl: config.siteUrl,
        clientIdSet: config.clientIdSet,
        clientSecretSet: config.clientSecretSet,
        scopes: config.scopes,
      },
    };
  } catch (error) {
    return fail(error);
  }
}

export async function listGmailAccountsAction(): Promise<
  GmailActionResult<{
    accounts: Awaited<ReturnType<typeof listWorkspaceGmailAccounts>>;
  }>
> {
  try {
    const ctx = await requireGmailContext();
    const accounts = await listWorkspaceGmailAccounts({
      workspaceId: ctx.workspaceId,
    });
    return { ok: true, data: { accounts }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function disconnectGmailAccountAction(input: {
  id: string;
}): Promise<GmailActionResult<{ disconnected: true }>> {
  try {
    const ctx = await requireGmailContext();
    await disconnectInboxAccount({
      workspaceId: ctx.workspaceId,
      id: input.id,
    });
    return { ok: true, data: { disconnected: true }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function syncGmailAccountAction(
  input: unknown,
): Promise<
  GmailActionResult<
    | {
        mode: "full" | "incremental";
        threadsUpserted: number;
        messagesUpserted: number;
        labelsUpserted: number;
        attachmentsUpserted: number;
        historyId: string | null;
        summariesGenerated: number;
        tasksCreated: number;
        meetingsScheduled: number;
        linkedContacts: number;
        errors: Array<{ message: string; retries: number; at: string }>;
        progress: {
          jobId: string;
          status: string;
          phase: string;
          threadsProcessed: number;
          threadsTotal: number;
        };
      }
    | { jobId: string; accountId: string; background: true }
  >
> {
  try {
    const ctx = await requireGmailContext();
    const parsed = gmailSyncSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    if (parsed.data.background) {
      const started = await startGmailSyncInBackground({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        accountId: parsed.data.accountId,
        full: parsed.data.full,
      });
      return {
        ok: true,
        data: { ...started, background: true as const },
        tools: ctx.tools,
      };
    }

    const { registry } = ensureGmailAiToolsRegistered();
    const result = (await registry.execute(
      "gmail.sync",
      { accountId: parsed.data.accountId, full: parsed.data.full },
      { workspaceId: ctx.workspaceId, userId: ctx.userId },
    )) as {
      mode: "full" | "incremental";
      threadsUpserted: number;
      messagesUpserted: number;
      labelsUpserted: number;
      attachmentsUpserted: number;
      historyId: string | null;
      summariesGenerated: number;
      tasksCreated: number;
      meetingsScheduled: number;
      linkedContacts: number;
      errors: Array<{ message: string; retries: number; at: string }>;
      progress: {
        jobId: string;
        status: string;
        phase: string;
        threadsProcessed: number;
        threadsTotal: number;
      };
    };
    return { ok: true, data: result, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function getGmailSyncProgressAction(
  input: unknown,
): Promise<
  GmailActionResult<{
    progress: {
      jobId: string;
      status: string;
      phase: string;
      mode: string;
      threadsProcessed: number;
      threadsTotal: number;
      messagesUpserted: number;
      labelsUpserted: number;
      attachmentsUpserted: number;
      summariesGenerated: number;
      tasksCreated: number;
      meetingsScheduled: number;
      linkedContacts: number;
      errors: Array<{ message: string; retries: number; at: string }>;
      currentThreadSubject?: string | null;
      historyId?: string | null;
      updatedAt: string;
      completedAt?: string | null;
    } | null;
  }>
> {
  try {
    const ctx = await requireGmailContext();
    const parsed = z
      .object({ accountId: z.string().uuid() })
      .safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const progress = await readGmailSyncProgress({
      workspaceId: ctx.workspaceId,
      accountId: parsed.data.accountId,
    });
    return { ok: true, data: { progress }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function sendGmailAction(
  input: unknown,
): Promise<GmailActionResult<{ messageId: string; threadId: string }>> {
  try {
    const ctx = await requireGmailContext();
    const parsed = gmailSendSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { registry } = ensureGmailAiToolsRegistered();
    const result = (await registry.execute(
      "gmail.send",
      parsed.data,
      { workspaceId: ctx.workspaceId, userId: ctx.userId },
    )) as { messageId: string; threadId: string };
    return { ok: true, data: result, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function replyGmailAction(
  input: unknown,
): Promise<GmailActionResult<{ messageId: string; body: string }>> {
  try {
    const ctx = await requireGmailContext();
    const parsed = gmailReplySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    let body = parsed.data.body;
    if (parsed.data.useSmartReply) {
      const { registry } = ensureInboxAiToolsRegistered();
      const draft = (await registry.execute(
        "inbox.smartReply",
        { threadId: parsed.data.threadId },
        { workspaceId: ctx.workspaceId, userId: ctx.userId },
      )) as { reply: string };
      body = draft.reply;
    }
    const { registry } = ensureGmailAiToolsRegistered();
    const result = (await registry.execute(
      "gmail.reply",
      {
        threadId: parsed.data.threadId,
        body,
        replyAll: parsed.data.replyAll,
      },
      { workspaceId: ctx.workspaceId, userId: ctx.userId },
    )) as { messageId: string; body: string };
    return { ok: true, data: result, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function forwardGmailAction(
  input: unknown,
): Promise<GmailActionResult<{ messageId: string }>> {
  try {
    const ctx = await requireGmailContext();
    const parsed = gmailForwardSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const result = await gmailForward({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      ...parsed.data,
    });
    return { ok: true, data: result, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function archiveGmailAction(
  input: unknown,
): Promise<GmailActionResult<{ archived: true }>> {
  try {
    const ctx = await requireGmailContext();
    const parsed = gmailThreadActionSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { registry } = ensureGmailAiToolsRegistered();
    await registry.execute(
      "gmail.archive",
      { threadId: parsed.data.threadId },
      { workspaceId: ctx.workspaceId, userId: ctx.userId },
    );
    return { ok: true, data: { archived: true }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteGmailAction(
  input: unknown,
): Promise<GmailActionResult<{ deleted: true }>> {
  try {
    const ctx = await requireGmailContext();
    const parsed = gmailThreadActionSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { registry } = ensureGmailAiToolsRegistered();
    await registry.execute(
      "gmail.delete",
      { threadId: parsed.data.threadId },
      { workspaceId: ctx.workspaceId, userId: ctx.userId },
    );
    return { ok: true, data: { deleted: true }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function starGmailAction(
  input: unknown,
): Promise<GmailActionResult<{ starred: boolean }>> {
  try {
    const ctx = await requireGmailContext();
    const parsed = gmailStarSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    await gmailStar({
      workspaceId: ctx.workspaceId,
      threadId: parsed.data.threadId,
      starred: parsed.data.starred,
    });
    return { ok: true, data: { starred: parsed.data.starred }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function setGmailReadStateAction(
  input: unknown,
): Promise<GmailActionResult<{ unread: boolean }>> {
  try {
    const ctx = await requireGmailContext();
    const parsed = gmailReadStateSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    await gmailSetReadState({
      workspaceId: ctx.workspaceId,
      threadId: parsed.data.threadId,
      unread: parsed.data.unread,
    });
    return { ok: true, data: { unread: parsed.data.unread }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function moveGmailLabelsAction(
  input: unknown,
): Promise<GmailActionResult<{ moved: true }>> {
  try {
    const ctx = await requireGmailContext();
    const parsed = gmailMoveLabelsSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    await gmailMoveLabels({
      workspaceId: ctx.workspaceId,
      ...parsed.data,
    });
    return { ok: true, data: { moved: true }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function createGmailDraftAction(
  input: unknown,
): Promise<GmailActionResult<{ draftId: string }>> {
  try {
    const ctx = await requireGmailContext();
    const parsed = gmailCreateDraftSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { registry } = ensureGmailAiToolsRegistered();
    const result = (await registry.execute(
      "gmail.createDraft",
      parsed.data,
      { workspaceId: ctx.workspaceId, userId: ctx.userId },
    )) as { draftId: string };
    return { ok: true, data: result, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function searchGmailAction(
  input: unknown,
): Promise<
  GmailActionResult<{
    threads: Array<{ id: string; subject: string; snippet: string }>;
  }>
> {
  try {
    const ctx = await requireGmailContext();
    const parsed = gmailSearchSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { registry } = ensureGmailAiToolsRegistered();
    const result = (await registry.execute(
      "gmail.search",
      parsed.data,
      { workspaceId: ctx.workspaceId, userId: ctx.userId },
    )) as { threads: Array<{ id: string; subject: string; snippet: string }> };
    return { ok: true, data: result, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function summarizeGmailThreadAction(
  input: unknown,
): Promise<GmailActionResult<{ summary: string }>> {
  try {
    const ctx = await requireGmailContext();
    const parsed = summarizeThreadSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { registry } = ensureInboxAiToolsRegistered();
    const result = (await registry.execute(
      "inbox.summarize",
      { threadId: parsed.data.threadId },
      { workspaceId: ctx.workspaceId, userId: ctx.userId },
    )) as { summary: string };
    return { ok: true, data: result, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function classifyGmailThreadAction(input: {
  threadId: string;
}): Promise<
  GmailActionResult<{
    priority: string;
    classification: string;
    suggestedActions: Array<{ type: string; label: string; confidence: number }>;
  }>
> {
  try {
    const ctx = await requireGmailContext();
    const result = await classifyGmailThreadWithAi({
      workspaceId: ctx.workspaceId,
      threadId: input.threadId,
    });
    return { ok: true, data: result, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function createLeadFromGmailAction(
  input: unknown,
): Promise<GmailActionResult<{ leadId: string; name: string }>> {
  try {
    const ctx = await requireGmailContext();
    const parsed = gmailCreateLeadSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const result = await createLeadFromGmailThread({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      threadId: parsed.data.threadId,
    });
    return { ok: true, data: result, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

/** Direct sync helper for background jobs (same as tool path). */
export async function runGmailSyncJob(input: {
  workspaceId: string;
  userId: string;
  accountId: string;
  full?: boolean;
}) {
  const ctx = await requireGmailContext();
  const parsed = gmailSyncSchema.safeParse({
    accountId: input.accountId,
    full: input.full,
  });
  if (!parsed.success) {
    throw new Error("Invalid Gmail sync request");
  }
  if (input.workspaceId !== ctx.workspaceId || input.userId !== ctx.userId) {
    throw new Error("Forbidden");
  }
  ensureGmailAiToolsRegistered();
  return syncGmailAccount({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    accountId: parsed.data.accountId,
    full: parsed.data.full,
  });
}
