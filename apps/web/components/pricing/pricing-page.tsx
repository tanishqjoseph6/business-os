"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, LockKeyhole, Sparkles, Star } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import {
  PRICING_PLANS,
  PRICING_TAGLINE,
  STORAGE_ADDONS,
  type PricingInterval,
  type PricingPlan,
} from "../../lib/pricing";
import { VanderBaseLogo } from "../branding/vanderbase-logo";

export function PricingPage() {
  const [interval, setInterval] = useState<PricingInterval>("monthly");

  return (
    <div className="bos-atmosphere min-h-screen overflow-hidden">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8 sm:py-5">
        <Link href="/" aria-label="VanderBase">
          <VanderBaseLogo size="nav" priority />
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/signin"><Button size="sm" variant="ghost">Sign in</Button></Link>
          <Link href="/signup"><Button size="sm">Get Started</Button></Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
        <section className="mx-auto max-w-3xl text-center">
          <Badge variant="accent" className="gap-1.5">
            <Sparkles className="h-3 w-3" aria-hidden /> Pricing
          </Badge>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
            Plans that scale with <span className="text-primary">your business.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-secondary sm:text-lg">
            {PRICING_TAGLINE}
          </p>
          <BillingToggle interval={interval} onChange={setInterval} />
        </section>

        <section className="mt-12 grid items-stretch gap-5 md:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} interval={interval} />
          ))}
        </section>

        <div className="mx-auto mt-8 flex items-center justify-center gap-2 text-center text-xs text-muted">
          <LockKeyhole className="h-3.5 w-3.5 text-primary" aria-hidden />
          Secure payments powered by Stripe
        </div>

        <StorageAddons />
      </main>
    </div>
  );
}

function BillingToggle({
  interval,
  onChange,
}: {
  interval: PricingInterval;
  onChange: (value: PricingInterval) => void;
}) {
  return (
    <div className="mx-auto mt-8 inline-flex rounded-2xl border border-border bg-surface/80 p-1 backdrop-blur-xl">
      {(["monthly", "yearly"] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={interval === value}
          className={`rounded-xl px-5 py-2.5 text-sm font-medium capitalize transition ${
            interval === value
              ? "bg-primary text-white shadow-soft"
              : "text-secondary hover:bg-elevated hover:text-foreground"
          }`}
        >
          {value}
        </button>
      ))}
    </div>
  );
}

function PricingCard({ plan, interval }: { plan: PricingPlan; interval: PricingInterval }) {
  const yearlyOriginal = plan.monthlyPrice * 12;
  const isYearly = interval === "yearly" && plan.id !== "free";

  return (
    <Card
      elevated={plan.popular}
      className={`relative flex h-full min-h-[465px] flex-col p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/50 ${
        plan.popular ? "border-primary/70 shadow-[0_0_40px_rgba(249,115,22,0.14)]" : ""
      }`}
    >
      {plan.popular ? (
        <div className="absolute -top-3 left-5 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
          <Star className="h-3 w-3 fill-current" aria-hidden /> Most Popular
        </div>
      ) : null}
      <div className="flex flex-1 flex-col">
        <p className="text-lg font-semibold">{plan.name}</p>
        <p className="mt-1.5 min-h-12 text-sm leading-6 text-secondary">{plan.description}</p>
        <div className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <motion.span
            key={`${plan.id}-${interval}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="text-4xl font-semibold tracking-tight"
          >
            ${interval === "monthly" ? plan.monthlyPrice.toLocaleString() : plan.yearlyPrice.toLocaleString()}
          </motion.span>
          {plan.id !== "free" ? <span className="text-xs text-muted">/ {interval === "monthly" ? "month" : "year"}</span> : null}
        </div>
        {isYearly ? (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-muted line-through">${yearlyOriginal.toLocaleString()}/year</span>
            <span className="font-medium text-success">🎁 1 Month Free</span>
          </div>
        ) : <p className="mt-2 text-xs text-primary">{plan.id === "free" ? "Free forever" : "Billed monthly"}</p>}
      </div>
      <Link href={plan.ctaHref} className="mt-7">
        <Button variant={plan.popular ? "primary" : "secondary"} className="w-full gap-2">
          {plan.cta}<ArrowRight className="h-3.5 w-3.5" aria-hidden />
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

function StorageAddons() {
  return (
    <section className="mt-24">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">📦 Storage Add-ons</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">More room when you need it.</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-secondary">
          Add flexible storage capacity to any VanderBase plan.
        </p>
      </div>
      <div className="mt-8 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STORAGE_ADDONS.map((addon) => (
          <Card
            key={addon.id}
            className={`relative flex min-h-[190px] flex-col p-5 transition duration-300 hover:-translate-y-1 hover:border-primary/50 ${
              addon.popular ? "border-primary/60 shadow-[0_0_30px_rgba(249,115,22,0.12)]" : ""
            }`}
          >
            {addon.popular ? (
              <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                ⭐ Most Popular
              </span>
            ) : null}
            <p className="text-sm font-semibold">{addon.label}</p>
            <p className="mt-4 text-2xl font-semibold tracking-tight">
              ${addon.monthlyPrice}<span className="ml-1 text-xs font-normal text-muted">/ month</span>
            </p>
            <Button variant="secondary" size="sm" className="mt-auto w-full">Add storage</Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
