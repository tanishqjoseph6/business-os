import { z } from "zod";
import { getUser } from "@repo/auth/server";
import { getPaymentProvider } from "../../../../lib/payments/provider";

export const runtime = "nodejs";

const bodySchema = z.object({
  action: z.enum(["cancel", "retry", "upgrade"]),
  subscriptionId: z.string().trim().min(1).max(200),
  amount: z.number().positive().optional(),
  providerPlanId: z.string().trim().max(100).optional(),
});

export async function POST(request: Request) {
  const user = await getUser().catch(() => null);
  if (!user) return Response.json({ ok: false, error: "Authentication required" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Invalid subscription request" }, { status: 400 });
  }

  try {
    const provider = getPaymentProvider();
    if (parsed.data.action === "cancel") {
      await provider.cancelSubscription(parsed.data.subscriptionId);
      return Response.json({ ok: true, status: "cancelled" });
    }
    if (parsed.data.action === "upgrade") {
      if (!parsed.data.providerPlanId) {
        return Response.json({ ok: false, error: "A target plan is required" }, { status: 400 });
      }
      await provider.updateSubscription(parsed.data.subscriptionId, parsed.data.providerPlanId);
      return Response.json({ ok: true, status: "updated" });
    }
    const checkout = await provider.retryPayment({
      subscriptionId: parsed.data.subscriptionId,
      amount: parsed.data.amount,
    });
    return Response.json({ ok: true, checkout });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Subscription request failed" },
      { status: 502 },
    );
  }
}

export async function GET(request: Request) {
  const user = await getUser().catch(() => null);
  if (!user) return Response.json({ ok: false, error: "Authentication required" }, { status: 401 });
  const subscriptionId = new URL(request.url).searchParams.get("subscriptionId");
  if (!subscriptionId) {
    return Response.json({ ok: false, error: "subscriptionId is required" }, { status: 400 });
  }
  try {
    const url = await getPaymentProvider().getCustomerPortalUrl(subscriptionId);
    return Response.json({ ok: true, url });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to open customer portal" },
      { status: 502 },
    );
  }
}
