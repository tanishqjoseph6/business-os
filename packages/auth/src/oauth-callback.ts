import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@repo/database/env";
import { NextResponse, type NextRequest } from "next/server";
import { getCallbackOrigin, sanitizeAuthNextPath } from "./site-url";

type SessionCookie = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function applySessionCookies(
  response: NextResponse,
  cookies: SessionCookie[],
): void {
  cookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, {
      path: "/",
      sameSite: "lax",
      ...options,
      // OAuth completes over HTTPS in production; never weaken Secure.
      ...(process.env.NODE_ENV === "production" ? { secure: true } : {}),
    });
  });
}

function cookieNames(cookies: SessionCookie[]): string[] {
  return cookies.map((cookie) => cookie.name);
}

function hasCodeVerifier(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("code-verifier"));
}

/**
 * Supabase OAuth / magic-link callback for Next.js App Router.
 *
 * Cookies must be written onto the redirect response that is returned.
 * Dropping Set-Cookie headers leaves middleware with no user, so the visitor
 * falls back to the public landing page.
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

  console.info("[auth.callback] start", {
    origin,
    path: request.nextUrl.pathname,
    next,
    hasCode: Boolean(code),
    hasCodeVerifier: hasCodeVerifier(request),
    providerError: searchParams.get("error") ?? null,
  });

  if (!code) {
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
    console.warn("[auth.callback] missing code", {
      providerError: providerError ?? null,
    });
    return NextResponse.redirect(new URL(failPath, origin));
  }

  const destination = new URL(next, origin);
  let sessionCookies: SessionCookie[] = [];
  // Seed a redirect response and keep rewriting it inside setAll. Supabase
  // SSR calls setAll during exchangeCodeForSession; cookies must land on the
  // exact response object returned to the browser.
  let redirectResponse = NextResponse.redirect(destination);

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
          redirectResponse = NextResponse.redirect(destination);
          applySessionCookies(redirectResponse, cookiesToSet);
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.warn("[auth.callback] exchangeCodeForSession failed", {
      message: error?.message ?? "missing session",
      hasCodeVerifier: hasCodeVerifier(request),
      next,
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

  // Ensure cookies are present even if setAll was invoked on a prior response.
  applySessionCookies(redirectResponse, sessionCookies);
  redirectResponse.headers.set("Cache-Control", "no-store");

  if (sessionCookies.length === 0) {
    console.error("[auth.callback] session created but no cookies were set", {
      next,
      userId: data.user?.id ?? null,
      emailConfirmed: Boolean(data.user?.email_confirmed_at),
    });
  } else {
    console.info("[auth.callback] session persisted", {
      next,
      userId: data.user?.id ?? null,
      emailConfirmed: Boolean(data.user?.email_confirmed_at),
      cookieCount: sessionCookies.length,
      cookieNames: cookieNames(sessionCookies),
    });
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

  return redirectResponse;
}
