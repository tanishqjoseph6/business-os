import { z } from "zod";
import { getUser } from "@repo/auth/server";
import { getSiteUrl } from "@repo/auth/site-url";

export const runtime = "nodejs";
import {
  createOneTimeCheckoutSession,
  resolveCheckoutProduct,
  type CheckoutProvider,
} from "../../../lib/checkout";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

const bodySchema = z.object({
  product: z.string().trim().max(80).optional(),
  pack: z.string().trim().max(80).optional(),
  seats: z.number().int().min(1).max(100).optional(),
  provider: z.enum(["stripe", "razorpay"]).default("stripe"),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

/**
 * Creates a one-time payment checkout session (never a subscription).
 * When Stripe/Razorpay secrets are configured, returns a live checkout URL.
 * Otherwise returns a structured one-time session payload for the client.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const product = resolveCheckoutProduct({
    product: parsed.data.product,
    pack: parsed.data.pack,
    seats: parsed.data.seats,
  });

  if (!product) {
    return Response.json(
      { ok: false, error: "Unknown or unavailable product" },
      { status: 400 },
    );
  }

  if (product.amountCents === null) {
    return Response.json(
      {
        ok: false,
        error: "This product requires contacting hello@vanderbase.com",
        contactSales: true,
      },
      { status: 400 },
    );
  }

  const user = await getUser().catch(() => null);
  const workspace = user ? await resolveActiveWorkspace().catch(() => null) : null;
  const siteUrl = getSiteUrl();
  const provider = parsed.data.provider as CheckoutProvider;

  try {
    const session = createOneTimeCheckoutSession({
      product,
      provider,
      workspaceId: workspace?.active.workspace.id,
      userId: user?.id,
      successUrl:
        parsed.data.successUrl ?? `${siteUrl}/billing?checkout=success`,
      cancelUrl:
        parsed.data.cancelUrl ?? `${siteUrl}/pricing?checkout=cancelled`,
      quantity: parsed.data.seats ?? 1,
    });

    // Live provider handoff when secrets exist — still one-time payment only.
    const checkoutUrl = await createLiveCheckoutUrl(session);

    return Response.json({
      ok: true,
      mode: "payment",
      billing: "one_time",
      session,
      checkoutUrl,
      message: checkoutUrl
        ? undefined
        : `One-time ${provider} session prepared. Add provider API keys to enable live redirect.`,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Checkout failed",
      },
      { status: 500 },
    );
  }
}

async function createLiveCheckoutUrl(session: {
  provider: CheckoutProvider;
  amountCents: number;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
  providerPayload: Record<string, unknown>;
}): Promise<string | null> {
  if (session.provider === "stripe") {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) return null;

    // Stripe Checkout Session API — mode must remain "payment" (one-time).
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", session.successUrl);
    params.set("cancel_url", session.cancelUrl);
    params.set("line_items[0][price_data][currency]", "usd");
    params.set(
      "line_items[0][price_data][unit_amount]",
      String(
        (session.providerPayload as { line_items?: Array<{ price_data?: { unit_amount?: number }; quantity?: number }> })
          .line_items?.[0]?.price_data?.unit_amount ?? session.amountCents,
      ),
    );
    params.set(
      "line_items[0][price_data][product_data][name]",
      session.metadata.productId || "VanderBase",
    );
    params.set(
      "line_items[0][quantity]",
      String(
        (session.providerPayload as { line_items?: Array<{ quantity?: number }> })
          .line_items?.[0]?.quantity ?? 1,
      ),
    );
    for (const [key, value] of Object.entries(session.metadata)) {
      if (value) params.set(`metadata[${key}]`, value);
    }

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Stripe checkout failed: ${detail.slice(0, 200)}`);
    }

    const data = (await response.json()) as { url?: string };
    return data.url ?? null;
  }

  // Razorpay: create order; frontend opens checkout with order_id (one-time).
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: session.amountCents,
      currency: "USD",
      receipt: `vb_${Date.now()}`,
      notes: session.metadata,
      // No plan_id / subscription fields — one-time order only
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Razorpay order failed: ${detail.slice(0, 200)}`);
  }

  const order = (await response.json()) as { id?: string };
  if (!order.id) return null;

  // Client completes Razorpay Checkout with this order; return success deep-link hint.
  const params = new URLSearchParams({
    provider: "razorpay",
    order_id: order.id,
    key_id: keyId,
  });
  return `${session.successUrl}${session.successUrl.includes("?") ? "&" : "?"}${params.toString()}`;
}
