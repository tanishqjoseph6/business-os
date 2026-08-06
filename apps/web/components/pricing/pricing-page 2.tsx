"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CreditCard,
  LockKeyhole,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import {
  ADDITIONAL_TEAM_SEAT,
  AI_CREDIT_PACKS,
  COMPARISON_ROWS,
  CREDITS_USAGE_HINT,
  PRICING_PLANS,
  PRICING_TAGLINE,
  formatCreditPackPrice,
  formatPlanCredits,
  formatPlanPrice,
  type PricingPlan,
} from "../../lib/pricing";
import { PlanCreditsBlock } from "./plan-credits-block";
import { VanderBaseLogo } from "../branding/vanderbase-logo";

const faqs: [string, string][] = [
  [
    "Is this a subscription?",
    "No. VanderBase Pro is a one-time purchase. You own access to the Business OS—there are no monthly or yearly plans.",
  ],
  [
    "What are AI credits?",
    "AI credits power Kairos and AI features across Inbox, CRM, Content, and agents. Free and Pro include a starter pool. Buy credit packs only when you need more.",
  ],
  [
    "How do additional team members work?",
    "Free includes up to 3 members and Pro includes up to 10. Extra seats are $25 each as a one-time purchase.",
  ],
  [
    "Are Stripe and Razorpay supported?",
    "Checkout uses one-time payments via Stripe or Razorpay—never recurring subscriptions.",
  ],
  [
    "Is there a free option?",
    "Yes. Free forever includes 1 workspace, up to 3 team members, 100 AI credits, and basic Business OS features.",
  ],
];

export function PricingPage() {
  return (
    <div className="bos-atmosphere min-h-screen overflow-hidden">
      <PricingHeader />
      <main className="relative mx-auto max-w-7xl px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
        <section className="mx-auto max-w-3xl text-center">
          <Badge variant="accent" className="gap-1.5">
            <Sparkles className="h-3 w-3" aria-hidden /> One-time purchase
          </Badge>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
            Own your Business OS.{" "}
            <span className="text-primary">Pay once.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-secondary sm:text-lg">
            {PRICING_TAGLINE}
          </p>
        </section>

        <section className="mt-12 grid gap-5 md:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </section>

        <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-6 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <LockKeyhole className="h-3.5 w-3.5 text-primary" aria-hidden /> No
            recurring fees
          </span>
          <span className="flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-primary" aria-hidden />{" "}
            One-time Stripe / Razorpay checkout
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" aria-hidden /> Credits
            only when you need them
          </span>
        </div>

        <TeamSeatsSection />
        <CreditPacksSection />

        <section className="mt-24">
          <SectionIntro
            eyebrow="Compare"
            title="Everything you need at a glance."
            body="Simple tiers. Clear ownership. Scale with seats and credit packs—not a subscription ladder."
          />
          <ComparisonTable />
        </section>

        <CreditsHowItWorks />

        <section className="mt-24 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <SectionIntro
            eyebrow="Questions"
            title="Clear answers before you commit."
            body="No monthly traps. No yearly lock-ins. Own the OS, top up AI when work picks up."
          />
          <div className="space-y-2">
            {faqs.map(([question, answer]) => (
              <Faq key={question} question={question} answer={answer} />
            ))}
          </div>
        </section>

        <SalesCta />
      </main>
    </div>
  );
}

function PricingHeader() {
  return (
    <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:gap-8 sm:px-8 sm:py-5">
      <Link href="/" className="inline-flex shrink-0 items-center" aria-label="VanderBase">
        <VanderBaseLogo size="nav" priority />
      </Link>
      <div className="flex items-center gap-2">
        <Link href="/credits">
          <Button size="sm" variant="ghost">
            AI Credits
          </Button>
        </Link>
        <Link href="/signin">
          <Button size="sm" variant="ghost">
            Sign in
          </Button>
        </Link>
        <Link href="/?join=waitlist">
          <Button size="sm">Join the Waitlist</Button>
        </Link>
      </div>
    </header>
  );
}

function PricingCard({ plan }: { plan: PricingPlan }) {
  return (
    <Card
      elevated={plan.popular}
      className={`relative flex h-full flex-col p-6 ${
        plan.popular ? "border-primary/70 shadow-[0_0_40px_rgba(249,115,22,0.12)]" : ""
      }`}
    >
      {plan.popular ? (
        <div className="absolute -top-3 left-5 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
          <Star className="h-3 w-3 fill-current" aria-hidden />
          Most popular
        </div>
      ) : null}
      <div className="flex flex-1 flex-col">
        <p className="text-lg font-semibold">{plan.name}</p>
        <p className="mt-1.5 text-sm leading-6 text-secondary">{plan.description}</p>
        <div className="mt-6 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight">
            {formatPlanPrice(plan)}
          </span>
          {plan.price !== null && plan.price > 0 ? (
            <span className="text-xs text-muted">once</span>
          ) : null}
        </div>
        <p className="mt-1 text-xs font-medium text-primary">{plan.billingLabel}</p>
        <PlanCreditsBlock plan={plan} highlighted={plan.popular} />
      </div>
      <Link href={plan.ctaHref} className="mt-6">
        <Button variant={plan.popular ? "primary" : "secondary"} className="w-full">
          {plan.cta}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </Link>
      <ul className="mt-6 space-y-2.5 border-t border-border pt-5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2 text-sm leading-5 text-secondary">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TeamSeatsSection() {
  return (
    <section id="team-seats" className="mt-24">
      <SectionIntro
        eyebrow="Team"
        title="Additional team members"
        body={`${ADDITIONAL_TEAM_SEAT.description} Included seats: Free 3 · Pro 10.`}
      />
      <Card elevated className="mt-8 flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Users className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-lg font-semibold">{ADDITIONAL_TEAM_SEAT.name}</p>
            <p className="mt-1 text-sm text-secondary">{ADDITIONAL_TEAM_SEAT.billingLabel}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              ${ADDITIONAL_TEAM_SEAT.price}
              <span className="ml-2 text-sm font-normal text-muted">per member · once</span>
            </p>
          </div>
        </div>
        <Link href="/checkout?product=additional-seat">
          <Button size="lg" className="gap-2">
            Add team members
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </Link>
      </Card>
    </section>
  );
}

function CreditPacksSection() {
  return (
    <section id="ai-credits" className="mt-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionIntro
          eyebrow="AI Credits"
          title="Buy credits when you need them."
          body={CREDITS_USAGE_HINT}
        />
        <Link href="/credits">
          <Button variant="secondary" className="gap-2">
            Open credits page
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </Link>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {AI_CREDIT_PACKS.map((pack) => (
          <Card
            key={pack.id}
            className={`relative flex flex-col p-5 ${
              pack.popular ? "border-primary/50" : ""
            }`}
          >
            {pack.popular ? (
              <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Best value
              </span>
            ) : null}
            <p className="text-sm font-semibold">{pack.label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {formatCreditPackPrice(pack)}
            </p>
            <p className="mt-1 text-xs text-muted">One-time purchase</p>
            {pack.contactSales ? (
              <a href="mailto:hello@vanderbase.com" className="mt-5">
                <Button variant="secondary" className="w-full" size="sm">
                  Contact sales
                </Button>
              </a>
            ) : (
              <Link href={`/checkout?pack=${pack.id}`} className="mt-5">
                <Button
                  variant={pack.popular ? "primary" : "secondary"}
                  className="w-full"
                  size="sm"
                >
                  Buy pack
                </Button>
              </Link>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}

function SectionIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-secondary">{body}</p>
    </div>
  );
}

function ComparisonTable() {
  return (
    <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-surface shadow-soft">
      <table className="w-full min-w-[640px] text-left text-xs">
        <thead>
          <tr className="border-b border-border text-secondary">
            <th className="p-4 font-medium">Capability</th>
            {PRICING_PLANS.map((plan) => (
              <th
                key={plan.id}
                className={`p-4 font-semibold ${plan.popular ? "text-primary" : "text-foreground"}`}
              >
                {plan.name}
                <span className="mt-1 block font-normal text-muted">
                  {formatPlanPrice(plan)}
                  {plan.price && plan.price > 0 ? " once" : ""}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map(([label, ...values]) => (
            <tr key={label} className="border-b border-border last:border-0">
              <th className="p-4 font-medium text-foreground">{label}</th>
              {values.map((value, index) => {
                const displayValue = value ?? "—";
                return (
                  <td
                    key={`${label}-${index}`}
                    className={`p-4 ${displayValue === "—" ? "text-muted" : "text-secondary"}`}
                  >
                    {displayValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreditsHowItWorks() {
  return (
    <section className="mt-24 grid gap-4 lg:grid-cols-2">
      <Card className="bg-primary text-white">
        <Sparkles className="h-6 w-6" aria-hidden />
        <h2 className="mt-5 text-3xl font-semibold tracking-tight">
          AI credits are shared across your workspace.
        </h2>
        <p className="mt-4 text-sm leading-6 text-orange-100">
          Use credits wherever work happens—summarize email, qualify a lead, draft content, or run
          an agent. Top up with a one-time pack when you run low.
        </p>
        <p className="mt-6 text-sm font-medium text-white/90">{formatPlanCredits(PRICING_PLANS[1]!)}</p>
      </Card>
      <Card>
        <p className="text-sm font-semibold">How credits work</p>
        <div className="mt-5 space-y-4">
          {[
            ["01", "Included starter pool", "Free includes 100 credits. Pro includes 1,000."],
            ["02", "Buy only what you need", "Eight pack sizes from 1,000 to 250,000—or contact sales for 500,000+."],
            ["03", "Never a subscription", "Credit packs are one-time purchases. No monthly burn rate you didn’t choose."],
          ].map(([number, title, body]) => (
            <div key={number} className="flex gap-3">
              <span className="font-mono text-xs text-primary">{number}</span>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs leading-5 text-secondary">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

function Faq({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-medium"
      >
        <span>{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? <p className="px-4 pb-4 text-sm leading-6 text-secondary">{answer}</p> : null}
    </div>
  );
}

function SalesCta() {
  return (
    <section
      id="contact-sales"
      className="mt-24 overflow-hidden rounded-3xl border border-primary/30 bg-primary/10 p-8 text-center sm:p-14"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        Ready when you are
      </p>
      <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
        Own VanderBase. Scale with credits and seats.
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-secondary">
        {PRICING_TAGLINE}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/checkout?product=pro">
          <Button size="lg" className="gap-2">
            Buy Pro — $99
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </Link>
        <a href="mailto:hello@vanderbase.com">
          <Button size="lg" variant="secondary">
            Contact sales
          </Button>
        </a>
      </div>
    </section>
  );
}
