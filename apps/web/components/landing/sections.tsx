"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Fragment, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
  CalendarDays,
  Check,
  ChevronDown,
  Globe,
  Mail,
  MessageSquare,
  PenLine,
  Share2,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { COMPARISON_ROWS, PRICING_PLANS, STORAGE_ADDONS } from "../../lib/pricing";
import { KairosAvatar } from "../kairos/kairos-avatar";
import { JoinWaitlistButton } from "./ai-assistant-widget";
import { Reveal } from "./atmosphere";
import { useLandingInteractions } from "./landing-interactions";
import { WaitlistCounter } from "../waitlist/waitlist-counter";
import { WaitlistSocialProof } from "../waitlist/waitlist-social-proof";
import { useWaitlistStats } from "../waitlist/use-waitlist-stats";
import { IntegrationsShowcase } from "./integrations-showcase";
import { ProductMockup } from "./product-mockup";
import { InstagramSocialLink } from "../branding/instagram-social-link";
import { VanderBaseLogo } from "../branding/vanderbase-logo";

const features = [
  { id: "crm", title: "CRM", body: "Contacts, deals, tags, and pipeline in one native VanderBase system.", icon: Briefcase },
  { id: "inbox", title: "AI Inbox", body: "Summaries, smart replies, and meeting detection that stay in context.", icon: Mail },
  { id: "chat", title: "AI Chat", body: "A workspace-aware assistant with tools, memory, and credits.", icon: MessageSquare },
  { id: "content", title: "Content OS", body: "Draft, plan, and publish from a single content system.", icon: PenLine },
  { id: "social", title: "Social OS", body: "Schedule and analyze across the channels that matter.", icon: Share2 },
  { id: "website", title: "Website Builder", body: "Landing pages, forms, and link surfaces without leaving the OS.", icon: Globe },
  { id: "calendar", title: "Calendar", body: "Availability, bookings, meetings, and reminders in sync.", icon: CalendarDays },
  { id: "leads", title: "Lead Generation", body: "Capture, score, enrich, and route leads into CRM.", icon: Star },
  { id: "finance", title: "Finance", body: "Revenue, invoices, and cash-flow visibility for operators.", icon: Wallet },
  { id: "analytics", title: "Analytics", body: "Cross-module KPIs, comparisons, and AI insights.", icon: BarChart3 },
  { id: "studio", title: "AI Studio", body: "Agents, workflows, prompts, and automations with approval gates.", icon: Bot },
];

const prompts = [
  "Plan product launch",
  "Generate LinkedIn content",
  "Summarize inbox",
  "Forecast revenue",
  "Create landing page",
  "Analyze pipeline",
];

const responses: Record<string, string> = {
  "Plan product launch": "Launch plan ready: positioning, content calendar, outreach sequence, and launch-day checklist across CRM, Content, and Social.",
  "Generate LinkedIn content": "Drafted a founder update with a hook, proof point, CTA, and suggested publish window for Thursday 9:15 AM.",
  "Summarize inbox": "12 threads reviewed. 3 need replies, 2 contain invoices, 1 meeting request was synced to Calendar.",
  "Forecast revenue": "Based on open pipeline and win rates, next 30 days projects $86k–$104k with two deals at risk.",
  "Create landing page": "Generated a Builder-ready landing outline: hero, proof, offer, form, FAQ, and CRM capture fields.",
  "Analyze pipeline": "Negotiation stage is congested. Recommend follow-ups on Acme and Northwind before Friday.",
};

const faqs: [string, string][] = [
  ["What is VanderBase?", "VanderBase is one AI-native platform with CRM, Inbox, Content, Calendar, Analytics, and Kairos in the same workspace."],
  ["What can I do on the Free plan?", "Start with one workspace, up to 3 team members, 100 AI credits, and basic Business OS features—forever free."],
  ["How do AI credits work?", "Credits are shared across the workspace. Free and Pro include a starter pool. Buy one-time credit packs only when you need more—never a monthly subscription."],
  ["Can teams collaborate?", "Yes. Free includes up to 3 members and Pro includes up to 10. Additional seats are $25 each as a one-time purchase."],
  ["Do you support Stripe and Razorpay?", "Checkout uses one-time payments via Stripe or Razorpay—not recurring subscriptions."],
];

export function SocialProof() {
  const { stats } = useWaitlistStats();

  return (
    <section className="relative px-5 py-20 sm:px-8" id="waitlist">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <WaitlistCounter count={stats.count} className="text-base sm:text-lg" />
            <WaitlistSocialProof recent={stats.recent} count={stats.count} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function OneBusinessOs() {
  const apps = ["CRM", "Calendar", "Email", "Finance", "Analytics", "Marketing", "Website", "Social", "AI"];
  return (
    <section className="relative px-5 py-20 sm:px-8" id="about">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">One VanderBase</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Stop stitching tools. Start running the company.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <Reveal>
            <div className="landing-glass rounded-3xl p-6">
              <p className="text-sm font-semibold text-secondary">Old way</p>
              <p className="mt-2 text-2xl font-semibold">10 different apps</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {apps.map((app, index) => (
                  <motion.span
                    key={app}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-secondary"
                  >
                    {app}
                  </motion.span>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="flex justify-center">
            <div className="flex flex-col items-center gap-2 text-primary">
              <ArrowDown className="h-5 w-5" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">Becomes</span>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="landing-glass-strong landing-gradient-border rounded-3xl p-6">
              <p className="text-sm font-semibold text-primary">VanderBase</p>
              <div className="mt-5 space-y-3">
                {["One Login", "One Workspace", "One Purchase", "One AI"].map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.08 }}
                    className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3"
                  >
                    <Check className="h-4 w-4 text-primary" aria-hidden />
                    <span className="text-sm font-medium">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function FeatureGrid() {
  const { openOverlay } = useLandingInteractions();
  return (
    <section id="features" className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Feature grid</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Every system your business needs, already connected.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.id} delay={index * 0.03}>
                <motion.button
                  type="button"
                  whileHover={{ y: -4 }}
                  onClick={() =>
                    openOverlay("module-preview", {
                      id: feature.id,
                      title: feature.title,
                      body: feature.body,
                    })
                  }
                  className="landing-glass group w-full rounded-3xl p-5 text-left transition hover:border-primary/25"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-2xl bg-primary/15 p-2.5 text-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <span className="text-xs text-primary opacity-0 transition group-hover:opacity-100">
                      Open preview →
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-secondary">{feature.body}</p>
                </motion.button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function AiCommandCenter() {
  const [prompt, setPrompt] = useState(prompts[0]!);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let i = 0;
    setTyped("");
    const response = responses[prompt] ?? "";
    const timer = window.setInterval(() => {
      i += 1;
      setTyped(response.slice(0, i));
      if (i >= response.length) window.clearInterval(timer);
    }, 16);
    return () => window.clearInterval(timer);
  }, [prompt]);

  const kairosState =
    typed.length === 0
      ? "thinking"
      : typed.length < (responses[prompt] ?? "").length
        ? "speaking"
        : "idle";

  return (
    <section className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Meet Kairos</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Ask once. Act across the business.
          </h2>
          <p className="mt-4 text-sm leading-6 text-secondary">
            Kairos is not a chatbot bolted on the side. Your AI Business Copilot has workspace memory, module tools, and the ability to move work forward.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {prompts.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPrompt(item)}
                className={`rounded-full px-3 py-1.5 text-xs transition ${
                  prompt === item ? "bg-primary text-white" : "landing-glass text-secondary"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="landing-glass-strong landing-gradient-border rounded-[28px] p-5">
            <div className="flex items-center gap-3 text-sm font-medium">
              <KairosAvatar size="sm" state={kairosState} interactive aria-label="Kairos" />
              <span>Kairos · AI Business Copilot</span>
            </div>
            <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-sm text-foreground">
              {prompt}
            </div>
            <div className="mt-3 min-h-28 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm leading-6 text-secondary">
              {typed}
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function WorkflowStep({
  label,
  index,
  className = "",
}: {
  label: string;
  index: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.45 }}
      className={`landing-glass-strong rounded-2xl px-3 py-3 text-center text-xs font-semibold sm:text-sm ${className}`}
    >
      {label}
    </motion.div>
  );
}

function WorkflowConnector({
  index,
  direction = "horizontal",
}: {
  index: number;
  direction?: "horizontal" | "vertical";
}) {
  if (direction === "vertical") {
    return (
      <div className="flex h-7 flex-col items-center justify-center">
        <motion.div
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.07 + 0.04, duration: 0.45 }}
          className="h-full w-px origin-top bg-gradient-to-b from-primary/40 via-primary to-accent/40"
        />
        <motion.span
          animate={{ y: [0, 3, 0], opacity: [0.45, 1, 0.45] }}
          transition={{ repeat: Infinity, duration: 1.8, delay: index * 0.12 }}
          className="mt-0.5 text-primary"
          aria-hidden
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </motion.span>
      </div>
    );
  }

  return (
    <div className="relative flex min-w-[10px] flex-1 items-center">
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.07 + 0.04, duration: 0.5 }}
        className="h-px w-full origin-left bg-gradient-to-r from-primary/35 via-primary to-accent/35"
      />
      <motion.span
        className="absolute -right-0.5"
        animate={{ x: [0, 3, 0], opacity: [0.45, 1, 0.45] }}
        transition={{ repeat: Infinity, duration: 1.6, delay: index * 0.1 }}
        aria-hidden
      >
        <ArrowRight className="h-3 w-3 text-primary" />
      </motion.span>
    </div>
  );
}

export function WorkflowAutomation() {
  const steps = ["Lead", "CRM", "Email", "Calendar", "Invoice", "Analytics", "AI Follow-up"];
  return (
    <section className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Workflow automation</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            From first lead to follow-up, without the handoff tax.
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="mt-12">
          <div className="mx-auto hidden w-full items-center md:flex">
            {steps.map((step, index) => (
              <Fragment key={step}>
                <WorkflowStep label={step} index={index} className="shrink-0" />
                {index < steps.length - 1 ? <WorkflowConnector index={index} /> : null}
              </Fragment>
            ))}
          </div>
          <div className="mx-auto flex w-full max-w-xs flex-col items-stretch md:hidden">
            {steps.map((step, index) => (
              <Fragment key={step}>
                <WorkflowStep label={step} index={index} className="w-full" />
                {index < steps.length - 1 ? (
                  <WorkflowConnector index={index} direction="vertical" />
                ) : null}
              </Fragment>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function ProductTour() {
  const tabs = ["Dashboard", "CRM", "Inbox", "Content", "Social", "Website", "Calendar", "Finance", "Analytics", "AI Studio"];
  const [tab, setTab] = useState("Dashboard");
  return (
    <section className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Product tour</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Switch modules. Keep the same operating rhythm.
          </h2>
        </Reveal>
        <Reveal delay={0.08} className="mt-8">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition ${
                  tab === item ? "bg-primary text-white" : "landing-glass text-secondary"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
              >
                <ProductMockup module={tab.toLowerCase()} />
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Integrations() {
  return <IntegrationsShowcase />;
}

export function AiShowcase() {
  const cards = [
    ["AI writing", "Draft posts, pages, and sequences in your brand voice."],
    ["AI replying", "Smart replies that understand thread and CRM context."],
    ["AI analyzing", "Surface pipeline risk, inbox priority, and growth signals."],
    ["AI forecasting", "Project revenue and capacity from live workspace data."],
    ["AI planning", "Turn goals into calendars, content, and follow-ups."],
    ["AI automations", "Agents that act across modules with approval controls."],
  ];
  return (
    <section className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">AI showcase</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Intelligence that writes, replies, analyzes, and ships.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(([title, body], index) => (
            <Reveal key={title} delay={index * 0.04}>
              <motion.div
                whileHover={{ y: -4 }}
                className="landing-glass-strong rounded-3xl p-6"
              >
                <Sparkles className="h-5 w-5 text-primary" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-secondary">{body}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingSection() {
  const { openOverlay } = useLandingInteractions();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  return (
    <section id="pricing" className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Plans that scale with your business.
          </h2>
          <p className="mt-4 text-sm leading-6 text-secondary">
            Simple, transparent pricing with the flexibility to grow.
          </p>
          <div className="mx-auto mt-7 inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            {(["monthly", "yearly"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setInterval(value)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold capitalize transition ${
                  interval === value ? "bg-primary text-white shadow-soft" : "text-secondary hover:text-foreground"
                }`}
              >
                {value}
                {value === "yearly" ? <span className="ml-1.5 text-success">🎁 1 Month Free</span> : null}
              </button>
            ))}
          </div>
          <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => openOverlay("credits-explainer")}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              How AI credits work
            </button>
            <span className="text-muted">·</span>
            <Link href="/credits" className="text-sm text-primary underline-offset-4 hover:underline">
              Credit packs
            </Link>
            <span className="text-muted">·</span>
            <button
              type="button"
              onClick={() => openOverlay("roi-calculator")}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              ROI calculator
            </button>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <Reveal key={plan.id}>
              <div
                className={`landing-glass relative flex h-full flex-col rounded-3xl p-6 ${
                  plan.popular
                    ? "landing-gradient-border border-primary/50 shadow-[0_0_40px_rgba(249,115,22,0.1)]"
                    : ""
                }`}
              >
                {plan.popular ? (
                  <span className="absolute -top-3 left-4 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    <Star className="h-3 w-3 fill-current" aria-hidden />
                    Most popular
                  </span>
                ) : null}
                <div className="flex flex-1 flex-col">
                  <p className="text-lg font-semibold">{plan.name}</p>
                  <p className="mt-1.5 text-xs leading-5 text-secondary">{plan.description}</p>
                  <div className="mt-5 flex items-baseline gap-2">
                    {plan.price === null ? (
                      <span className="text-3xl font-semibold tracking-tight">Custom</span>
                    ) : (
                      <>
                        <motion.span
                          key={`${plan.id}-${interval}`}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-3xl font-semibold tracking-tight"
                        >
                          ${interval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                        </motion.span>
                        {plan.price > 0 ? (
                          <span className="text-xs text-muted">/{interval === "monthly" ? "month" : "year"}</span>
                        ) : null}
                      </>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-primary">
                    {interval === "yearly" && plan.id !== "free" ? "🎁 1 Month Free" : plan.billingLabel}
                  </p>
                </div>
                {plan.id === "business" ? (
                  <Link href="mailto:hello@vanderbase.com" className="mt-5 block">
                    <Button variant="secondary" className="w-full">
                      Contact Sales
                    </Button>
                  </Link>
                ) : plan.id === "pro" ? (
                  <Link href="/signup" className="mt-5 block">
                    <Button className="w-full">Start Free Trial</Button>
                  </Link>
                ) : (
                  <JoinWaitlistButton className="mt-5 block w-full">
                    <Button variant="secondary" className="w-full">
                      Get Started
                    </Button>
                  </JoinWaitlistButton>
                )}
                <ul className="mt-5 space-y-2 border-t border-white/5 pt-5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-xs leading-5 text-secondary">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10">
          <div className="mb-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Storage add-ons</p>
            <p className="mt-2 text-sm text-secondary">Storage add-ons can be purchased at any time and stack with your current plan.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {STORAGE_ADDONS.map((addon) => (
              <motion.div key={addon.id} whileHover={{ y: -4 }} className={`landing-glass relative rounded-2xl p-4 ${addon.popular ? "border border-primary/50 shadow-[0_0_30px_rgba(249,115,22,0.12)]" : ""}`}>
                {addon.popular ? <span className="absolute -top-2.5 left-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">Most Popular</span> : null}
                <p className="text-sm font-semibold">{addon.label}</p>
                <p className="mt-3 text-2xl font-semibold">${addon.monthlyPrice}<span className="text-xs font-normal text-muted"> / month</span></p>
                <Button size="sm" variant="secondary" className="mt-4 w-full">Add storage</Button>
              </motion.div>
            ))}
          </div>
        </Reveal>

        <div className="mt-8 flex flex-col items-center justify-center gap-2 text-center text-xs text-muted sm:flex-row">
          <span>🔒 Secure payments powered by Stripe</span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">Stripe Checkout Coming Soon</span>
        </div>

        <Reveal className="mt-10 overflow-x-auto rounded-3xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-secondary">
                <th className="p-4 font-medium">Capability</th>
                {PRICING_PLANS.map((plan) => (
                  <th key={plan.id} className="p-4 font-semibold text-foreground">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map(([label, ...values]) => (
                <tr key={label} className="border-b border-white/5 last:border-0">
                  <th className="p-4 font-medium text-foreground">{label}</th>
                  {values.map((value, index) => (
                    <td key={`${label}-${index}`} className="p-4 text-secondary">
                      {value ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}

export function Testimonials() {
  const { stats } = useWaitlistStats();

  return (
    <section className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Early access</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Real founders. Real momentum. No fake social proof.
          </h2>
          <p className="mt-4 text-sm leading-6 text-secondary">
            VanderBase is in pre-launch. Every number on this page comes from verified waitlist signups — never fabricated testimonials or company logos.
          </p>
        </Reveal>
        <Reveal className="mt-10">
          <div className="landing-glass-strong landing-gradient-border rounded-[28px] px-6 py-10 text-center sm:px-10">
            <WaitlistCounter count={stats.count} />
            <WaitlistSocialProof recent={stats.recent} count={stats.count} />
            <div className="mt-8 flex justify-center">
              <JoinWaitlistButton>
                <Button size="lg" className="gap-2">
                  Join the Waitlist
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </JoinWaitlistButton>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section id="docs" className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Clear answers before you commit.
          </h2>
        </Reveal>
        <div className="space-y-2">
          {faqs.map(([question, answer], index) => (
            <Reveal key={question} delay={index * 0.04}>
              <FaqItem question={question} answer={answer} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="landing-glass rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-medium"
      >
        <span>{question}</span>
        <ChevronDown className={`h-4 w-4 text-muted transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-4 pb-4 text-sm leading-6 text-secondary"
          >
            {answer}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function FinalCta() {
  const { openOverlay } = useLandingInteractions();
  return (
    <section className="relative px-5 py-20 sm:px-8">
      <Reveal>
        <div className="landing-glass-strong landing-gradient-border mx-auto max-w-5xl rounded-[32px] px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Stop Managing Tools.
            <span className="block text-primary">Start Running Your Business.</span>
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <JoinWaitlistButton>
              <Button size="lg" className="gap-2">
                Join the Waitlist
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </JoinWaitlistButton>
            <Button size="lg" variant="secondary" onClick={() => openOverlay("book-demo")}>
              Book Demo
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function LandingFooter() {
  const columns = [
    {
      title: "Product",
      links: [
        ["Pricing", "/pricing"],
        ["Roadmap", "/roadmap"],
        ["Features", "#features"],
        ["Integrations", "#integrations"],
        ["Help Center", "/help"],
        ["Support", "/support"],
        ["Contact", "/contact"],
      ],
    },
    {
      title: "Company",
      links: [
        ["About", "#about"],
        ["Privacy", "/privacy"],
        ["Terms", "/terms"],
        ["Cookies", "/cookies"],
        ["Refunds", "/refund"],
      ],
    },
    {
      title: "Account",
      links: [
        ["Sign in", "/signin"],
        ["Create account", "/signup"],
        ["Waitlist", "/#waitlist"],
      ],
    },
  ] as const;

  return (
    <footer id="blog" className="relative border-t border-white/5 px-5 py-16 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center py-1">
            <VanderBaseLogo size="md" />
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-secondary">
            The AI-native operating system for founders, operators, and modern teams.
          </p>
          <div className="mt-5">
            <InstagramSocialLink className="inline-flex items-center text-secondary transition hover:text-foreground" />
          </div>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{column.title}</p>
            <ul className="mt-4 space-y-2">
              {column.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-secondary transition hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-12 max-w-7xl text-xs text-muted">
        © {new Date().getFullYear()} VanderBase. All rights reserved.
      </p>
    </footer>
  );
}
