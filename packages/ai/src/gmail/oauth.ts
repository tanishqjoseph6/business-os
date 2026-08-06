import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://www.googleapis.com/oauth2/v2/userinfo";

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/calendar.events",
  "email",
  "profile",
] as const;

export type GoogleTokenSet = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string;
  scopes: string[];
  tokenType: string;
};

export type GoogleUserInfo = {
  email: string;
  name: string | null;
  id: string;
};

function requireGoogleOAuthEnv() {
  const clientId =
    process.env.GMAIL_CLIENT_ID?.trim() ||
    process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret =
    process.env.GMAIL_CLIENT_SECRET?.trim() ||
    process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET (or GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) are required for Gmail OAuth",
    );
  }
  return { clientId, clientSecret };
}

/**
 * Exact redirect_uri sent to Google authorize + token exchange.
 * This is custom Next.js OAuth — NOT Supabase Auth
 * (`https://<project>.supabase.co/auth/v1/callback`).
 *
 * Google Cloud Console → OAuth client → Authorized redirect URIs must include
 * this value character-for-character.
 */
export function getGmailOAuthRedirectUri(siteUrl?: string): string {
  const configured = process.env.GMAIL_REDIRECT_URI?.trim();
  if (configured) return configured;

  const raw = (siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL)?.trim();
  if (!raw) {
    throw new Error(
      "GMAIL_REDIRECT_URI or NEXT_PUBLIC_SITE_URL is required for Gmail OAuth redirect URI",
    );
  }

  let origin: string;
  try {
    origin = new URL(raw).origin;
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SITE_URL for Gmail OAuth redirect URI: ${raw}`,
    );
  }

  return `${origin}/api/inbox/oauth/callback`;
}

export function describeGmailOAuthConfig(siteUrl?: string): {
  redirectUri: string;
  clientIdSet: boolean;
  clientSecretSet: boolean;
  siteUrl: string;
  scopes: string[];
  googleCloudMustAllow: string;
} {
  const site = (siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL)?.trim();
  if (!site) {
    throw new Error("NEXT_PUBLIC_SITE_URL is required for Gmail OAuth");
  }
  const redirectUri = getGmailOAuthRedirectUri(siteUrl);
  return {
    redirectUri,
    clientIdSet: Boolean(
      process.env.GMAIL_CLIENT_ID?.trim() ||
        process.env.GOOGLE_CLIENT_ID?.trim(),
    ),
    clientSecretSet: Boolean(
      process.env.GMAIL_CLIENT_SECRET?.trim() ||
        process.env.GOOGLE_CLIENT_SECRET?.trim(),
    ),
    siteUrl: site,
    scopes: [...GMAIL_SCOPES],
    googleCloudMustAllow: redirectUri,
  };
}

export function buildGmailAuthUrl(input: {
  redirectUri: string;
  state: string;
  loginHint?: string;
}): string {
  const { clientId } = requireGoogleOAuthEnv();
  const redirectUri = input.redirectUri.trim();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GMAIL_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: input.state,
  });
  if (input.loginHint) params.set("login_hint", input.loginHint);

  // Root-cause logging for redirect_uri_mismatch — must match Google Cloud exactly.
  console.info("[gmail.oauth] redirect_uri (exact value sent to Google):", redirectUri);
  console.info("[gmail.oauth] client_id:", `${clientId.slice(0, 24)}…`);
  console.info("[gmail.oauth] scopes:", GMAIL_SCOPES.join(" "));
  console.info(
    "[gmail.oauth] Add this EXACT URI to Google Cloud → Authorized redirect URIs:",
    redirectUri,
  );

  return `${GOOGLE_AUTH}?${params.toString()}`;
}

export async function exchangeGmailAuthCode(input: {
  code: string;
  redirectUri: string;
}): Promise<GoogleTokenSet> {
  const { clientId, clientSecret } = requireGoogleOAuthEnv();
  const response = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gmail OAuth exchange failed: ${text}`);
  }
  const json = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
    token_type: string;
  };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt: new Date(Date.now() + json.expires_in * 1000).toISOString(),
    scopes: (json.scope ?? "").split(" ").filter(Boolean),
    tokenType: json.token_type,
  };
}

export async function refreshGmailAccessToken(input: {
  refreshToken: string;
}): Promise<GoogleTokenSet> {
  const { clientId, clientSecret } = requireGoogleOAuthEnv();
  const response = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: input.refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  const text = await response.text();
  if (!response.ok) {
    console.error("[gmail.oauth] token refresh failed", {
      status: response.status,
      statusText: response.statusText,
      body: text,
    });
    throw new Error(`Gmail token refresh failed (${response.status}): ${text}`);
  }
  const json = JSON.parse(text) as {
    access_token: string;
    expires_in: number;
    scope?: string;
    token_type: string;
  };
  const scopes = (json.scope ?? "").split(" ").filter(Boolean);
  console.info("[gmail.oauth] token refreshed", {
    expiresInSec: json.expires_in,
    scopes,
    hasGmailReadonly: scopes.some((scope) => scope.includes("gmail.readonly")),
    hasGmailModify: scopes.some((scope) => scope.includes("gmail.modify")),
  });
  return {
    accessToken: json.access_token,
    refreshToken: input.refreshToken,
    expiresAt: new Date(Date.now() + json.expires_in * 1000).toISOString(),
    scopes,
    tokenType: json.token_type,
  };
}

export async function fetchGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to load Google userinfo: ${text}`);
  }
  const json = (await response.json()) as {
    email?: string;
    name?: string;
    id?: string;
  };
  if (!json.email) throw new Error("Google userinfo missing email");
  return {
    email: json.email,
    name: json.name ?? null,
    id: json.id ?? json.email,
  };
}

export function encodeOAuthState(input: {
  workspaceId: string;
  userId: string;
  provider: "gmail";
  displayName?: string | null;
  returnTo?: string | null;
}): string {
  const payload = {
    ...input,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `${encoded}.${signOAuthState(encoded)}`;
}

export function decodeOAuthState(state: string): {
  workspaceId: string;
  userId: string;
  provider: "gmail";
  displayName?: string | null;
  returnTo?: string | null;
} {
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature || !verifyOAuthState(encoded, signature)) {
    throw new Error("Invalid OAuth state");
  }
  const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
    workspaceId?: string;
    userId?: string;
    provider?: string;
    displayName?: string | null;
    returnTo?: string | null;
    expiresAt?: number;
  };
  if (
    !parsed.workspaceId ||
    !parsed.userId ||
    parsed.provider !== "gmail" ||
    !parsed.expiresAt ||
    parsed.expiresAt < Date.now()
  ) {
    throw new Error("Invalid OAuth state");
  }
  return {
    workspaceId: parsed.workspaceId,
    userId: parsed.userId,
    provider: "gmail",
    displayName: parsed.displayName,
    returnTo: parsed.returnTo,
  };
}

function oauthStateSecret(): string {
  const secret =
    process.env.GMAIL_CLIENT_SECRET?.trim() ||
    process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!secret) throw new Error("OAuth state secret is not configured");
  return secret;
}

function signOAuthState(payload: string): string {
  return createHmac("sha256", oauthStateSecret())
    .update(payload)
    .digest("base64url");
}

function verifyOAuthState(payload: string, signature: string): boolean {
  try {
    const expected = Buffer.from(signOAuthState(payload), "utf8");
    const actual = Buffer.from(signature, "utf8");
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  } catch {
    return false;
  }
}
