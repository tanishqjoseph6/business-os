import { z } from "zod";
import { getUser } from "@repo/auth/server";
import { getSiteUrl } from "@repo/auth/site-url";
import {
  createOneTimeCheckoutSession,
  resolveCheckoutProduct,
  type CheckoutProvider,
} from "../../../lib/checkout";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import { getPaymentProvider } from "../../../lib/payments/provider";

export const runtime = "nodejs";

const bodySchema = z.object({
  product: z.string().trim().max(80).optional(),
  pack: z.string().trim().max(80).optional(),
  seats: z.number().int().min(1).max(100).optional(),
  provider: z.string().trim().max(40).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

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

  const product = resolveCheckoutProduct(parsed.data);
  if (!product || product.amountCents === null) {
    return Response.json(
      { ok: false, error: "Unknown or unavailable product", contactSales: !product },
      { status: 400 },
    );
  }

  const user = await getUser().catch(() => null);
  if (!user) {
    return Response.json({ ok: false, error: "Sign in before starting checkout" }, { status: 401 });
  }
  const workspace = await resolveActiveWorkspace().catch(() => null);
  const siteUrl = getSiteUrl();
  try {
    const paymentProvider = getPaymentProvider();
    const provider = paymentProvider.id as CheckoutProvider;
    const session = createOneTimeCheckoutSession({
      product,
      provider,
      workspaceId: workspace?.active.workspace.id,
      userId: user.id,
      successUrl: parsed.data.successUrl ?? `${siteUrl}/billing/success`,
      cancelUrl: parsed.data.cancelUrl ?? `${siteUrl}/billing/failed`,
      quantity: parsed.data.seats ?? 1,
    });
    const orderId = `vb_${session.productKind}_${session.productId}_${crypto.randomUUID()}`;
    const checkout = await paymentProvider.createCheckout({
      mode: session.mode,
      orderId,
      amount: session.amountCents / 100,
      currency: "USD",
      customer: {
        id: user.id,
        email: user.email ?? "billing@vanderbase.com",
        name:
          typeof user.userMetadata?.full_name === "string"
            ? user.userMetadata.full_name
            : undefined,
      },
      returnUrl: session.successUrl,
      notifyUrl: `${siteUrl}/api/payments/webhook`,
      metadata: session.metadata,
      providerPlanId:
        process.env[
          `LEMONSQUEEZY_VARIANT_${session.productId.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`
        ],
    });

    return Response.json({
      ok: true,
      mode: session.mode,
      billing: session.mode === "subscription" ? "subscription" : "one_time",
      session,
      checkout,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 },
    );
  }
}
