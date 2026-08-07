import "server-only";
import { createAdminClient } from "@repo/database";
import type { PaymentWebhook } from "./provider";

/**
 * Writes verified provider events to the provider-neutral ledger. The cast is
 * intentionally local until the generated Supabase Database type includes the
 * billing migration in every deployment environment.
 */
export async function persistPaymentWebhook(provider: string, event: PaymentWebhook) {
  const admin = createAdminClient() as any;
  const metadata = event.metadata;
  if (!metadata.userId) return;

  const { error } = await admin.from("billing_transactions").upsert(
    {
      user_id: metadata.userId,
      workspace_id: metadata.workspaceId || null,
      provider,
      provider_event_id: event.eventId,
      provider_order_id: event.orderId || null,
      provider_subscription_id: event.subscriptionId || null,
      kind: event.subscriptionId ? "subscription" : "payment",
      status: event.status,
      amount: event.amount ?? null,
      currency: event.currency ?? null,
      metadata: event.raw,
    },
    { onConflict: "provider,provider_event_id" },
  );
  if (error) throw new Error(`Unable to persist payment event: ${error.message}`);

  if (event.subscriptionId) {
    const attributes = (event.raw as { data?: { attributes?: Record<string, unknown> } })?.data
      ?.attributes;
    const rawStatus = String(attributes?.status ?? event.status);
    const subscriptionError = await admin.from("billing_subscriptions").upsert(
      {
        workspace_id: metadata.workspaceId || null,
        user_id: metadata.userId,
        provider,
        provider_subscription_id: event.subscriptionId,
        plan_id: metadata.planId || metadata.productId || String(attributes?.variant_id ?? "unknown"),
        interval: metadata.interval === "yearly" ? "yearly" : "monthly",
        status: rawStatus,
        current_period_end: attributes?.renews_at
          ? String(attributes.renews_at)
          : null,
        cancel_at_period_end: Boolean(attributes?.cancelled),
        metadata: event.raw,
      },
      { onConflict: "provider,provider_subscription_id" },
    ).then((result: { error?: { message: string } | null }) => result.error);
    if (subscriptionError) {
      throw new Error(`Unable to persist subscription: ${subscriptionError.message}`);
    }
  }
}
