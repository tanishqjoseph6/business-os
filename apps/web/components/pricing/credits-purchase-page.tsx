"use client";

import Link from "next/link";
import { ArrowRight, Check, Sparkles, Star } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import {
  AI_CREDIT_PACKS,
  CREDITS_USAGE_HINT,
  PRICING_TAGLINE,
  formatCreditPackPrice,
} from "../../lib/pricing";
import { VanderBaseLogo } from "../branding/vanderbase-logo";

export function CreditsPurchasePage() {
  return (
    <div className="bos-atmosphere min-h-screen overflow-hidden">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8 sm:py-5">
        <Link href="/" className="inline-flex shrink-0 items-center" aria-label="VanderBase">
          <VanderBaseLogo size="nav" priority />
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/pricing">
            <Button size="sm" variant="ghost">
              Pricing
            </Button>
          </Link>
          <Link href="/checkout?product=pro">
            <Button size="sm">Upgrade to Pro — $59/month</Button>
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
        <section className="mx-auto max-w-3xl text-center">
          <Badge variant="accent" className="gap-1.5">
            <Sparkles className="h-3 w-3" aria-hidden /> AI Credit Packs
          </Badge>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Buy AI credits only when you need them.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-secondary">
            {PRICING_TAGLINE} Add flexible AI capacity whenever your workspace needs it.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">{CREDITS_USAGE_HINT}</p>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AI_CREDIT_PACKS.map((pack) => (
            <Card
              key={pack.id}
              elevated={pack.popular}
              className={`relative flex flex-col p-5 ${
                pack.popular ? "border-primary/60 shadow-[0_0_32px_rgba(249,115,22,0.1)]" : ""
              }`}
            >
              {pack.popular ? (
                <span className="absolute -top-2.5 left-4 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  <Star className="h-3 w-3 fill-current" aria-hidden />
                  Popular
                </span>
              ) : null}
              <p className="text-base font-semibold">{pack.label}</p>
              <p className="mt-4 text-3xl font-semibold tracking-tight">
                {formatCreditPackPrice(pack)}
              </p>
              <p className="mt-1 text-xs font-medium text-primary">Flexible AI capacity</p>
              <ul className="mt-5 space-y-2 text-xs text-secondary">
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  Workspace-shared pool
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  Available whenever your workspace needs it
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  Secure Lemon Squeezy checkout
                </li>
              </ul>
              {pack.contactSales ? (
                <a href="mailto:hello@vanderbase.com" className="mt-6">
                  <Button variant="secondary" className="w-full">
                    Contact sales
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </a>
              ) : (
                <Link href={`/checkout?pack=${pack.id}`} className="mt-6">
                  <Button
                    variant={pack.popular ? "primary" : "secondary"}
                    className="w-full"
                  >
                    Buy {pack.label}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </Link>
              )}
            </Card>
          ))}
        </section>

        <section className="mt-16 rounded-3xl border border-border bg-surface p-8 text-center sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight">Need Pro first?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-secondary">
            Pro is $59/month and includes the full Pro plan, all Business OS modules, and up to 10 AI
            agents.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/checkout?product=pro">
              <Button className="gap-2">
                Upgrade to Pro — $59/month
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary">View all pricing</Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
