import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Inbox,
  Target,
  Users,
} from "lucide-react";
import type { DashboardSnapshot } from "@repo/types";
import { AnimatedMetric } from "../app/animated-metric";
import { formatCurrency, formatMetric } from "./format";

function metricOrEmpty(value: number, emptyLabel = "No data") {
  if (!Number.isFinite(value) || value <= 0) {
    return { display: "0", hint: emptyLabel, empty: true as const };
  }
  return { display: formatMetric(value), hint: null as string | null, empty: false as const };
}

export function KpiCards({ snapshot }: { snapshot: DashboardSnapshot }) {
  const revenue = snapshot.today.revenue || snapshot.kpis.revenue;
  const customers = snapshot.today.newCustomers;
  const openDeals = snapshot.kpis.openDeals;
  const tasks = snapshot.today.pendingTasks;
  const meetings = snapshot.today.meetings;
  const inbox = snapshot.kpis.unread;
  const ai = snapshot.kpis.aiCredits;
  const content = snapshot.content.aiDrafts + snapshot.content.summarizedThreads;

  const items: Array<{
    title: string;
    value: string;
    hint: string;
    href: string;
    icon: ReactNode;
    empty: boolean;
  }> = [
    {
      title: "Revenue",
      value: revenue > 0 ? formatCurrency(revenue) : "$0",
      hint:
        snapshot.kpis.openDeals > 0
          ? `${snapshot.kpis.openDeals} open deals · ${formatCurrency(snapshot.kpis.revenue)} pipeline`
          : "No revenue data yet",
      href: "/finance",
      icon: <CircleDollarSign className="h-4 w-4" aria-hidden />,
      empty: revenue <= 0,
    },
    {
      title: "New customers",
      value: metricOrEmpty(customers, "No new customers today").display,
      hint:
        snapshot.crm.contacts > 0
          ? `${formatMetric(snapshot.crm.contacts)} total contacts`
          : "No customers yet",
      href: "/crm/contacts",
      icon: <Users className="h-4 w-4" aria-hidden />,
      empty: customers <= 0,
    },
    {
      title: "Open deals",
      value: metricOrEmpty(openDeals).display,
      hint:
        openDeals > 0
          ? `${formatCurrency(snapshot.crm.pipelineValue)} pipeline value`
          : "No open deals",
      href: "/crm/deals",
      icon: <Target className="h-4 w-4" aria-hidden />,
      empty: openDeals <= 0,
    },
    {
      title: "Pending tasks",
      value: metricOrEmpty(tasks).display,
      hint: tasks > 0 ? "Inbox follow-ups and client tasks" : "No pending tasks",
      href: "/inbox/tasks",
      icon: <CheckCircle2 className="h-4 w-4" aria-hidden />,
      empty: tasks <= 0,
    },
    {
      title: "Calendar",
      value: metricOrEmpty(meetings).display,
      hint: meetings > 0 ? "Meetings scheduled for today" : "Nothing on the calendar",
      href: "/calendar",
      icon: <CalendarDays className="h-4 w-4" aria-hidden />,
      empty: meetings <= 0,
    },
    {
      title: "Inbox",
      value: metricOrEmpty(inbox).display,
      hint:
        snapshot.inbox.openThreads > 0
          ? `${formatMetric(snapshot.inbox.openThreads)} open threads`
          : "Inbox is clear",
      href: "/inbox",
      icon: <Inbox className="h-4 w-4" aria-hidden />,
      empty: inbox <= 0,
    },
    {
      title: "AI activity",
      value: metricOrEmpty(ai).display,
      hint:
        snapshot.chat.conversations > 0
          ? `${formatMetric(snapshot.chat.conversations)} conversations`
          : "No AI usage yet",
      href: "/chat",
      icon: <Bot className="h-4 w-4" aria-hidden />,
      empty: ai <= 0,
    },
    {
      title: "Content performance",
      value: metricOrEmpty(content).display,
      hint:
        content > 0
          ? `${formatMetric(snapshot.content.aiDrafts)} drafts · ${formatMetric(snapshot.content.summarizedThreads)} summaries`
          : "No content activity yet",
      href: "/content",
      icon: content > 0 ? <BarChart3 className="h-4 w-4" aria-hidden /> : <FileText className="h-4 w-4" aria-hidden />,
      empty: content <= 0,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.title}
          href={item.href}
          className="group relative overflow-hidden rounded-2xl border border-border/70 bg-[#12121a]/80 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-[#15151f]"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(circle at top right, rgba(255,122,0,0.08), transparent 55%)",
            }}
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted">{item.title}</p>
              <p
                className={`mt-2 text-2xl font-semibold tracking-tight ${
                  item.empty ? "text-muted" : "text-foreground"
                }`}
              >
                <AnimatedMetric value={item.value} />
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition group-hover:bg-primary/15">
              {item.icon}
            </span>
          </div>
          <p className="relative mt-3 text-xs leading-5 text-secondary">{item.hint}</p>
        </Link>
      ))}
    </section>
  );
}
