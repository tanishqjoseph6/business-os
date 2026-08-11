import { createMiddlewareClient, copySessionCookies } from "@repo/database/middleware";
import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_ROUTES,
  AUTH_CALLBACK_PATH,
  ONBOARDING_PATH,
  isGuestOnlyRoute,
  isPublicApiRoute,
  isPublicRoute,
  requiresAdmin,
} from "./constants";
import { userHasAdminAccess } from "./roles";
import { consumeRateLimit } from "./rate-limit";

export type MiddlewareAuthOptions = {
  loginPath?: string;
  /** When true (default), every non-public route requires authentication. */
  protectAllRoutes?: boolean;
  checkWorkspaceOnboarding?: boolean;
};

function isServerActionRequest(request: NextRequest): boolean {
  return (
    request.method === "POST" &&
    (request.headers.has("next-action") ||
      request.headers.has("Next-Action"))
  );
}

function isRscRequest(request: NextRequest): boolean {
  return (
    request.headers.get("rsc") === "1" ||
    request.headers.get("accept") === "text/x-component"
  );
}

/**
 * Redirects that Server Actions / RSC can understand.
 * Copies refreshed Supabase session cookies onto redirect responses.
 */
function redirectForRequest(
  request: NextRequest,
  destination: URL,
  sessionResponse?: NextResponse,
) {
  if (isServerActionRequest(request) || isRscRequest(request)) {
    const response = new NextResponse(null, {
      status: 303,
      headers: {
        "x-action-redirect": `${destination.pathname}${destination.search}`,
      },
    });
    if (sessionResponse) {
      copySessionCookies(sessionResponse, response);
    }
    return response;
  }

  const redirect = NextResponse.redirect(destination);
  if (sessionResponse) {
    copySessionCookies(sessionResponse, redirect);
  }
  return redirect;
}

export async function updateSession(request: NextRequest) {
  const { supabase, getResponse } = createMiddlewareClient(request);
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.warn("[auth.middleware] getUser error", {
        message: error.message,
        path: request.nextUrl.pathname,
      });
    }
    return { response: getResponse(), user: user ?? null, supabase };
  } catch (error) {
    console.warn("[auth.middleware] getUser threw", {
      error: error instanceof Error ? error.message : String(error),
      path: request.nextUrl.pathname,
    });
    return { response: getResponse(), user: null, supabase };
  }
}

export function createWebMiddleware(options: MiddlewareAuthOptions = {}) {
  const loginPath = options.loginPath ?? "/signin";
  const checkWorkspaceOnboarding = options.checkWorkspaceOnboarding ?? true;

  return async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public read-only API routes must not run session refresh or auth gates.
    if (isPublicApiRoute(pathname)) {
      return NextResponse.next();
    }

    // If Supabase returns the OAuth code to Site URL (/), forward it to the
    // App Router callback so exchangeCodeForSession can run.
    const oauthCode = request.nextUrl.searchParams.get("code");
    if (
      oauthCode &&
      pathname !== AUTH_CALLBACK_PATH &&
      !pathname.startsWith(`${AUTH_CALLBACK_PATH}/`) &&
      !pathname.startsWith("/api/")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = AUTH_CALLBACK_PATH;
      if (!url.searchParams.has("next")) {
        url.searchParams.set("next", "/dashboard");
      }
      console.info("[auth.middleware] forwarding OAuth code to callback", {
        from: pathname,
        next: url.searchParams.get("next"),
        hasCodeVerifier: request.cookies
          .getAll()
          .some((cookie) => cookie.name.includes("code-verifier")),
      });
      return NextResponse.redirect(url);
    }

    const authRateLimitedPaths = [
      "/signin",
      "/signup",
      "/login",
      "/forgot-password",
      "/reset-password",
    ];
    if (
      request.method === "POST" &&
      authRateLimitedPaths.some(
        (path) =>
          request.nextUrl.pathname === path ||
          request.nextUrl.pathname.startsWith(`${path}/`),
      )
    ) {
      const forwardedFor = request.headers.get("x-forwarded-for");
      const clientKey =
        forwardedFor?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        "unknown";
      const result = consumeRateLimit(
        `auth:${request.nextUrl.pathname}:${clientKey}`,
        12,
        60_000,
      );
      if (!result.allowed) {
        return new NextResponse(
          JSON.stringify({ error: "Too many requests. Try again later." }),
          {
            status: 429,
            headers: {
              "content-type": "application/json",
              "retry-after": String(result.retryAfterSeconds),
            },
          },
        );
      }
    }

    const { response, user, supabase } = await updateSession(request);

    // Alias /login → /signin (guests) or /dashboard (authenticated).
    if (pathname === "/login" || pathname.startsWith("/login/")) {
      const url = request.nextUrl.clone();
      url.pathname = user ? "/dashboard" : loginPath;
      url.search = "";
      return redirectForRequest(request, url, response);
    }

    if (isGuestOnlyRoute(pathname) && user) {
      const nextParam = request.nextUrl.searchParams.get("next");
      const oauth = request.nextUrl.searchParams.get("oauth");
      const url = request.nextUrl.clone();

      if (!user.email_confirmed_at) {
        url.pathname = "/verify-email";
        url.search = "";
        if (user.email) url.searchParams.set("email", user.email);
        if (
          nextParam &&
          nextParam.startsWith("/") &&
          !nextParam.startsWith("//")
        ) {
          url.searchParams.set("next", nextParam);
        }
        url.searchParams.set("from", "signin");
        return redirectForRequest(request, url, response);
      }

      if (
        oauth &&
        nextParam &&
        nextParam.startsWith("/") &&
        !nextParam.startsWith("//")
      ) {
        url.pathname = nextParam;
        url.search = "";
        if (oauth === "connected" || oauth === "error") {
          url.searchParams.set("oauth", oauth);
          const email = request.nextUrl.searchParams.get("email");
          const message = request.nextUrl.searchParams.get("message");
          if (email) url.searchParams.set("email", email);
          if (message) url.searchParams.set("message", message);
        }
        return redirectForRequest(request, url, response);
      }
      url.pathname = "/dashboard";
      url.search = "";
      return redirectForRequest(request, url, response);
    }

    // Recovery links exchange a code for a short-lived session via /auth/callback.
    // Allow the page itself to render invalid/expired states when there is no session.
    if (pathname === "/reset-password" || pathname.startsWith("/reset-password/")) {
      return response;
    }

    const isVerificationRoute =
      pathname === "/verify-email" || pathname.startsWith("/verify-email/");
    if (user && !user.email_confirmed_at && !isVerificationRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/verify-email";
      url.search = "";
      if (user.email) url.searchParams.set("email", user.email);
      const returnPath = `${pathname}${request.nextUrl.search}`;
      if (returnPath.startsWith("/") && !returnPath.startsWith("//")) {
        url.searchParams.set("next", returnPath);
      }
      return redirectForRequest(request, url, response);
    }

    // Authenticated users should never linger on the marketing homepage.
    if (user && pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return redirectForRequest(request, url, response);
    }

    const isPublic = isPublicRoute(pathname);
    const protectAll = options.protectAllRoutes ?? true;
    const needsAuth = protectAll ? !isPublic : false;

    if (needsAuth && !user) {
      const url = request.nextUrl.clone();
      const oauth = url.searchParams.get("oauth");
      const email = url.searchParams.get("email");
      const message = url.searchParams.get("message");
      url.pathname = loginPath;
      url.search = "";
      url.searchParams.set("next", pathname);
      if (oauth) url.searchParams.set("oauth", oauth);
      if (email) url.searchParams.set("email", email);
      if (message) url.searchParams.set("message", message);
      return redirectForRequest(request, url, response);
    }

    if (user && checkWorkspaceOnboarding && !isPublic) {
      const { count, error } = await supabase
        .from("workspace_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const hasWorkspace = !error && (count ?? 0) > 0;
      const onOnboarding =
        pathname === ONBOARDING_PATH || pathname.startsWith(`${ONBOARDING_PATH}/`);

      if (!hasWorkspace && !onOnboarding) {
        const url = request.nextUrl.clone();
        url.pathname = ONBOARDING_PATH;
        url.search = "";
        return redirectForRequest(request, url, response);
      }

      if (hasWorkspace && onOnboarding) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        url.search = "";
        return redirectForRequest(request, url, response);
      }
    }

    return response;
  };
}

export function createAdminMiddleware() {
  return async function middleware(request: NextRequest) {
    const { response, user, supabase } = await updateSession(request);
    const { pathname } = request.nextUrl;

    if (pathname === ADMIN_ROUTES.login) {
      if (user) {
        const isAdmin = await userHasAdminAccess(user.id, supabase);
        if (isAdmin) {
          const url = request.nextUrl.clone();
          url.pathname = "/";
          return redirectForRequest(request, url, response);
        }
      }
      return response;
    }

    if (pathname === ADMIN_ROUTES.unauthorized) {
      return response;
    }

    if (!requiresAdmin(pathname)) {
      return response;
    }

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_ROUTES.login;
      url.searchParams.set("next", pathname);
      return redirectForRequest(request, url, response);
    }

    const isAdmin = await userHasAdminAccess(user.id, supabase);
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_ROUTES.unauthorized;
      return redirectForRequest(request, url, response);
    }

    return response;
  };
}
