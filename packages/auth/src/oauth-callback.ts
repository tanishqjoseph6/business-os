import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { getSupabaseCookieOptions } from "@repo/database/auth-cookies";
import { getPublicSupabaseEnv } from "@repo/database/env";
import { NextResponse, type NextRequest } from "next/server";
import { getCallbackOrigin, sanitizeAuthNextPath } from "./site-url";

type SessionCookie = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function cookieNames(cookies: SessionCookie[]): string[] {
  return cookies.map((cookie) => cookie.name);
}

function isAuthSessionCookieName(name: string): boolean {
  return (
    (name.includes("auth-token") || name.startsWith("sb-")) &&
    !name.includes("code-verifier")
  );
}

function hasCodeVerifier(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("code-verifier"));
}

function responseAuthCookieCount(response: NextResponse): number {
  return response.cookies
    .getAll()
    .filter((cookie) => isAuthSessionCookieName(cookie.name)).length;
}

function requestCookieSummary(request: NextRequest) {
  const names = request.cookies.getAll().map((cookie) => cookie.name);
  return {
    cookieCount: names.length,
    hasCodeVerifier: names.some((name) => name.includes("code-verifier")),
    authCookieNames: names.filter(isAuthSessionCookieName),
  };
}

/**
 * Supabase OAuth / magic-link callback for Next.js App Router.
 *
 * Cookies must be written onto the redirect response that is returned.
 * Dropping Set-Cookie headers leaves middleware with no user, so the visitor
 * falls back to the public landing page with "Auth session missing!".
 */
export async function handleAuthCallback(request: NextRequest) {
  const origin = getCallbackOrigin(request);
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = sanitizeAuthNextPath(searchParams.get("next"));
  const isPasswordReset =
    next === "/reset-password" || next.startsWith("/reset-password/");
  const isEmailVerification =
    next === "/verify-email" || next.startsWith("/verify-email/");

  const failPath = isPasswordReset
    ? "/reset-password?error=invalid"
    : isEmailVerification
      ? "/verify-email?error=invalid"
      : "/signin?error=auth_callback";

  const inbound = requestCookieSummary(request);
  console.info("[auth.callback] reached", {
    origin,
    requestOrigin: request.nextUrl.origin,
    path: request.nextUrl.pathname,
    next,
    hasCode: Boolean(code),
    hasCodeVerifier: inbound.hasCodeVerifier,
    requestCookieCount: inbound.cookieCount,
    requestAuthCookieNames: inbound.authCookieNames,
    providerError: searchParams.get("error") ?? null,
    cookieDomain: getSupabaseCookieOptions().domain ?? "host-only",
  });

  if (!code) {
    const providerError =
      searchParams.get("error") ||
      searchParams.get("error_code") ||
      searchParams.get("error_description");
    const providerErrorCode = searchParams.get("error_code");
    const providerErrorDescription = searchParams.get("error_description");

    // Supabase → Google token exchange failed BEFORE our PKCE hop.
    // Typical URL: ?error=server_error&error_code=unexpected_failure&error_description=Unable+to+exchange+external+code:...
    const isExternalCodeExchangeFailure =
      /unable to exchange external code/i.test(providerErrorDescription ?? "") ||
      (searchParams.get("error") === "server_error" &&
        providerErrorCode === "unexpected_failure");

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

    console.warn("[auth.callback] missing code", {
      providerError: providerError ?? null,
      providerErrorCode,
      // Description is safe to log (contains only a short code prefix from GoTrue).
      providerErrorDescription,
      isExternalCodeExchangeFailure,
      hasCodeVerifier: inbound.hasCodeVerifier,
    });

    if (isExternalCodeExchangeFailure) {
      return NextResponse.redirect(
        new URL("/signin?error=google_exchange", origin),
      );
    }

    return NextResponse.redirect(new URL(failPath, origin));
  }

  // Build the redirect first, then write session cookies onto THIS response
  // inside setAll (Supabase SSR official pattern). Collecting cookies and
  // attaching later can miss Set-Cookie if anything short-circuits.
  let destination = new URL(next, origin);
  let redirectResponse = NextResponse.redirect(destination);
  redirectResponse.headers.set("Cache-Control", "no-store");

  let sessionCookies: SessionCookie[] = [];
  let setAllCalls = 0;

  const env = getPublicSupabaseEnv();
  const cookieOptions = getSupabaseCookieOptions();
  const supabase = createSupabaseServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          setAllCalls += 1;
          sessionCookies = cookiesToSet;
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            redirectResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  console.info("[auth.callback] exchanging code", {
    hasCode: true,
    hasCodeVerifier: hasCodeVerifier(request),
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.warn("[auth.callback] exchangeCodeForSession failed", {
      message: error?.message ?? "missing session",
      hasCodeVerifier: hasCodeVerifier(request),
      next,
      cookieCount: sessionCookies.length,
      setAllCalls,
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
      const verified = /already|verified|confirmed|reuse|consumed/i.test(
        message,
      );
      const errorCode = verified ? "verified" : expired ? "expired" : "invalid";
      return NextResponse.redirect(
        new URL(`/verify-email?error=${errorCode}`, origin),
      );
    }
    return NextResponse.redirect(new URL("/signin?error=auth_callback", origin));
  }

  // Email verification may need a different Location; rebuild redirect and
  // re-apply cookies so Set-Cookie still rides on the final response.
  if (isEmailVerification && data.user?.email_confirmed_at) {
    const verifiedDestination = new URL("/verify-email", origin);
    verifiedDestination.searchParams.set("verified", "1");
    if (data.user?.email) {
      verifiedDestination.searchParams.set("email", data.user.email);
    }
    const preservedNext = sanitizeAuthNextPath(searchParams.get("next"));
    if (preservedNext !== "/verify-email") {
      verifiedDestination.searchParams.set("next", preservedNext);
    }
    destination = verifiedDestination;
    const rebuilt = NextResponse.redirect(destination);
    rebuilt.headers.set("Cache-Control", "no-store");
    sessionCookies.forEach(({ name, value, options }) => {
      rebuilt.cookies.set(name, value, options);
    });
    redirectResponse = rebuilt;
  }

  // Session returned but setAll never fired — rebind tokens onto the same response.
  if (responseAuthCookieCount(redirectResponse) === 0 && data.session) {
    console.warn("[auth.callback] setAll missing after exchange — rebinding session", {
      setAllCalls,
    });
    const rebound = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
    if (rebound.error) {
      console.warn("[auth.callback] setSession rebind failed", {
        message: rebound.error.message,
      });
    }
  }

  const attachedCount = responseAuthCookieCount(redirectResponse);
  console.info("[auth.callback] session persisted", {
    next: `${destination.pathname}${destination.search}`,
    origin,
    userId: data.user?.id ?? null,
    emailConfirmed: Boolean(data.user?.email_confirmed_at),
    cookieCount: sessionCookies.length,
    attachedCount,
    setAllCalls,
    cookieNames: cookieNames(sessionCookies),
    cookieDomain: cookieOptions.domain ?? "host-only",
    exchangeOk: true,
  });

  if (sessionCookies.length === 0 || attachedCount === 0) {
    console.error("[auth.callback] session created but cookies missing on response", {
      cookieCount: sessionCookies.length,
      attachedCount,
      setAllCalls,
      next,
    });
    return NextResponse.redirect(new URL("/signin?error=auth_callback", origin));
  }

  return redirectResponse;
}
