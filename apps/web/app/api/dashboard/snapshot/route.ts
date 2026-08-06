import { NextResponse } from "next/server";
import { getDashboardSnapshot } from "@repo/database/dashboard";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await resolveActiveWorkspace();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await getDashboardSnapshot({
    workspaceId: context.active.workspace.id,
    userId: context.userId,
    membershipCount: context.memberships.length,
    role: context.active.role,
    workspaceName: context.active.workspace.name,
  });

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
    },
  });
}
