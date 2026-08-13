"use client";

import type { ReactNode } from "react";
import type { WorkspaceMembership } from "@repo/types";
import { AppShell, type AppShellNavItem } from "@repo/ui/app-shell";
import { Sparkles } from "lucide-react";
import { InviteMemberModal } from "../workspace/invite-member-modal";
import { WorkspaceSwitcher } from "../workspace/workspace-switcher";
import { AppChromeProvider } from "./app-chrome-provider";
import { AppCommandPalette, CommandPaletteTrigger } from "./app-command-palette";
import { AppErrorBoundary } from "./app-error-boundary";
import { AppHelpButton } from "./app-help-button";
import { AppNotificationsCenter } from "./app-notifications-center";
import { AppProfileMenu } from "./app-profile-menu";
import { AppQuickActionsPanel } from "./app-quick-actions-panel";
import { AppToastStack } from "./app-toast-stack";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { PageTransition } from "./page-transition";
import { BetaAnalyticsTracker } from "../analytics/beta-analytics-tracker";
import { KairosFab } from "../kairos/kairos-fab";
import { KairosChromeOverlays } from "../kairos/kairos-chrome-overlays";
import { KairosChatPanel, KairosChatProvider, useKairosChat } from "../kairos/chat";
import { VanderBaseLogo } from "../branding/vanderbase-logo";
import { FeedbackWidget } from "../feedback/feedback-widget";
import { ProductTour } from "../onboarding/product-tour";
import { PwaRegister } from "../pwa/pwa-register";
import { useNotificationsRealtime, useUnreadNotificationCount } from "../../lib/notifications-realtime";

function SidebarKairosCta({ collapsed }: { collapsed?: boolean }) {
  const { openChat } = useKairosChat();

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => openChat()}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-primary transition hover:border-primary/45 hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label="Ask Kairos"
        title="Ask Kairos"
      >
        <Sparkles className="h-4 w-4" aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openChat()}
      className="group flex w-full items-center gap-2.5 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/20 to-primary/5 px-3 py-2.5 text-left transition hover:border-primary/45 hover:from-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
        <Sparkles className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">Ask Kairos</span>
        <span className="block text-[11px] text-muted">AI business copilot</span>
      </span>
    </button>
  );
}

function ShellWithKairos({
  workspaceName,
  email,
  navWithBadge,
  memberships,
  activeWorkspaceId,
  workspaceId,
  userId,
  canInvite,
  role,
  count,
  children,
}: {
  workspaceName: string;
  email: string | null;
  navWithBadge: AppShellNavItem[];
  memberships: WorkspaceMembership[];
  activeWorkspaceId: string;
  workspaceId: string;
  userId: string;
  canInvite: boolean;
  role: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <AppShell
      brand="VanderBase"
      brandMark={<VanderBaseLogo size="sm" className="max-w-full" />}
      brandMarkCollapsed={<VanderBaseLogo variant="icon" size="md" />}
      brandHref="/dashboard"
      title={workspaceName}
      userEmail={email}
      navItems={navWithBadge}
      sidebarTop={
        <WorkspaceSwitcher workspaces={memberships} activeWorkspaceId={activeWorkspaceId} />
      }
      sidebarCta={(collapsed) => <SidebarKairosCta collapsed={collapsed} />}
      searchSlot={<CommandPaletteTrigger />}
      toolbar={
        <>
          <AppQuickActionsPanel />
          <AppNotificationsCenter
            workspaceId={workspaceId}
            userId={userId}
            initialUnreadCount={count}
          />
          <InviteMemberModal workspaceId={workspaceId} canInvite={canInvite} />
          <span className="hidden sm:inline">
            <AppProfileMenu email={email} role={role} />
          </span>
        </>
      }
      helpSlot={<AppHelpButton />}
    >
      <AppErrorBoundary>
        <PageTransition>{children}</PageTransition>
      </AppErrorBoundary>
    </AppShell>
  );
}

export function ProtectedAppShell({
  workspaceName,
  workspaceId,
  userId,
  email,
  role,
  canInvite,
  memberships,
  activeWorkspaceId,
  navItems,
  initialUnreadCount = 0,
  children,
}: {
  workspaceName: string;
  workspaceId: string;
  userId: string;
  email: string | null;
  role: string;
  canInvite: boolean;
  memberships: WorkspaceMembership[];
  activeWorkspaceId: string;
  navItems: AppShellNavItem[];
  initialUnreadCount?: number;
  children: ReactNode;
}) {
  const { count, setCount } = useUnreadNotificationCount({
    workspaceId,
    initialCount: initialUnreadCount,
  });

  useNotificationsRealtime({
    workspaceId,
    userId,
    enabled: true,
    onUnreadCountChange: setCount,
  });

  const navWithBadge = navItems.map((item) =>
    item.href === "/notifications" ? { ...item, badge: count } : item,
  );

  return (
    <KairosChatProvider>
      <AppChromeProvider
        workspaceContext={{
          workspaceId,
          organizationName: workspaceName,
          userEmail: email,
        }}
      >
        <ShellWithKairos
          workspaceName={workspaceName}
          email={email}
          navWithBadge={navWithBadge}
          memberships={memberships}
          activeWorkspaceId={activeWorkspaceId}
          workspaceId={workspaceId}
          userId={userId}
          canInvite={canInvite}
          role={role}
          count={count}
        >
          {children}
        </ShellWithKairos>
        <MobileBottomNav items={navWithBadge} />
        <BetaAnalyticsTracker />
        <PwaRegister />
        <ProductTour />
        <AppCommandPalette />
        <AppToastStack />
        <KairosFab />
        <FeedbackWidget />
        <KairosChatPanel />
        <KairosChromeOverlays />
      </AppChromeProvider>
    </KairosChatProvider>
  );
}
