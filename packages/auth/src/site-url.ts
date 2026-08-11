/**
 * Origin for the current request.
 * Browser: always the active tab origin (fixes local dev when NEXT_PUBLIC_SITE_URL is production).
 * Server: NEXT_PUBLIC_SITE_URL, then optional request origin fallback.
 */
export function getSiteUrl(fallbackOrigin?: string): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) {
    return configured;
  }

  if (fallbackOrigin) {
    return fallbackOrigin.replace(/\/$/, "");
  }

  throw new Error("NEXT_PUBLIC_SITE_URL is not configured");
}

/**
 * Resolve the public origin that should receive OAuth cookie redirects.
 * Prefer the request host/proto Vercel forwards; fall back to configured site URL.
 */
export function getCallbackOrigin(request: {
  nextUrl: { origin: string };
  headers: { get(name: string): string | null };
}): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (process.env.NODE_ENV === "production" ? "https" : "http");

  if (host) {
    const requestOrigin = `${proto}://${host}`.replace(/\/$/, "");
    // Keep production cookies on the configured public domain when hosts match.
    if (configured) {
      try {
        const configuredHost = new URL(configured).host;
        const requestHost = new URL(requestOrigin).host;
        if (
          configuredHost === requestHost ||
          configuredHost === `www.${requestHost}` ||
          requestHost === `www.${configuredHost}`
        ) {
          return configured;
        }
      } catch {
        // Fall through to the request origin.
      }
    }
    return requestOrigin;
  }

  if (configured) return configured;
  return request.nextUrl.origin.replace(/\/$/, "");
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
  const site = baseUrl ?? getSiteUrl();
  const safeNext = sanitizeAuthNextPath(next);
  return `${site}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
