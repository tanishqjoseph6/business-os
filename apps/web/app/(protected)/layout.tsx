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
        { href: "/dashboard", label: "Dashboard", icon: <IconLayout />, section: "Workspace" },
        { href: "/ai", label: "AI Studio", icon: <IconSparkles />, section: "Workspace" },
        { href: "/chat", label: "Chat", icon: <IconSparkles />, section: "Workspace" },
        { href: "/crm", label: "CRM", icon: <IconBriefcase />, section: "Operate" },
        { href: "/projects", label: "Projects", icon: <IconUsers />, section: "Operate" },
        { href: "/documents", label: "Documents", icon: <IconMessage />, section: "Operate" },
        { href: "/inbox", label: "Inbox", icon: <IconMail />, section: "Operate" },
        { href: "/calendar", label: "Calendar OS", icon: <IconCalendar />, section: "Operate" },
        { href: "/content", label: "Content OS", icon: <IconPen />, section: "Create" },
        { href: "/social", label: "Social OS", icon: <IconShare />, section: "Create" },
        { href: "/website", label: "Website OS", icon: <IconGlobe />, section: "Create" },
        { href: "/analytics", label: "Analytics", icon: <IconLayout />, section: "Insights" },
        { href: "/finance", label: "Finance", icon: <IconCreditCard />, section: "Insights" },
        { href: "/integrations", label: "Integrations", icon: <IconPlug />, section: "Insights" },
        { href: "/notifications", label: "Notifications", icon: <IconBell />, section: "Account" },
        { href: "/team", label: "Team", icon: <IconUsers />, section: "Account" },
        { href: "/billing", label: "Billing", icon: <IconCreditCard />, section: "Account" },
        { href: "/settings", label: "Settings", icon: <IconSettings />, section: "Account" },
        { href: "/settings/security", label: "Security", icon: <IconShield />, section: "Account" },
        { href: "/feedback", label: "Feedback", icon: <IconMessage />, section: "Account" },
      ]}
    >
      {children}
    </ProtectedAppShell>
  );
}
