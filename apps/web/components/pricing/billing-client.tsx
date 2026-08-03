"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, CreditCard, Sparkles, Users } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import {
  ADDITIONAL_TEAM_SEAT,
  AI_CREDIT_PACKS,
  PRICING_PLANS,
  PRICING_TAGLINE,
  formatCreditPackPrice,
} from "../../lib/pricing";

export function BillingClient() {
  const searchParams = useSearchParams();
  const success = searchParams.get("checkout") === "success";

  return (
    <div className="space-y-8">
      {success ? (
        <div
          className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" aria-hidden />
          <div>
            <p className="font-medium text-foreground">One-time purchase completed</p>
            <p className="mt-1 text-secondary">
              Your entitlements will appear here once payment webhooks are connected. This was not a
              subscription.
            </p>
          </div>
        </div>
      ) : null}

      <section className="space-y-3">
        <Badge variant="accent" className="gap-1.5">
          <Sparkles className="h-3 w-3" aria-hidden /> Ownership model
        </Badge>
        <h2 className="text-2xl font-semibold tracking-tight">Billing & purchases</h2>
        <p className="max-w-2xl text-sm leading-6 text-secondary">{PRICING_TAGLINE}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {PRICING_PLANS.map((plan) => (
          <Card key={plan.id} className={`p-5 ${plan.popular ? "border-primary/50" : ""}`}>
            <p className="text-sm font-semibold">{plan.name}</p>
            <p className="mt-2 text-2xl font-semibold">
              {plan.price === null ? "Custom" : plan.price === 0 ? "$0" : `$${plan.price}`}
            </p>
            <p className="mt-1 text-xs text-primary">{plan.billingLabel}</p>
            <ul className="mt-4 space-y-1.5 text-xs text-secondary">
              {plan.features.slice(0, 4).map((feature) => (
                <li key={feature}>· {feature}</li>
              ))}
            </ul>
            {plan.id === "pro" ? (
              <Link href="/checkout?product=pro" className="mt-5 block">
                <Button className="w-full" size="sm">
                  Buy Pro once
                </Button>
              </Link>
            ) : plan.id === "business" ? (
              <a href="mailto:sales@vanderbase.com" className="mt-5 block">
                <Button variant="secondary" className="w-full" size="sm">
                  Contact sales
                </Button>
              </a>
            ) : (
              <Link href="/pricing" className="mt-5 block">
                <Button variant="secondary" className="w-full" size="sm">
                  View Free details
                </Button>
              </Link>
            )}
          </Card>
        ))}
      </div>

      <section id="team-seats" className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-lg font-semibold">Additional team members</h3>
        </div>
        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">{ADDITIONAL_TEAM_SEAT.name}</p>
            <p className="mt-1 text-sm text-secondary">{ADDITIONAL_TEAM_SEAT.description}</p>
            <p className="mt-2 text-xl font-semibold">
              ${ADDITIONAL_TEAM_SEAT.price}
              <span className="ml-2 text-sm font-normal text-muted">per member · once</span>
            </p>
          </div>
          <Link href="/checkout?product=additional-seat">
            <Button className="gap-2">
              Purchase seats
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Link>
        </Card>
      </section>

      <section id="ai-credits" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" aria-hidden />
            <h3 className="text-lg font-semibold">AI credit packs</h3>
          </div>
          <Link href="/credits">
            <Button variant="secondary" size="sm" className="gap-2">
              Open credits page
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AI_CREDIT_PACKS.map((pack) => (
            <Card key={pack.id} className="p-4">
              <p className="text-sm font-medium">{pack.label}</p>
              <p className="mt-2 text-xl font-semibold">{formatCreditPackPrice(pack)}</p>
              <p className="text-[11px] text-muted">One-time</p>
              {pack.contactSales ? (
                <a href="mailto:sales@vanderbase.com" className="mt-4 block">
                  <Button variant="secondary" size="sm" className="w-full">
                    Contact sales
                  </Button>
                </a>
              ) : (
                <Link href={`/checkout?pack=${pack.id}`} className="mt-4 block">
                  <Button size="sm" className="w-full" variant={pack.popular ? "primary" : "secondary"}>
                    Buy
                  </Button>
                </Link>
              )}
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
