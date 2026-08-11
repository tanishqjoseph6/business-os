import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@repo/types";
import { getSupabaseCookieOptions } from "./auth-cookies";
import { getPublicSupabaseEnv } from "./env";

export async function createServerClient() {
  const env = getPublicSupabaseEnv();
  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: getSupabaseCookieOptions(),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component; middleware persists session cookies.
          }
        },
      },
    },
  );
}
