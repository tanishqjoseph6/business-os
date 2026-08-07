import type { DashboardInsight, DashboardSnapshot } from "@repo/types";
import {
  contactDisplayName,
  listActivities,
  listCompanies,
  listContacts,
  listDeals,
} from "./crm";
import {
  listInboxAccounts,
  listInboxCalendarEvents,
  listInboxTasks,
  listInboxThreads,
} from "./inbox";
import { listConversations } from "./chat";
import { getWorkspaceCredits, listCreditTransactions } from "./credits";
import {
  listWorkspaceInvitations,
  listWorkspaceMembers,
} from "./workspace";
import { listWorkspaceActivityEvents } from "./activity";
import { listNotificationsForUser } from "./notifications";
import { listWorkspaceAiMemory } from "./workspace-memory";
import { listWorkspaceAiReplyDrafts } from "./ai-reply-drafts";
import { createServerClient } from "./server";

const DEAL_STAGES = [
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;

function startOfTodayIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfTodayIso() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function isToday(value: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const start = startOfTodayIso();
  const end = endOfTodayIso();
  return date >= start && date <= end;
}

function buildInsights(input: {
  leads: number;
  openTasks: number;
  upcomingEvents: number;
  unread: number;
  aiCredits: number;
  pipelineValue: number;
  aiDrafts: number;
}): DashboardInsight[] {
  const insights: DashboardInsight[] = [];

  if (input.leads > 0) {
    insights.push({
      title: "Lead momentum is building",
      body: `${input.leads} lead${input.leads === 1 ? "" : "s"} are ready for follow-up in CRM.`,
      module: "leads",
      severity: "success",
      actionUrl: "/crm/leads",
    });
  }

  if (input.openTasks > 0) {
    insights.push({
      title: "Tasks need attention",
      body: `${input.openTasks} open task${input.openTasks === 1 ? "" : "s"} are waiting across inbox workflows.`,
      module: "calendar",
      severity: "warning",
      actionUrl: "/inbox/tasks",
    });
  }

  if (input.upcomingEvents > 0) {
    insights.push({
      title: "Calendar is active",
      body: `${input.upcomingEvents} upcoming meeting${input.upcomingEvents === 1 ? "" : "s"} are on deck.`,
      module: "calendar",
      severity: "info",
      actionUrl: "/inbox/calendar",
    });
  }

  if (input.unread > 0) {
    insights.push({
      title: "Inbox has new opportunities",
      body: `${input.unread} unread thread${input.unread === 1 ? "" : "s"} may contain leads, tasks, or client updates.`,
      module: "inbox",
      severity: "info",
      actionUrl: "/inbox",
    });
  }

  if (input.aiDrafts > 0) {
    insights.push({
      title: "AI drafts are ready",
      body: `${input.aiDrafts} smart reply draft${input.aiDrafts === 1 ? "" : "s"} can be reviewed and sent.`,
      module: "ai_studio",
      severity: "success",
      actionUrl: "/inbox",
    });
  }

  if (input.aiCredits < 1000) {
    insights.push({
      title: "AI credits are running low",
      body: "Buy a one-time AI credit pack to keep smart replies, summaries, and assistant workflows available.",
      module: "billing",
      severity: "warning",
      actionUrl: "/credits",
    });
  }

  if (input.pipelineValue > 0) {
    insights.push({
      title: "Revenue pipeline is visible",
      body: `$${input.pipelineValue.toLocaleString()} is currently tracked in open deals.`,
      module: "finance",
      severity: "success",
      actionUrl: "/crm/deals",
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: "Workspace foundation is healthy",
      body: "Your workspace systems are connected. Open Chat, CRM, or Inbox to grow the OS.",
      module: "dashboard",
      severity: "success",
      actionUrl: "/chat",
    });
  }

  return insights.slice(0, 5);
}

export async function getDashboardSnapshot(input: {
  workspaceId: string;
  userId: string;
  membershipCount: number;
  role: string;
  workspaceName: string;
}): Promise<DashboardSnapshot> {
  const client = await createServerClient();
  const [
    crmData,
    inboxData,
    credits,
    creditTransactions,
    conversations,
    members,
    invitations,
    notifications,
    activity,
    memory,
    aiDrafts,
  ] = await Promise.all([
    Promise.all([
      listContacts({ workspaceId: input.workspaceId, client }),
      listCompanies({ workspaceId: input.workspaceId, client }),
      listDeals({ workspaceId: input.workspaceId, client }),
      listActivities({ workspaceId: input.workspaceId, client }),
    ]),
    Promise.all([
      listInboxAccounts({ workspaceId: input.workspaceId, client }),
      listInboxThreads({ workspaceId: input.workspaceId, client }),
      listInboxTasks({ workspaceId: input.workspaceId, status: "open", client }),
      listInboxCalendarEvents({
        workspaceId: input.workspaceId,
        upcomingOnly: true,
        client,
      }),
    ]),
    getWorkspaceCredits({ workspaceId: input.workspaceId, client }),
    listCreditTransactions({ workspaceId: input.workspaceId, limit: 6, client }),
    listConversations({ workspaceId: input.workspaceId, userId: input.userId, client }),
    listWorkspaceMembers(input.workspaceId, client),
    listWorkspaceInvitations(input.workspaceId, client),
    listNotificationsForUser({
      workspaceId: input.workspaceId,
      userId: input.userId,
      limit: 8,
      client,
    }),
    listWorkspaceActivityEvents({
      workspaceId: input.workspaceId,
      limit: 8,
      client,
    }),
    listWorkspaceAiMemory({
      workspaceId: input.workspaceId,
      limit: 5,
      client,
    }),
    listWorkspaceAiReplyDrafts({
      workspaceId: input.workspaceId,
      limit: 12,
      client,
    }).catch(() => []),
  ]);

  const [contacts, companies, deals, activities] = crmData;
  const [accounts, threads, tasks, events] = inboxData;
  const leads = contacts.filter((contact) => contact.lifecycleStage === "lead");
  const openDeals = deals.filter(
    (deal) => deal.stage !== "won" && deal.stage !== "lost",
  );
  const wonDeals = deals.filter((deal) => deal.stage === "won");
  const crm = {
    contacts: contacts.length,
    companies: companies.length,
    leads: leads.length,
    openDeals: openDeals.length,
    pipelineValue: openDeals.reduce((sum, deal) => sum + deal.amount, 0),
    activities: activities.length,
  };
  const inbox = {
    accounts: accounts.filter((account) => account.status === "connected").length,
    openThreads: threads.filter((thread) => thread.status === "open").length,
    unread: threads.filter((thread) => thread.isUnread).length,
    archived: threads.filter((thread) => thread.status === "archived").length,
    tasksOpen: tasks.length,
    upcomingMeetings: events.filter((event) => event.status === "scheduled").length,
  };

  const pendingInvites = invitations.filter(
    (invitation) => invitation.status === "pending",
  ).length;

  const wonValue = wonDeals.reduce((sum, deal) => sum + deal.amount, 0);
  const revenueToday = wonDeals
    .filter((deal) => isToday(deal.updatedAt))
    .reduce((sum, deal) => sum + deal.amount, 0);
  const newCustomersToday = contacts.filter((contact) =>
    isToday(contact.createdAt),
  ).length;

  const pipeline = DEAL_STAGES.map((stage) => {
    const stageDeals = deals.filter((deal) => deal.stage === stage);
    return {
      stage,
      count: stageDeals.length,
      value: stageDeals.reduce((sum, deal) => sum + deal.amount, 0),
    };
  });

  const openTasks = tasks.slice(0, 8);
  const upcomingEvents = events
    .filter((event) => event.status === "scheduled")
    .slice(0, 8);

  const todayTasks = tasks.filter(
    (task) => isToday(task.dueAt) || task.dueAt === null,
  );
  const todayEvents = events.filter(
    (event) => event.status === "scheduled" && isToday(event.startsAt),
  );

  const agenda = [
    ...todayEvents.map((event) => ({
      id: `event-${event.id}`,
      title: event.title,
      kind: "event" as const,
      at: event.startsAt,
      href: event.threadId
        ? `/inbox/threads/${event.threadId}`
        : "/inbox/calendar",
    })),
    ...todayTasks.slice(0, 6).map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      kind: "task" as const,
      at: task.dueAt,
      href: task.threadId ? `/inbox/threads/${task.threadId}` : "/inbox/tasks",
    })),
  ]
    .sort((a, b) => {
      if (!a.at) return 1;
      if (!b.at) return -1;
      return new Date(a.at).getTime() - new Date(b.at).getTime();
    })
    .slice(0, 8);

  const summarizedThreads = threads.filter(
    (thread) => Boolean(thread.aiSummary || thread.aiSummaryStructured),
  );
  const unreadThreads = threads.filter((thread) => thread.isUnread);

  const contentItems = [
    ...aiDrafts.slice(0, 4).map((draft) => ({
      id: draft.id,
      title: draft.subject || "Smart reply draft",
      kind: "draft" as const,
      subtitle: `${draft.style} · ${draft.status}`,
      href: `/inbox/threads/${draft.threadId}`,
      updatedAt: draft.updatedAt,
    })),
    ...summarizedThreads.slice(0, 4).map((thread) => ({
      id: thread.id,
      title: thread.subject || "(no subject)",
      kind: "summary" as const,
      subtitle:
        thread.aiSummaryStructured?.shortSummary ||
        thread.aiSummary ||
        thread.snippet ||
        "AI summary available",
      href: `/inbox/threads/${thread.id}`,
      updatedAt: thread.updatedAt,
    })),
    ...unreadThreads.slice(0, 3).map((thread) => ({
      id: `unread-${thread.id}`,
      title: thread.subject || "(no subject)",
      kind: "thread" as const,
      subtitle: thread.snippet || "Unread inbox thread",
      href: `/inbox/threads/${thread.id}`,
      updatedAt: thread.lastMessageAt,
    })),
  ].slice(0, 6);

  return {
    workspace: {
      name: input.workspaceName,
      members: members.length,
      workspaces: input.membershipCount,
      pendingInvites,
      role: input.role,
    },
    kpis: {
      revenue: crm.pipelineValue,
      revenueToday,
      newCustomersToday,
      leads: crm.leads,
      openTasks: inbox.tasksOpen,
      upcomingEvents: inbox.upcomingMeetings,
      aiCredits: credits.balance,
      unread: inbox.unread,
      openDeals: crm.openDeals,
    },
    today: {
      revenue: revenueToday,
      newCustomers: newCustomersToday,
      pendingTasks: todayTasks.length,
      meetings: todayEvents.length,
    },
    crm: {
      contacts: crm.contacts,
      companies: crm.companies,
      openDeals: crm.openDeals,
      pipelineValue: crm.pipelineValue,
      activities: crm.activities,
      wonDeals: wonDeals.length,
      wonValue,
    },
    inbox: {
      unread: inbox.unread,
      openThreads: inbox.openThreads,
      openTasks: inbox.tasksOpen,
      upcomingMeetings: inbox.upcomingMeetings,
    },
    chat: {
      conversations: conversations.length,
    },
    finance: {
      pipelineValue: crm.pipelineValue,
      openDeals: openDeals.length,
      wonDeals: wonDeals.length,
      wonValue,
      aiCredits: credits.balance,
      recentCredits: creditTransactions.map((transaction) => ({
        id: transaction.id,
        amount: transaction.amount,
        reason: transaction.reason.replaceAll("_", " "),
        createdAt: transaction.createdAt,
      })),
    },
    growth: {
      contacts: crm.contacts,
      companies: crm.companies,
      leads: crm.leads,
      openDeals: crm.openDeals,
      conversations: conversations.length,
      unread: inbox.unread,
      members: members.length,
    },
    content: {
      aiDrafts: aiDrafts.length,
      summarizedThreads: summarizedThreads.length,
      unreadThreads: unreadThreads.length,
      items: contentItems,
    },
    pipeline,
    leads: leads.slice(0, 6).map((lead) => ({
      id: lead.id,
      name: contactDisplayName(lead),
      email: lead.email,
      stage: lead.lifecycleStage,
      source: lead.source,
      updatedAt: lead.updatedAt,
      href: "/crm/leads",
    })),
    deals: openDeals.slice(0, 6).map((deal) => ({
      id: deal.id,
      title: deal.title,
      amount: deal.amount,
      stage: deal.stage,
      probability: deal.probability,
      href: "/crm/deals",
    })),
    conversations: conversations.slice(0, 6).map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      model: conversation.model,
      provider: conversation.provider,
      pinned: conversation.pinned,
      updatedAt: conversation.updatedAt,
      href: `/chat?c=${conversation.id}`,
    })),
    agenda,
    notifications,
    activity:
      activity.length > 0
        ? activity
        : creditTransactions.map((transaction) => ({
            id: transaction.id,
            workspaceId: transaction.workspaceId,
            module: "billing",
            eventType: "credit_transaction",
            title: transaction.reason.replaceAll("_", " "),
            body: `${transaction.amount > 0 ? "+" : ""}${transaction.amount} AI credits`,
            entityType: "credit_transaction",
            entityId: transaction.id,
            actorId: transaction.userId,
            actionUrl: "/billing",
            metadata: transaction.metadata,
            createdAt: transaction.createdAt,
          })),
    memory,
    insights: buildInsights({
      leads: crm.leads,
      openTasks: inbox.tasksOpen,
      upcomingEvents: inbox.upcomingMeetings,
      unread: inbox.unread,
      aiCredits: credits.balance,
      pipelineValue: crm.pipelineValue,
      aiDrafts: aiDrafts.length,
    }),
    tasks: openTasks.map((task) => ({
      id: task.id,
      title: task.title,
      dueAt: task.dueAt,
      actionUrl: task.threadId
        ? `/inbox/threads/${task.threadId}`
        : "/inbox/tasks",
    })),
    events: upcomingEvents.map((event) => ({
      id: event.id,
      title: event.title,
      startsAt: event.startsAt,
      actionUrl: event.threadId
        ? `/inbox/threads/${event.threadId}`
        : "/inbox/calendar",
    })),
  };
}
