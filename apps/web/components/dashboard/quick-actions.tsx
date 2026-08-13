"use client";

import Link from "next/link";
import {
  Briefcase,
  CalendarDays,
  FileText,
  Globe,
  MailPlus,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useKairosChat } from "../kairos/chat";
import { SectionShell } from "./section-shell";

const ACTIONS = [
  {
    id: "kairos",
    label: "Ask Kairos",
    description: "Open your AI copilot",
    href: "/chat",
    icon: Sparkles,
    kairos: true,
  },
  {
    id: "deal",
    label: "Create a deal",
    description: "Add to CRM pipeline",
    href: "/crm/deals",
    icon: Target,
  },
  {
    id: "customer",
    label: "Add customer",
    description: "Create a contact",
    href: "/crm/contacts",
    icon: Users,
  },
  {
    id: "email",
    label: "Draft an email",
    description: "Jump into Inbox",
    href: "/inbox",
    icon: MailPlus,
  },
  {
    id: "content",
    label: "Create content",
    description: "Open Content OS",
    href: "/content",
    icon: FileText,
  },
  {
    id: "meeting",
    label: "Schedule meeting",
    description: "Open Calendar OS",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    id: "project",
    label: "Create project",
    description: "Start delivery work",
    href: "/projects",
    icon: Briefcase,
  },
  {
    id: "website",
    label: "Generate website",
    description: "Open Website OS",
    href: "/website",
    icon: Globe,
  },
] as const;

export function QuickActions() {
  const { openChat } = useKairosChat();

  return (
    <SectionShell
      title="Quick actions"
      description="Jump into the highest-leverage workflows across VanderBase."
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          const content = (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition group-hover:bg-primary/15">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  {action.label}
                </span>
                <span className="block text-xs text-muted">{action.description}</span>
              </span>
            </>
          );

          if ("kairos" in action && action.kairos) {
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => openChat()}
                className="group flex items-center gap-3 rounded-xl border border-border/70 bg-elevated/50 px-3 py-3 text-left transition duration-200 hover:border-primary/40 hover:bg-surface"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={action.id}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl border border-border/70 bg-elevated/50 px-3 py-3 transition duration-200 hover:border-primary/40 hover:bg-surface"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </SectionShell>
  );
}
