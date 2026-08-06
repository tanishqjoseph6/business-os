import "server-only";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export type GoogleOAuthTokenSet = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  scopes: string[];
  tokenType: string;
};

export type GoogleOAuthProfile = {
  email: string | null;
  name: string | null;
  externalAccountId: string;
};

export function getGoogleOAuthCredentials() {
  const clientId =
    process.env.GMAIL_CLIENT_ID?.trim() ||
    process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret =
    process.env.GMAIL_CLIENT_SECRET?.trim() ||
    process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (or GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET) are required",
    );
  }
  return { clientId, clientSecret };
}

export function getGoogleOAuthRedirectUri(path: string, siteUrl?: string): string {
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (configured) return configured;
  const origin =
    siteUrl?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "http://localhost:3000";
  return `${origin.replace(/\/$/, "")}${path}`;
}

export function buildGoogleOAuthUrl(input: {
  redirectUri: string;
  state: string;
  scopes: string[];
  loginHint?: string;
}): string {
  const { clientId } = getGoogleOAuthCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: input.redirectUri,
    response_type: "code",
    scope: input.scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: input.state,
  });
  if (input.loginHint) params.set("login_hint", input.loginHint);
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

function expiresAt(seconds?: number): string | null {
  return seconds ? new Date(Date.now() + seconds * 1000).toISOString() : null;
}

export async function exchangeGoogleOAuthCode(input: {
  code: string;
  redirectUri: string;
  scopes?: string[];
}): Promise<GoogleOAuthTokenSet> {
  const { clientId, clientSecret } = getGoogleOAuthCredentials();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
    error?: string;
  };
  if (!response.ok || !data.access_token) {
    throw new Error(`Google token exchange failed: ${data.error ?? response.statusText}`);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: expiresAt(data.expires_in),
    scopes: data.scope?.split(/\s+/).filter(Boolean) ?? input.scopes ?? [],
    tokenType: data.token_type ?? "Bearer",
  };
}

export async function refreshGoogleOAuthToken(
  refreshToken: string,
): Promise<GoogleOAuthTokenSet> {
  const { clientId, clientSecret } = getGoogleOAuthCredentials();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
    error?: string;
  };
  if (!response.ok || !data.access_token) {
    throw new Error(`Google token refresh failed: ${data.error ?? response.statusText}`);
  }
  return {
    accessToken: data.access_token,
    refreshToken,
    expiresAt: expiresAt(data.expires_in),
    scopes: data.scope?.split(/\s+/).filter(Boolean) ?? [],
    tokenType: data.token_type ?? "Bearer",
  };
}

export async function fetchGoogleOAuthProfile(
  accessToken: string,
): Promise<GoogleOAuthProfile> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data = (await response.json()) as {
    id?: string;
    email?: string;
    name?: string;
  };
  if (!response.ok || !data.id) {
    throw new Error("Failed to load Google profile");
  }
  return {
    email: data.email ?? null,
    name: data.name ?? null,
    externalAccountId: data.id,
  };
}
