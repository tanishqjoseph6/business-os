"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { DashboardSnapshot } from "@repo/types";
import {
  AiCommandCenter,
  ContentOverview,
  FinanceSnapshot,
  GrowthAnalytics,
  KpiCards,
  LeadsPipeline,
  NotificationsPanel,
  QuickActions,
  RecentConversations,
  TodaysAgenda,
  WelcomeHeader,
} from ".";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { SkeletonBlock } from "./section-shell";

const LazyOnboardingChecklist = dynamic(
  () =>
    import("../ai/onboarding-checklist").then(
      (module) => module.OnboardingChecklist,
    ),
  { loading: () => <SkeletonBlock className="h-40" />, ssr: false },
);

const LazyActivityTimeline = dynamic(
  () =>
    import("../ai/activity-timeline").then(
      (module) => module.ActivityTimeline,
    ),
  { loading: () => <SkeletonBlock className="h-72" />, ssr: false },
);

export function DashboardClient({
  initialSnapshot,
  workspaceId,
  greeting,
  displayName,
  dateLabel,
}: {
  initialSnapshot: DashboardSnapshot;
  workspaceId: string;
  email: string | null;
  greeting: string;
  displayName: string;
  dateLabel: string;
}) {
  const router = useRouter();
  const { data: snapshot, isFetching } = useQuery({
    queryKey: ["dashboard", workspaceId],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/snapshot", {
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Unable to refresh dashboard");
      return (await response.json()) as DashboardSnapshot;
    },
    initialData: initialSnapshot,
    staleTime: 60_000,
    placeholderData: initialSnapshot,
  });

  useEffect(() => {
    ["/inbox", "/crm", "/calendar", "/analytics", "/chat", "/projects"].forEach(
      (href) => router.prefetch(href),
    );
  }, [router]);

  if (!snapshot) return <DashboardSkeleton />;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 sm:gap-6">
      {isFetching ? (
        <span className="sr-only" role="status">
          Refreshing dashboard
        </span>
      ) : null}

      <WelcomeHeader
        greeting={greeting}
        displayName={displayName}
        workspaceName={snapshot.workspace.name}
        role={snapshot.workspace.role}
        members={snapshot.workspace.members}
        pendingInvites={snapshot.workspace.pendingInvites}
        dateLabel={dateLabel}
      />

      <KpiCards snapshot={snapshot} />

      <LazyOnboardingChecklist compact />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <AiCommandCenter snapshot={snapshot} />
        <div className="flex flex-col gap-4">
          <TodaysAgenda snapshot={snapshot} />
          <QuickActions />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RecentConversations snapshot={snapshot} />
        <ContentOverview snapshot={snapshot} />
        <NotificationsPanel snapshot={snapshot} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LeadsPipeline snapshot={snapshot} />
        <GrowthAnalytics snapshot={snapshot} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FinanceSnapshot snapshot={snapshot} />
        <section className="rounded-2xl border border-border/70 bg-[#12121a]/70 p-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                Workspace timeline
              </p>
              <h2 className="text-lg font-semibold text-foreground">Recent activity</h2>
            </div>
            <a
              href="/ai/activity"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Open full timeline
            </a>
          </div>
          <LazyActivityTimeline initialEvents={snapshot.activity.slice(0, 12)} />
        </section>
      </div>
    </div>
  );
}
