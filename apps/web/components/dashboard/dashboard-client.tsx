"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
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
  { loading: () => <SkeletonBlock className="h-48" /> },
);

const LazyKairosSuggestions = dynamic(
  () =>
    import("../ai/kairos-suggestions").then(
      (module) => module.KairosSuggestions,
    ),
  { loading: () => <SkeletonBlock className="h-32" /> },
);

const LazyActivityTimeline = dynamic(
  () =>
    import("../ai/activity-timeline").then(
      (module) => module.ActivityTimeline,
    ),
  { loading: () => <SkeletonBlock className="h-72" /> },
);

const sectionMotion = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function DashboardClient({
  initialSnapshot,
  workspaceId,
  email,
}: {
  initialSnapshot: DashboardSnapshot;
  workspaceId: string;
  email: string | null;
}) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
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
    ["/inbox", "/crm", "/calendar", "/analytics", "/chat"].forEach((href) =>
      router.prefetch(href),
    );
  }, [router]);

  if (!snapshot) return <DashboardSkeleton />;

  return (
    <motion.div
      className="mx-auto flex w-full max-w-7xl flex-col gap-6"
      initial={reducedMotion ? false : "hidden"}
      animate={reducedMotion ? false : "visible"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.035 } },
      }}
    >
      {isFetching ? (
        <span className="sr-only" role="status">
          Refreshing dashboard
        </span>
      ) : null}

      <motion.div variants={sectionMotion}>
        <WelcomeHeader
          workspaceName={snapshot.workspace.name}
          email={email}
          role={snapshot.workspace.role}
          members={snapshot.workspace.members}
          pendingInvites={snapshot.workspace.pendingInvites}
        />
      </motion.div>

      <motion.div variants={sectionMotion}>
        <KpiCards snapshot={snapshot} />
      </motion.div>

      <motion.div variants={sectionMotion}>
        <LazyOnboardingChecklist compact />
      </motion.div>

      <motion.div variants={sectionMotion}>
        <LazyKairosSuggestions />
      </motion.div>

      <motion.div
        variants={sectionMotion}
        className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]"
      >
        <AiCommandCenter snapshot={snapshot} />
        <TodaysAgenda snapshot={snapshot} />
      </motion.div>

      <motion.div
        variants={sectionMotion}
        className="grid gap-4 lg:grid-cols-3"
      >
        <RecentConversations snapshot={snapshot} />
        <ContentOverview snapshot={snapshot} />
        <FinanceSnapshot snapshot={snapshot} />
      </motion.div>

      <motion.div
        variants={sectionMotion}
        className="grid gap-4 lg:grid-cols-2"
      >
        <LeadsPipeline snapshot={snapshot} />
        <GrowthAnalytics snapshot={snapshot} />
      </motion.div>

      <motion.div
        variants={sectionMotion}
        className="grid gap-4 lg:grid-cols-2"
      >
        <QuickActions />
        <NotificationsPanel snapshot={snapshot} />
      </motion.div>

      <motion.section variants={sectionMotion} className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Workspace timeline
            </p>
            <h2 className="text-lg font-semibold">Recent activity</h2>
          </div>
          <a
            href="/ai/activity"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Open full timeline
          </a>
        </div>
        <LazyActivityTimeline initialEvents={snapshot.activity.slice(0, 12)} />
      </motion.section>
    </motion.div>
  );
}
