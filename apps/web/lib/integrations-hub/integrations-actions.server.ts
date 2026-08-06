import "server-only";

import { headers } from "next/headers";
import { getUser } from "@repo/auth/server";
import { getSiteUrl } from "@repo/auth/site-url";
import {
  createIntegrationSyncJob,
  deleteIntegrationAccount,
  disconnectIntegrationAccount,
  logIntegrationActivity,
  markIntegrationSynced,
  upsertIntegrationAccount,
  updateIntegrationAccountSettings,
  updateIntegrationSyncJob,
} from "@repo/database/integrations";
import {
  getDecryptedIntegrationTokens,
  upsertIntegrationTokens,
} from "@repo/database/integration-tokens";
import { getMembershipRole } from "@repo/database/workspace";
import {
  disconnectIntegrationSchema,
  listIntegrationsSchema,
  manualSyncIntegrationSchema,
  startIntegrationOAuthSchema,
  updateIntegrationSettingsSchema,
} from "@repo/types";
import type { IntegrationActionResult } from "./integrations-action-types";
import { resolveActiveWorkspace } from "../workspace-context";
import {
  buildGmailAuthUrl,
  describeGmailOAuthConfig,
  encodeOAuthState,
} from "@repo/ai";
import {
  buildGoogleOAuthUrl,
  getGoogleOAuthCredentials,
  getGoogleOAuthRedirectUri,
} from "@repo/ai";
import { GOOGLE_CALENDAR_SCOPES } from "../google-calendar";
import { getInboxAccountSecrets } from "@repo/database/gmail";
import {
  disconnectGmailHubAccount,
  getGmailHubAccountById,
} from "./gmail-bridge";
import {
  ensureFreshGmailAccess,
  startGmailSyncInBackground,
} from "../gmail-sync";
import { encodeIntegrationOAuthState } from "./oauth-state.server";
import { getIntegrationProvider } from "./provider";
import { ensureIntegrationProvidersRegistered } from "./providers";
import {
  buildIntegrationHubCards,
  getIntegrationOAuthRedirectUri,
  loadIntegrationDetail,
  requireIntegrationAccount,
} from "./service";

export type { IntegrationActionResult } from "./integrations-action-types";

async function requireContext() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  const context = await resolveActiveWorkspace();
  if (!context) throw new Error("No active workspace");
  const role = await getMembershipRole(context.active.workspace.id, user.id);
  if (!role) throw new Error("Forbidden");
  return {
    userId: user.id,
    workspaceId: context.active.workspace.id,
    email: context.email,
  };
}

function fail(error: unknown): IntegrationActionResult<never> {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Integration action failed",
  };
}

async function ensureFreshIntegrationToken(input: {
  accountId: string;
  workspaceId: string;
  userId: string;
  providerId: string;
}) {
  const provider = getIntegrationProvider(input.providerId);
  if (!provider?.refreshAccessToken) return;

  const tokens = await getDecryptedIntegrationTokens({ accountId: input.accountId });
  if (!tokens?.refreshToken || !tokens.expiresAt) return;

  const refreshThreshold = Date.now() + 60_000;
  if (new Date(tokens.expiresAt).getTime() > refreshThreshold) return;

  const refreshed = await provider.refreshAccessToken({
    refreshToken: tokens.refreshToken,
  });
  await upsertIntegrationTokens({
    workspaceId: input.workspaceId,
    accountId: input.accountId,
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken ?? tokens.refreshToken,
    expiresAt: refreshed.expiresAt,
    tokenType: refreshed.tokenType,
  });
  await logIntegrationActivity({
    workspaceId: input.workspaceId,
    accountId: input.accountId,
    provider: input.providerId,
    eventType: "token_refreshed",
    title: `Refreshed ${input.providerId} access token`,
    actorId: input.userId,
  });
}

export async function listIntegrationsHub(
  input?: unknown,
): Promise<
  IntegrationActionResult<Awaited<ReturnType<typeof buildIntegrationHubCards>>>
> {
  try {
    const ctx = await requireContext();
    const parsed = listIntegrationsSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    ensureIntegrationProvidersRegistered();
    const data = await buildIntegrationHubCards({
      workspaceId: ctx.workspaceId,
      query: parsed.data.query,
      category: parsed.data.category,
      status: parsed.data.status,
    });
    return { ok: true, data };
  } catch (error) {
    return fail(error);
  }
}

export async function getIntegrationDetail(input: {
  provider: string;
}): Promise<
  IntegrationActionResult<NonNullable<Awaited<ReturnType<typeof loadIntegrationDetail>>>>
> {
  try {
    const ctx = await requireContext();
    ensureIntegrationProvidersRegistered();
    const detail = await loadIntegrationDetail({
      workspaceId: ctx.workspaceId,
      provider: input.provider,
    });
    if (!detail) return { ok: false, error: "Integration not found" };
    if (detail.account?.status === "connected") {
      ensureIntegrationProvidersRegistered();
      if (detail.account.provider === "gmail") {
        const secrets = await getInboxAccountSecrets({
          workspaceId: ctx.workspaceId,
          accountId: detail.account.id,
        }).catch(() => null);
        if (secrets) {
          await ensureFreshGmailAccess(secrets).catch(() => undefined);
        }
      } else {
        await ensureFreshIntegrationToken({
          accountId: detail.account.id,
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          providerId: detail.account.provider,
        });
      }
    }
    return { ok: true, data: detail };
  } catch (error) {
    return fail(error);
  }
}

export async function startIntegrationOAuth(
  input: unknown,
): Promise<IntegrationActionResult<{ authUrl: string; configured: boolean }>> {
  try {
    const ctx = await requireContext();
    const parsed = startIntegrationOAuthSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    ensureIntegrationProvidersRegistered();
    const provider = getIntegrationProvider(parsed.data.provider);
    if (!provider) return { ok: false, error: "Unknown integration provider" };

    if (parsed.data.provider === "gmail") {
      const oauthConfig = describeGmailOAuthConfig(getSiteUrl());
      if (!oauthConfig.clientIdSet || !oauthConfig.clientSecretSet) {
        return {
          ok: false,
          error:
            "Gmail OAuth is not configured. Add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET (or GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).",
        };
      }

      const state = encodeOAuthState({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        provider: "gmail",
        returnTo: `/integrations/gmail?connected=1`,
      });
      const authUrl = buildGmailAuthUrl({
        redirectUri: oauthConfig.redirectUri,
        state,
      });

      return { ok: true, data: { authUrl, configured: true } };
    }

    if (parsed.data.provider === "google-calendar") {
      try {
        getGoogleOAuthCredentials();
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Google Calendar OAuth is not configured",
        };
      }

      const requestHeaders = await headers();
      const forwardedProto = requestHeaders.get("x-forwarded-proto") ?? "http";
      const host = requestHeaders.get("host");
      const requestOrigin = host ? `${forwardedProto}://${host}` : undefined;
      const redirectUri = getGoogleOAuthRedirectUri(
        "/api/integrations/calendar/callback",
        requestOrigin,
      );
      const state = encodeIntegrationOAuthState({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        provider: "google-calendar",
        secret:
          process.env.INTEGRATION_OAUTH_STATE_SECRET?.trim() ||
          process.env.GOOGLE_CLIENT_SECRET?.trim() ||
          process.env.GMAIL_CLIENT_SECRET?.trim() ||
          "",
      });
      return {
        ok: true,
        data: {
          authUrl: buildGoogleOAuthUrl({
            redirectUri,
            state,
            scopes: [...GOOGLE_CALENDAR_SCOPES],
          }),
          configured: true,
        },
      };
    }

    if (!provider.isConfigured()) {
      return {
        ok: false,
        error: `${provider.name} OAuth is not configured. Add ${provider.requiredEnv.join(" and ")}.`,
      };
    }

    if (provider.connectionType === "api_key" && provider.connect) {
      try {
        const connection = await provider.connect();
        const account = await upsertIntegrationAccount({
          workspaceId: ctx.workspaceId,
          provider: provider.id,
          userId: ctx.userId,
          accountName: connection.accountName,
          externalAccountId: connection.externalAccountId,
          status: "connected",
          permissions: connection.permissions,
          metadata: connection.metadata,
        });
        await logIntegrationActivity({
          workspaceId: ctx.workspaceId,
          accountId: account.id,
          provider: provider.id,
          eventType: "connected",
          title: `Connected ${provider.name}`,
          body: "Server-side API key verified successfully.",
          actorId: ctx.userId,
          metadata: { connectionType: "api_key" },
        });
        return { ok: true, data: { authUrl: "", configured: true } };
      } catch (error) {
        return fail(
          error instanceof Error
            ? error
            : new Error(`${provider.name} connection verification failed`),
        );
      }
    }

    const secret =
      process.env.INTEGRATION_OAUTH_STATE_SECRET?.trim() ||
      process.env.GOOGLE_CLIENT_SECRET?.trim() ||
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!secret) {
      return { ok: false, error: "OAuth state secret is not configured" };
    }

    const requestHeaders = await headers();
    const forwardedProto = requestHeaders.get("x-forwarded-proto") ?? "http";
    const host = requestHeaders.get("host");
    const requestOrigin = host ? `${forwardedProto}://${host}` : getSiteUrl();
    const redirectUri = getIntegrationOAuthRedirectUri(requestOrigin);
    const state = encodeIntegrationOAuthState({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      provider: provider.id,
      secret,
    });
    const authUrl = provider.buildAuthUrl({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      redirectUri,
      state,
    });

    return { ok: true, data: { authUrl, configured: true } };
  } catch (error) {
    return fail(error);
  }
}

export async function disconnectIntegration(
  input: unknown,
): Promise<IntegrationActionResult<{ disconnected: true }>> {
  try {
    const ctx = await requireContext();
    const parsed = disconnectIntegrationSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const gmailAccount = await getGmailHubAccountById({
      workspaceId: ctx.workspaceId,
      accountId: parsed.data.accountId,
    });
    if (gmailAccount) {
      await disconnectGmailHubAccount({
        workspaceId: ctx.workspaceId,
        accountId: gmailAccount.id,
      });
      await logIntegrationActivity({
        workspaceId: ctx.workspaceId,
        provider: "gmail",
        eventType: "disconnected",
        title: "Disconnected Gmail",
        body: gmailAccount.accountEmail,
        actorId: ctx.userId,
      });
      return { ok: true, data: { disconnected: true } };
    }

    const account = await requireIntegrationAccount({
      workspaceId: ctx.workspaceId,
      accountId: parsed.data.accountId,
    });
    await disconnectIntegrationAccount({
      workspaceId: ctx.workspaceId,
      accountId: account.id,
    });
    await logIntegrationActivity({
      workspaceId: ctx.workspaceId,
      accountId: account.id,
      provider: account.provider,
      eventType: "disconnected",
      title: `Disconnected ${account.provider}`,
      body: account.accountEmail,
      actorId: ctx.userId,
    });
    return { ok: true, data: { disconnected: true } };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteIntegrationConnection(
  input: unknown,
): Promise<IntegrationActionResult<{ deleted: true }>> {
  try {
    const ctx = await requireContext();
    const parsed = disconnectIntegrationSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const account = await requireIntegrationAccount({
      workspaceId: ctx.workspaceId,
      accountId: parsed.data.accountId,
    });
    await deleteIntegrationAccount({
      workspaceId: ctx.workspaceId,
      accountId: account.id,
    });
    await logIntegrationActivity({
      workspaceId: ctx.workspaceId,
      provider: account.provider,
      eventType: "disconnected",
      title: `Deleted ${account.provider} connection`,
      actorId: ctx.userId,
    });
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return fail(error);
  }
}

export async function updateIntegrationSettings(
  input: unknown,
): Promise<IntegrationActionResult<{ accountId: string }>> {
  try {
    const ctx = await requireContext();
    const parsed = updateIntegrationSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const account = await updateIntegrationAccountSettings({
      workspaceId: ctx.workspaceId,
      accountId: parsed.data.accountId,
      autoSync: parsed.data.autoSync,
      notificationsEnabled: parsed.data.notificationsEnabled,
      kairosAccess: parsed.data.kairosAccess,
      syncFrequency: parsed.data.syncFrequency,
    });
    await logIntegrationActivity({
      workspaceId: ctx.workspaceId,
      accountId: account.id,
      provider: account.provider,
      eventType: "permission_updated",
      title: "Integration settings updated",
      actorId: ctx.userId,
      metadata: parsed.data,
    });
    return { ok: true, data: { accountId: account.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function manualSyncIntegration(
  input: unknown,
): Promise<IntegrationActionResult<{ jobId: string }>> {
  try {
    const ctx = await requireContext();
    const parsed = manualSyncIntegrationSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const gmailAccount = await getGmailHubAccountById({
      workspaceId: ctx.workspaceId,
      accountId: parsed.data.accountId,
    });
    if (gmailAccount) {
      if (gmailAccount.status !== "connected" && gmailAccount.status !== "syncing") {
        return { ok: false, error: "Connect Gmail before syncing" };
      }
      const secrets = await getInboxAccountSecrets({
        workspaceId: ctx.workspaceId,
        accountId: gmailAccount.id,
      });
      if (!secrets) {
        return { ok: false, error: "Gmail account tokens not found" };
      }
      await ensureFreshGmailAccess(secrets);
      const started = await startGmailSyncInBackground({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        accountId: gmailAccount.id,
        full: true,
      });
      await logIntegrationActivity({
        workspaceId: ctx.workspaceId,
        provider: "gmail",
        eventType: "manual_sync",
        title: "Gmail inbox sync started",
        body: gmailAccount.accountEmail,
        actorId: ctx.userId,
        metadata: { jobId: started.jobId },
      });
      return { ok: true, data: { jobId: started.jobId } };
    }

    const account = await requireIntegrationAccount({
      workspaceId: ctx.workspaceId,
      accountId: parsed.data.accountId,
    });
    if (account.status !== "connected") {
      return { ok: false, error: "Connect the integration before syncing" };
    }

    ensureIntegrationProvidersRegistered();
    await ensureFreshIntegrationToken({
      accountId: account.id,
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      providerId: account.provider,
    });

    const job = await createIntegrationSyncJob({
      workspaceId: ctx.workspaceId,
      accountId: account.id,
      provider: account.provider,
      trigger: "manual",
    });

    const startedAt = new Date().toISOString();
    await updateIntegrationSyncJob({
      workspaceId: ctx.workspaceId,
      jobId: job.id,
      status: "running",
      attempts: 1,
      startedAt,
    });

    try {
      await markIntegrationSynced({
        workspaceId: ctx.workspaceId,
        accountId: account.id,
      });
      await updateIntegrationSyncJob({
        workspaceId: ctx.workspaceId,
        jobId: job.id,
        status: "succeeded",
        attempts: 1,
        startedAt,
        finishedAt: new Date().toISOString(),
        result: { synced: true },
      });
      await logIntegrationActivity({
        workspaceId: ctx.workspaceId,
        accountId: account.id,
        provider: account.provider,
        eventType: "manual_sync",
        title: `Manual sync completed for ${account.provider}`,
        actorId: ctx.userId,
      });
    } catch (syncError) {
      await updateIntegrationSyncJob({
        workspaceId: ctx.workspaceId,
        jobId: job.id,
        status: "failed",
        attempts: 1,
        startedAt,
        finishedAt: new Date().toISOString(),
        errorMessage:
          syncError instanceof Error ? syncError.message : "Sync failed",
      });
      await logIntegrationActivity({
        workspaceId: ctx.workspaceId,
        accountId: account.id,
        provider: account.provider,
        eventType: "error",
        title: `Sync failed for ${account.provider}`,
        body: syncError instanceof Error ? syncError.message : "Sync failed",
        actorId: ctx.userId,
      });
      throw syncError;
    }

    return { ok: true, data: { jobId: job.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function refreshIntegrationToken(
  input: unknown,
): Promise<IntegrationActionResult<{ expiresAt: string | null }>> {
  try {
    const ctx = await requireContext();
    const parsed = disconnectIntegrationSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    ensureIntegrationProvidersRegistered();
    const account = await requireIntegrationAccount({
      workspaceId: ctx.workspaceId,
      accountId: parsed.data.accountId,
    });
    const provider = getIntegrationProvider(account.provider);
    if (!provider?.refreshAccessToken) {
      return { ok: false, error: "This provider does not support token refresh" };
    }

    const tokens = await getDecryptedIntegrationTokens({ accountId: account.id });
    if (!tokens?.refreshToken) {
      return { ok: false, error: "No refresh token available — reconnect the integration" };
    }

    const refreshed = await provider.refreshAccessToken({
      refreshToken: tokens.refreshToken,
    });
    await upsertIntegrationTokens({
      workspaceId: ctx.workspaceId,
      accountId: account.id,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken ?? tokens.refreshToken,
      expiresAt: refreshed.expiresAt,
      tokenType: refreshed.tokenType,
    });
    await logIntegrationActivity({
      workspaceId: ctx.workspaceId,
      accountId: account.id,
      provider: account.provider,
      eventType: "token_refreshed",
      title: `Refreshed ${account.provider} token`,
      actorId: ctx.userId,
    });

    return { ok: true, data: { expiresAt: refreshed.expiresAt } };
  } catch (error) {
    return fail(error);
  }
}
