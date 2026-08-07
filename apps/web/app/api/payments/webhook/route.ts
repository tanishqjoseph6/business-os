import { getPaymentProvider } from "../../../../lib/payments/provider";
import { persistPaymentWebhook } from "../../../../lib/payments/webhook-persistence.server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");
  if (!signature) {
    return Response.json({ ok: false, error: "Missing webhook signature" }, { status: 400 });
  }

  const provider = getPaymentProvider();
  if (!provider.verifyWebhook(rawBody, signature)) {
    return Response.json({ ok: false, error: "Invalid webhook signature" }, { status: 401 });
  }

  try {
    const event = provider.parseWebhook(rawBody);
    await persistPaymentWebhook(provider.id, event);
    console.info("payment.webhook.received", {
      provider: provider.id,
      eventId: event.eventId,
      type: event.type,
      orderId: event.orderId,
      subscriptionId: event.subscriptionId,
      status: event.status,
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "Invalid webhook payload" }, { status: 400 });
  }
}
