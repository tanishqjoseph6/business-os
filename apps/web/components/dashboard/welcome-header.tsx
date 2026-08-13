"use client";

import Link from "next/link";
import {
  Briefcase,
  CalendarDays,
  FileText,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { useKairosChat } from "../kairos/chat";

type WelcomeHeaderProps = {
  greeting: string;
  displayName: string;
  workspaceName: string;
  role: string;
  members: number;
  pendingInvites: number;
  dateLabel: string;
};

const QUICK = [
  { label: "Create deal", href: "/crm/deals", icon: Target },
  { label: "Add customer", href: "/crm/contacts", icon: Users },
  { label: "Create project", href: "/projects", icon: Briefcase },
  { label: "Draft content", href: "/content", icon: FileText },
] as const;

export function WelcomeHeader({
  greeting,
  displayName,
  workspaceName,
  role,
  members,
  pendingInvites,
  dateLabel,
}: WelcomeHeaderProps) {
  const { openChat } = useKairosChat();

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-[#0f0f15]/90 p-6 sm:p-8">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,122,0,0.14),transparent_48%),radial-gradient(circle_at_bottom_right,rgba(255,122,0,0.05),transparent_40%)]"
        aria-hidden
      />
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              Command Center
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {greeting}, {displayName}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-secondary sm:text-[15px]">
              Your operating system for CRM, Inbox, Content, Calendar and AI — unified
              in one workspace.{" "}
              <span className="text-muted">{workspaceName}</span>
            </p>
            <p className="text-xs text-muted">{dateLabel}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border/60 bg-[#12121a]/80 p-2 sm:min-w-[280px]">
            <MiniStat label="Members" value={members} />
            <MiniStat label="Invites" value={pendingInvites} />
            <MiniStat label="Role" value={role} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => openChat()}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Ask Kairos
          </Button>
          {QUICK.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Button type="button" size="sm" variant="secondary" className="gap-1.5">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {action.label}
                </Button>
              </Link>
            );
          })}
          <Link href="/calendar">
            <Button type="button" size="sm" variant="ghost" className="gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              Schedule
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-elevated/50 px-3 py-2.5 text-center transition hover:bg-elevated">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold capitalize text-foreground">
        {value}
      </p>
    </div>
  );
}
