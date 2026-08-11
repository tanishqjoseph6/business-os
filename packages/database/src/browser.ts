import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import type { Database } from "@repo/types";
import { getSupabaseCookieOptions } from "./auth-cookies";
import { getPublicSupabaseEnv } from "./env";

export function createBrowserClient() {
  const env = getPublicSupabaseEnv();

  return createSupabaseBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: getSupabaseCookieOptions(),
    },
  );
}
