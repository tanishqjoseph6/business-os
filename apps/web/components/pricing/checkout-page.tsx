"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, Check, CreditCard, Loader2, Shield } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import {
  ADDITIONAL_TEAM_SEAT,
  PRICING_TAGLINE,
  getCreditPackById,
  getPlanById,
} from "../../lib/pricing";
import {
  createOneTimeCheckoutSession,
  creditPackToCheckoutProduct,
  formatUsdFromCents,
  planToCheckoutProduct,
  resolveCheckoutProduct,
  seatToCheckoutProduct,
  type CheckoutProvider,
} from "../../lib/checkout";
import { VanderBaseLogo } from "../branding/vanderbase-logo";

export function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [provider, setProvider] = useState<CheckoutProvider>("stripe");
  const [seats, setSeats] = useState(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sessionPreview, setSessionPreview] = useState<string | null>(null);

  const productKey = searchParams.get("product");
  const packKey = searchParams.get("pack");

  const product = useMemo(() => {
    if (packKey) {
      const pack = getCreditPackById(packKey);
      return pack ? creditPackToCheckoutProduct(pack) : null;
    }
    if (productKey === "pro") {
      const plan = getPlanById("pro");
      return plan ? planToCheckoutProduct(plan) : null;
    }
    if (productKey === "additional-seat") {
      return seatToCheckoutProduct(ADDITIONAL_TEAM_SEAT, seats);
    }
    return resolveCheckoutProduct({
      product: productKey,
      pack: packKey,
      seats,
    });
  }, [packKey, productKey, seats]);

  async function handleCheckout() {
    if (!product || product.amountCents === null) {
      setError("This product requires contacting sales.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const origin = window.location.origin;
        const session = createOneTimeCheckoutSession({
          product:
            productKey === "additional-seat"
              ? seatToCheckoutProduct(ADDITIONAL_TEAM_SEAT, seats)
              : product,
          provider,
          successUrl: `${origin}/billing?checkout=success`,
          cancelUrl: `${origin}/checkout?${packKey ? `pack=${packKey}` : `product=${productKey ?? "pro"}`}&cancelled=1`,
          quantity: productKey === "additional-seat" ? seats : 1,
        });

        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product: productKey ?? undefined,
            pack: packKey ?? undefined,
            seats: productKey === "additional-seat" ? seats : undefined,
            provider,
            successUrl: session.successUrl,
            cancelUrl: session.cancelUrl,
          }),
        });

        const payload = (await response.json()) as {
          ok: boolean;
          session?: typeof session;
          checkoutUrl?: string | null;
          message?: string;
          error?: string;
        };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? "Checkout failed");
        }

        if (payload.checkoutUrl) {
          window.location.href = payload.checkoutUrl;
          return;
        }

        setSessionPreview(
          payload.message ??
            `${provider} payment prepared for ${formatUsdFromCents(session.amountCents)}. Connect ${provider === "stripe" ? "STRIPE_SECRET_KEY" : "RAZORPAY_KEY_ID"} to redirect to live checkout.`,
        );
      } catch (checkoutError) {
        setError(
          checkoutError instanceof Error
            ? checkoutError.message
            : "Unable to start checkout",
        );
      }
    });
  }

  if (!product) {
    return (
      <CheckoutShell>
        <Card className="mx-auto max-w-lg p-8 text-center">
          <h1 className="text-2xl font-semibold">Nothing to purchase</h1>
          <p className="mt-3 text-sm text-secondary">
            Choose Pro, a credit pack, or additional team seats from pricing.
          </p>
          <Link href="/pricing" className="mt-6 inline-block">
            <Button>View pricing</Button>
          </Link>
        </Card>
      </CheckoutShell>
    );
  }

  return (
    <CheckoutShell>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6 sm:p-8">
          <Badge variant="accent">Secure payment</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">{product.name}</h1>
          <p className="mt-2 text-sm leading-6 text-secondary">{product.description}</p>
          <p className="mt-2 text-xs text-muted">{PRICING_TAGLINE}</p>

          {productKey === "additional-seat" ? (
            <label className="mt-6 block">
              <span className="text-sm text-secondary">Number of seats</span>
              <input
                type="number"
                min={1}
                max={100}
                value={seats}
                onChange={(event) => setSeats(Math.max(1, Number(event.target.value) || 1))}
                className="mt-2 w-full rounded-2xl border border-border bg-elevated px-4 py-3 text-sm outline-none focus:border-primary/50"
              />
            </label>
          ) : null}

          <div className="mt-8 rounded-2xl border border-border bg-elevated/50 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Total due today</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight">
              {product.amountCents === null
                ? "Contact sales"
                : formatUsdFromCents(
                    productKey === "additional-seat"
                      ? Math.round(ADDITIONAL_TEAM_SEAT.price * 100) * seats
                      : product.amountCents,
                  )}
            </p>
            <p className="mt-1 text-sm text-primary">No monthly or yearly subscription</p>
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium">Payment provider</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["stripe", "razorpay"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setProvider(option)}
                  className={`rounded-2xl border px-4 py-3 text-sm capitalize transition ${
                    provider === option
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-secondary hover:bg-elevated"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <p className="mt-4 text-sm text-error" role="alert">
              {error}
            </p>
          ) : null}
          {sessionPreview ? (
            <p className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm text-secondary">
              {sessionPreview}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="gap-2"
              disabled={pending || product.amountCents === null}
              onClick={() => void handleCheckout()}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <CreditCard className="h-4 w-4" aria-hidden />
              )}
              Pay with {provider === "stripe" ? "Stripe" : "Razorpay"}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => router.push("/pricing")}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to pricing
            </Button>
          </div>
        </Card>

        <Card className="h-fit p-6">
          <p className="text-sm font-semibold">What you get</p>
          <ul className="mt-4 space-y-3 text-sm text-secondary">
            {[
              "Secure charge — billing follows your selected plan",
              "Workspace entitlements applied after payment",
              "Receipt and purchase history in Billing",
              "Secure Stripe or Razorpay checkout",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-elevated/40 px-4 py-3 text-xs text-muted">
            <Shield className="h-4 w-4 text-primary" aria-hidden />
            Checkout is secured by your selected payment provider.
          </div>
        </Card>
      </div>
    </CheckoutShell>
  );
}

function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bos-atmosphere min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" aria-label="VanderBase">
          <VanderBaseLogo size="nav" priority />
        </Link>
        <Link href="/credits">
          <Button size="sm" variant="ghost">
            AI Credits
          </Button>
        </Link>
      </header>
      <main className="px-5 pb-20 pt-10 sm:px-8">{children}</main>
    </div>
  );
}
