import { NextResponse } from "next/server";
import { getSiteUrl } from "@repo/auth/site-url";
import {
  fetchGoogleOAuthProfile,
  getGoogleOAuthRedirectUri,
} from "@repo/ai";
import { getUser } from "@repo/auth/server";
import { getMembershipRole } from "@repo/database/workspace";
import { decodeIntegrationOAuthState } from "../../../../../lib/integrations-hub/oauth-state.server";
import {
  exchangeCalendarCode,
  listGoogleCalendars,
} from "../../../../../lib/google-calendar";
import {
  logIntegrationActivity,
  upsertIntegrationAccount,
} from "@repo/database/integrations";
import { upsertIntegrationTokens } from "@repo/database/integration-tokens";

export const runtime = "nodejs";

function redirectTo(path: string, origin?: string) {
  return NextResponse.redirect(new URL(path, origin ?? getSiteUrl()));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError =
    url.searchParams.get("error_description") ??
    url.searchParams.get("error");

  if (oauthError) {
    return redirectTo(
      `/integrations/google-calendar?oauth=error&error=${encodeURIComponent(
        oauthError,
      )}`,
      origin,
    );
  }
  if (!code || !state) {
    return redirectTo(
      `/integrations/google-calendar?oauth=error&error=Missing%20OAuth%20code%20or%20state`,
      origin,
    );
  }

  try {
    const secret =
      process.env.INTEGRATION_OAUTH_STATE_SECRET?.trim() ||
      process.env.GOOGLE_CLIENT_SECRET?.trim() ||
      process.env.GMAIL_CLIENT_SECRET?.trim() ||
      "";
    if (!secret) throw new Error("Google OAuth state secret is not configured");

    const decoded = decodeIntegrationOAuthState({ state, secret });
    if (decoded.provider !== "google-calendar") {
      throw new Error("Unsupported Calendar OAuth provider");
    }
    const user = await getUser();
    if (
      !user ||
      user.id !== decoded.userId ||
      !(await getMembershipRole(decoded.workspaceId, user.id))
    ) {
      throw new Error("Your session expired. Please sign in and reconnect Google Calendar.");
    }

    const redirectUri = getGoogleOAuthRedirectUri(
      "/api/integrations/calendar/callback",
      origin,
    );
    const tokens = await exchangeCalendarCode({ code, redirectUri });
    const profile = await fetchGoogleOAuthProfile(tokens.accessToken);
    const calendars = await listGoogleCalendars(tokens.accessToken);
    const primary = calendars.find((calendar) => calendar.primary);

    const account = await upsertIntegrationAccount({
      workspaceId: decoded.workspaceId,
      provider: "google-calendar",
      userId: decoded.userId,
      accountEmail: profile.email,
      accountName: profile.name ?? "Google Calendar",
      externalAccountId: profile.externalAccountId,
      status: "connected",
      permissions: [
        "Read calendars",
        "Create events",
        "Update events",
        "Delete events",
        "Search events",
      ],
      scopes: tokens.scopes,
      health: "healthy",
      metadata: {
        calendarCount: calendars.length,
        primaryCalendarId: primary?.id ?? null,
        calendarIds: calendars.map((calendar) => calendar.id),
      },
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
      provider: "google-calendar",
      eventType: "connected",
      title: "Connected Google Calendar",
      body: profile.email,
      actorId: decoded.userId,
      metadata: { calendarCount: calendars.length },
    });

    return redirectTo("/integrations/google-calendar?connected=1", origin);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Calendar OAuth callback failed";
    return redirectTo(
      `/integrations/google-calendar?oauth=error&error=${encodeURIComponent(
        message,
      )}`,
      origin,
    );
  }
}
