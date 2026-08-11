import type { CookieOptions } from "@supabase/ssr";

/**
 * Cookie options for Supabase Auth across browser / server / middleware / callback.
 *
 * Production VanderBase is served on www, with apex → www at the Vercel edge.
 * Host-only cookies break across that hop (PKCE verifier + session). Share them
 * on `.vanderbase.com` and always mark Secure in production.
 */
export function getSupabaseCookieOptions(): CookieOptions {
  const secure = process.env.NODE_ENV === "production";
  const options: CookieOptions = {
    path: "/",
    sameSite: "lax",
    secure,
  };

  if (!secure) {
    return options;
  }

  const host = readConfiguredHostname();
  const registrable = host?.replace(/^www\./, "") ?? null;

  // Only share across apex/www for our custom domain. Never set Domain on
  // localhost or a bare public-suffix host.
  if (registrable === "vanderbase.com") {
    return { ...options, domain: ".vanderbase.com" };
  }

  return options;
}

function readConfiguredHostname(): string | null {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!site) return "vanderbase.com";
  try {
    return new URL(site).hostname;
  } catch {
    return null;
  }
}
