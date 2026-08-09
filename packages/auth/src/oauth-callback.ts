import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@repo/database/env";
import { NextResponse, type NextRequest } from "next/server";
import { sanitizeAuthNextPath } from "./site-url";

type SessionCookie = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

/**
 * Supabase OAuth / magic-link callback for Next.js App Router.
 *
 * Critical bug this fixes: exchanging the code via `cookies()` from
 * `next/headers` and then returning a *new* `NextResponse.redirect()`
 * drops the session Set-Cookie headers. The browser never stores the
 * session, so middleware sees no user and the visitor stays on `/`.
 *
 * Cookies must be written onto the same redirect response that is returned.
 */
export async function handleAuthCallback(request: NextRequest) {
  // Use the origin that handled the callback. This keeps custom domains and
  // Vercel preview URLs consistent with the browser's OAuth request.
  const origin = request.nextUrl.origin;
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = sanitizeAuthNextPath(searchParams.get("next"));
  const isPasswordReset = next === "/reset-password" || next.startsWith("/reset-password/");
  const isEmailVerification =
    next === "/verify-email" ||
    next.startsWith("/verify-email/");

  const failPath = isPasswordReset
    ? "/reset-password?error=invalid"
    : isEmailVerification
      ? "/verify-email?error=invalid"
      : "/signin?error=auth_callback";

  if (!code) {
    // Auth provider may bounce back with error_* query params on a bad/used link.
    const providerError =
      searchParams.get("error") ||
      searchParams.get("error_code") ||
      searchParams.get("error_description");
    if (providerError && (isPasswordReset || isEmailVerification)) {
      const expired =
        /expired|otp_expired|flow_state_expired/i.test(providerError) ||
        searchParams.get("error_code") === "otp_expired";
      const verified =
        /already|verified|confirmed/i.test(providerError) ||
        searchParams.get("error_code") === "email_already_confirmed";
      const errorCode = verified ? "verified" : expired ? "expired" : "invalid";
      const path = isPasswordReset
        ? `/reset-password?error=${errorCode === "verified" ? "used" : errorCode}`
        : `/verify-email?error=${errorCode}`;
      return NextResponse.redirect(new URL(path, origin));
    }
    return NextResponse.redirect(new URL(failPath, origin));
  }

  const destination = new URL(next, origin);
  let sessionCookies: SessionCookie[] = [];

  const env = getPublicSupabaseEnv();
  const supabase = createSupabaseServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          sessionCookies = cookiesToSet;
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.warn("[auth.callback] exchangeCodeForSession failed", {
      message: error?.message ?? "missing session",
    });
    const message = error?.message ?? "";
    if (isPasswordReset) {
      const expired = /expired|otp_expired|flow_state/i.test(message);
      const used = /already|reuse|consumed/i.test(message);
      const errorCode = used ? "used" : expired ? "expired" : "invalid";
      return NextResponse.redirect(
        new URL(`/reset-password?error=${errorCode}`, origin),
      );
    }
    if (isEmailVerification) {
      const expired = /expired|otp_expired|flow_state/i.test(message);
      const verified = /already|verified|confirmed|reuse|consumed/i.test(message);
      const errorCode = verified ? "verified" : expired ? "expired" : "invalid";
      return NextResponse.redirect(
        new URL(`/verify-email?error=${errorCode}`, origin),
      );
    }
    return NextResponse.redirect(new URL("/signin?error=auth_callback", origin));
  }

  if (isEmailVerification && data.user?.email_confirmed_at) {
    const verifiedDestination = new URL("/verify-email", origin);
    verifiedDestination.searchParams.set("verified", "1");
    if (data.user.email) {
      verifiedDestination.searchParams.set("email", data.user.email);
    }
    const preservedNext = sanitizeAuthNextPath(searchParams.get("next"));
    if (preservedNext !== "/verify-email") {
      verifiedDestination.searchParams.set("next", preservedNext);
    }
    const nextResponse = NextResponse.redirect(verifiedDestination);
    applySessionCookies(nextResponse, sessionCookies);
    nextResponse.headers.set("Cache-Control", "no-store");
    return nextResponse;
  }

  const redirectResponse = NextResponse.redirect(destination);
  applySessionCookies(redirectResponse, sessionCookies);
  redirectResponse.headers.set("Cache-Control", "no-store");
  return redirectResponse;
}

function applySessionCookies(
  response: NextResponse,
  cookies: SessionCookie[],
): void {
  cookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, {
      path: "/",
      ...options,
    });
  });
}
