import { getDashboardSnapshot } from "@repo/database/dashboard";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import { DashboardClient } from "../../../components/dashboard/dashboard-client";
import { QueryProvider } from "../../../components/app/query-provider";
import {
  displayNameFromEmail,
  greetingForNow,
} from "../../../components/dashboard/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const context = await resolveActiveWorkspace();
  if (!context) {
    return null;
  }

  const { active, email, memberships, userId } = context;
  const now = new Date();
  const snapshot = await getDashboardSnapshot({
    workspaceId: active.workspace.id,
    userId,
    membershipCount: memberships.length,
    role: active.role,
    workspaceName: active.workspace.name,
  });

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(now);

  return (
    <QueryProvider>
      <DashboardClient
        initialSnapshot={snapshot}
        workspaceId={active.workspace.id}
        email={email}
        greeting={greetingForNow(now)}
        displayName={displayNameFromEmail(email)}
        dateLabel={dateLabel}
      />
    </QueryProvider>
  );
}
