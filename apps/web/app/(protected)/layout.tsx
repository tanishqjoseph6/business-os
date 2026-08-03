import {
  IconBell,
  IconBriefcase,
  IconCalendar,
  IconCreditCard,
  IconGlobe,
  IconLayout,
  IconMail,
  IconMessage,
  IconPen,
  IconPlug,
  IconSettings,
  IconShare,
  IconShield,
  IconSparkles,
  IconUsers,
} from "@repo/ui/icons";
import { countUnreadNotificationsForUser } from "@repo/database/notifications";
import { ProtectedAppShell } from "../../components/app/protected-app-shell";
import { resolveActiveWorkspace } from "../../lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await resolveActiveWorkspace();
  if (!context) {
    return children;
  }

  const { active, memberships, userId, email } = context;
  const canInvite = active.role === "owner" || active.role === "admin";
  const unreadCount = await countUnreadNotificationsForUser({
    workspaceId: active.workspace.id,
    userId,
  });

  return (
    <ProtectedAppShell
      workspaceName={active.workspace.name}
      workspaceId={active.workspace.id}
      userId={userId}
      email={email}
      role={active.role}
      canInvite={canInvite}
      memberships={memberships}
      activeWorkspaceId={active.workspace.id}
      initialUnreadCount={unreadCount}
      navItems={[
        { href: "/dashboard", label: "Dashboard", icon: <IconLayout /> },
        { href: "/ai", label: "AI Studio", icon: <IconSparkles /> },
        { href: "/chat", label: "Chat", icon: <IconSparkles /> },
        { href: "/crm", label: "CRM", icon: <IconBriefcase /> },
        { href: "/projects", label: "Projects", icon: <IconUsers /> },
        { href: "/documents", label: "Documents", icon: <IconMessage /> },
        { href: "/inbox", label: "Inbox", icon: <IconMail /> },
        { href: "/integrations", label: "Integrations", icon: <IconPlug /> },
        { href: "/content", label: "Content OS", icon: <IconPen /> },
        { href: "/social", label: "Social OS", icon: <IconShare /> },
        { href: "/website", label: "Website OS", icon: <IconGlobe /> },
        { href: "/calendar", label: "Calendar OS", icon: <IconCalendar /> },
        { href: "/analytics", label: "Analytics", icon: <IconLayout /> },
        { href: "/finance", label: "Finance", icon: <IconCreditCard /> },
        { href: "/billing", label: "Billing", icon: <IconCreditCard /> },
        { href: "/notifications", label: "Notifications", icon: <IconBell /> },
        { href: "/settings/security", label: "Security", icon: <IconShield /> },
        { href: "/feedback", label: "Feedback", icon: <IconMessage /> },
        { href: "/team", label: "Team", icon: <IconUsers /> },
        { href: "/settings", label: "Settings", icon: <IconSettings /> },
      ]}
    >
      {children}
    </ProtectedAppShell>
  );
}
