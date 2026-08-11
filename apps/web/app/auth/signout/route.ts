import { NextResponse, type NextRequest } from "next/server";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@repo/database/env";
import { writeSecurityAuditLog } from "@repo/database/security";

async function signOutWithResponse(request: NextRequest) {
  // Requirement: logout clears the session and returns to the landing page.
  const destination = new URL("/", request.nextUrl.origin);
  const response = NextResponse.redirect(destination, { status: 303 });

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
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              path: "/",
              ...options,
            });
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.warn("[auth.signout] signOut failed", { message: error.message });
  } else {
    console.info("[auth.signout] session cleared", {
      hadUser: Boolean(user),
      userId: user?.id ?? null,
    });
  }
  if (user) {
    await writeSecurityAuditLog({ actorUserId: user.id, eventType: "logout" });
  }

  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  return signOutWithResponse(request);
}

export async function GET(request: NextRequest) {
  return signOutWithResponse(request);
}
