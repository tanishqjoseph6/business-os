/**
 * Origin for the current request.
 * Browser: always the active tab origin (fixes local dev when NEXT_PUBLIC_SITE_URL is production).
 * Server: NEXT_PUBLIC_SITE_URL, then optional request origin fallback.
 *
 * Production VanderBase is canonical on www (Vercel redirects apex → www). OAuth
 * redirectTo and Site URL must use www so PKCE + session cookies stay on one host.
 */
export const PRODUCTION_CANONICAL_ORIGIN = "https://www.vanderbase.com";

export function canonicalizeSiteOrigin(origin: string): string {
  const normalized = origin.replace(/\/$/, "");
  if (
    normalized === "https://vanderbase.com" ||
    normalized === "http://vanderbase.com"
  ) {
    return PRODUCTION_CANONICAL_ORIGIN;
  }
  return normalized;
}

export function getSiteUrl(fallbackOrigin?: string): string {
  if (typeof window !== "undefined") {
    return canonicalizeSiteOrigin(window.location.origin);
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) {
    return canonicalizeSiteOrigin(configured);
  }

  if (fallbackOrigin) {
    return canonicalizeSiteOrigin(fallbackOrigin);
  }

  throw new Error("NEXT_PUBLIC_SITE_URL is not configured");
}

/**
 * Origin used for OAuth callback redirects.
 *
 * Prefer the request host so Set-Cookie matches the browser URL after edge
 * redirects. In production, apex is canonicalized to www because Vercel always
 * serves the app there.
 */
export function getCallbackOrigin(request: {
  nextUrl: { origin: string };
  headers: { get(name: string): string | null };
}): string {
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (process.env.NODE_ENV === "production" ? "https" : "http");

  if (host) {
    return canonicalizeSiteOrigin(`${proto}://${host}`);
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return canonicalizeSiteOrigin(configured);

  return canonicalizeSiteOrigin(request.nextUrl.origin);
}

export function sanitizeAuthNextPath(
  requested: string | null,
  fallback = "/dashboard",
): string {
  if (requested && requested.startsWith("/") && !requested.startsWith("//")) {
    return requested;
  }
  return fallback;
}

/** Supabase OAuth / email confirmation callback URL. */
export function buildAuthCallbackUrl(next = "/dashboard", baseUrl?: string): string {
  const site = canonicalizeSiteOrigin(baseUrl ?? getSiteUrl());
  const safeNext = sanitizeAuthNextPath(next);
  return `${site}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
