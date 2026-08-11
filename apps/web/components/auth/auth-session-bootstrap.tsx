"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@repo/database/browser";

/**
 * Client-side session hydration for the public homepage.
 * Covers hash-based returns and cookies that the server component may not
 * have observed on the first paint after OAuth.
 */
export function AuthSessionBootstrap() {
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const supabase = createBrowserClient();
        // Touch the client so detectSessionInUrl can consume hash/query sessions.
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (error) {
          console.warn("[auth.bootstrap] getUser failed", {
            message: error.message,
          });
          return;
        }

        if (user) {
          console.info("[auth.bootstrap] session found — redirecting to dashboard", {
            userId: user.id,
            emailConfirmed: Boolean(user.email_confirmed_at),
          });
          window.location.replace("/dashboard");
        }
      } catch (error) {
        console.warn("[auth.bootstrap] unexpected failure", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
