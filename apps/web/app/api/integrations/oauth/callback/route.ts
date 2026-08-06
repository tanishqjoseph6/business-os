import { NextResponse } from "next/server";
import { getSiteUrl } from "@repo/auth/site-url";
import {
  logIntegrationActivity,
  upsertIntegrationAccount,
} from "@repo/database/integrations";
import { upsertIntegrationTokens } from "@repo/database/integration-tokens";
import {
  decodeIntegrationOAuthState,
} from "../../../../../lib/integrations-hub/oauth-state.server";
import { getIntegrationProvider } from "../../../../../lib/integrations-hub/provider";
import { ensureIntegrationProvidersRegistered } from "../../../../../lib/integrations-hub/providers";
import { getIntegrationOAuthRedirectUri } from "../../../../../lib/integrations-hub/service";

export const runtime = "nodejs";

function redirectTo(path: string, origin?: string) {
  return NextResponse.redirect(new URL(path, origin ?? getSiteUrl()));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return redirectTo(
      `/integrations?error=${encodeURIComponent(oauthError)}`,
      origin,
    );
  }

  if (!code || !state) {
    return redirectTo(
      `/integrations?error=${encodeURIComponent("Missing OAuth code or state")}`,
      origin,
    );
  }

  try {
    ensureIntegrationProvidersRegistered();
    const secret =
      process.env.INTEGRATION_OAUTH_STATE_SECRET?.trim() ||
      process.env.GOOGLE_CLIENT_SECRET?.trim() ||
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!secret) throw new Error("OAuth state secret is not configured");

    const decoded = decodeIntegrationOAuthState({ state, secret });
    const provider = getIntegrationProvider(decoded.provider);
    if (!provider) throw new Error("Unknown provider");

    const redirectUri = getIntegrationOAuthRedirectUri(origin);
    const tokens = await provider.exchangeCode({ code, redirectUri });
    const profile = await provider.fetchProfile({
      accessToken: tokens.accessToken,
    });

    const account = await upsertIntegrationAccount({
      workspaceId: decoded.workspaceId,
      provider: provider.id,
      userId: decoded.userId,
      accountEmail: profile.email,
      accountName:
        (typeof tokens.metadata?.workspaceName === "string"
          ? tokens.metadata.workspaceName
          : null) ?? profile.name,
      externalAccountId:
        (typeof tokens.metadata?.workspaceId === "string"
          ? tokens.metadata.workspaceId
          : null) ?? profile.externalAccountId,
      status: "connected",
      permissions: provider.permissions,
      scopes: tokens.scopes.length ? tokens.scopes : provider.scopes,
      health: "healthy",
      metadata: tokens.metadata,
    });

    await upsertIntegrationTokens({
      workspaceId: decoded.workspaceId,
      accountId: account.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      tokenType: tokens.tokenType,
    });

    await logIntegrationActivity({
      workspaceId: decoded.workspaceId,
      accountId: account.id,
      provider: provider.id,
      eventType: "connected",
      title: `Connected ${provider.name}`,
      body: profile.email,
      actorId: decoded.userId,
      metadata: { scopes: account.scopes },
    });

    return redirectTo(`/integrations/${provider.id}?connected=1`, origin);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OAuth callback failed";
    return redirectTo(
      `/integrations?error=${encodeURIComponent(message)}`,
      origin,
    );
  }
}
