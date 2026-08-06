import type { Metadata } from "next";
import Link from "next/link";
import { Bug, LifeBuoy, Lightbulb, MessageSquareWarning } from "lucide-react";
import { MarketingShell } from "../../components/marketing/marketing-shell";
import { ContactForm } from "../../components/marketing/contact-form";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Contact VanderBase support, report issues, submit bugs, request features, and share feedback.",
  alternates: { canonical: "/support" },
};

const supportPaths = [
  {
    title: "Contact support",
    body: "Get help with onboarding, billing, workspace setup, or production readiness.",
    icon: LifeBuoy,
    href: "#contact-support",
  },
  {
    title: "Bug report",
    body: "Signed-in beta users can attach screenshots and track issue status.",
    icon: Bug,
    href: "/feedback",
  },
  {
    title: "Feature request",
    body: "Suggest improvements and vote on public beta roadmap items.",
    icon: Lightbulb,
    href: "/feedback",
  },
  {
    title: "Report issue",
    body: "Share security, permission, or reliability concerns with the team.",
    icon: MessageSquareWarning,
    href: "mailto:hello@vanderbase.com",
  },
];

export default function SupportPage() {
  return (
    <MarketingShell
      title="Support"
      subtitle="Public beta support, feedback, bug reports, feature requests, and issue reporting."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {supportPaths.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-3xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-primary/40"
            >
              <span className="inline-flex rounded-2xl bg-primary/15 p-2.5 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-4 text-base font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-secondary">{item.body}</p>
            </Link>
          );
        })}
      </div>

      <section id="contact-support" className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <ContactForm />
        <aside className="rounded-3xl border border-border bg-elevated/40 p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-primary">
            Beta support SLA
          </p>
          <h2 className="mt-2 text-xl font-semibold">What to include</h2>
          <ul className="mt-4 space-y-3 text-sm text-secondary">
            <li>Workspace name and affected module.</li>
            <li>Steps to reproduce and expected behavior.</li>
            <li>Browser/device, screenshots, and urgency.</li>
            <li>Whether the issue blocks beta launch work.</li>
          </ul>
        </aside>
      </section>
    </MarketingShell>
  );
}
