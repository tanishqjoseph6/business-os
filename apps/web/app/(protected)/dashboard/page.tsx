import { getDashboardSnapshot } from "@repo/database/dashboard";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import { DashboardClient } from "../../../components/dashboard/dashboard-client";
import { QueryProvider } from "../../../components/app/query-provider";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const context = await resolveActiveWorkspace();
  if (!context) {
    return null;
  }

  const { active, email, memberships, userId } = context;
  const snapshot = await getDashboardSnapshot({
    workspaceId: active.workspace.id,
    userId,
    membershipCount: memberships.length,
    role: active.role,
    workspaceName: active.workspace.name,
  });

  return (
    <QueryProvider>
      <DashboardClient
        initialSnapshot={snapshot}
        workspaceId={active.workspace.id}
        email={email}
      />
    </QueryProvider>
  );
}
