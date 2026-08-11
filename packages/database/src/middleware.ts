import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@repo/types";
import { getSupabaseCookieOptions } from "./auth-cookies";
import { getPublicSupabaseEnv } from "./env";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function applyCookies(response: NextResponse, cookiesToSet: CookieToSet[]) {
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
}

/**
 * Copy Set-Cookie values from a middleware session response onto a redirect.
 * Preserves options captured during setAll (path, maxAge, httpOnly, etc.).
 */
export function copySessionCookies(from: NextResponse, to: NextResponse) {
  const stored = (from as NextResponse & { __supabaseCookies?: CookieToSet[] })
    .__supabaseCookies;
  if (stored?.length) {
    applyCookies(to, stored);
    return;
  }
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value, { path: "/", ...getSupabaseCookieOptions() });
  });
}

export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });
  let pendingCookies: CookieToSet[] = [];

  const env = getPublicSupabaseEnv();

  const supabase = createSupabaseServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: getSupabaseCookieOptions(),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          pendingCookies = cookiesToSet;
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          applyCookies(response, cookiesToSet);
          (
            response as NextResponse & { __supabaseCookies?: CookieToSet[] }
          ).__supabaseCookies = cookiesToSet;
        },
      },
    },
  );

  return {
    supabase,
    getResponse() {
      if (pendingCookies.length) {
        (
          response as NextResponse & { __supabaseCookies?: CookieToSet[] }
        ).__supabaseCookies = pendingCookies;
      }
      return response;
    },
  };
}
