import "server-only";
import { createHmac, timingSafeEqual as nodeTimingSafeEqual } from "node:crypto";

export type PaymentMode = "payment" | "subscription";

export type PaymentCheckoutInput = {
  mode: PaymentMode;
  orderId: string;
  amount: number;
  currency: string;
  customer: { id: string; email: string; name?: string; phone?: string };
  returnUrl: string;
  notifyUrl: string;
  metadata: Record<string, string>;
  /** Provider-specific product/variant identifier. */
  providerPlanId?: string;
};

export type PaymentCheckoutResult = {
  provider: string;
  mode: PaymentMode;
  orderId: string;
  checkoutToken: string;
  redirectUrl?: string;
  metadata: Record<string, string>;
};

export type PaymentWebhook = {
  eventId: string;
  type: string;
  orderId?: string;
  subscriptionId?: string;
  status: "succeeded" | "failed" | "pending" | "cancelled" | "unknown";
  amount?: number;
  currency?: string;
  metadata: Record<string, string>;
  raw: unknown;
};

export interface PaymentProvider {
  readonly id: string;
  createCheckout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  updateSubscription(subscriptionId: string, providerPlanId: string): Promise<void>;
  getCustomerPortalUrl(subscriptionId: string): Promise<string>;
  retryPayment(input: { subscriptionId: string; amount?: number }): Promise<PaymentCheckoutResult>;
  verifyWebhook(rawBody: string, signature: string, timestamp?: string): boolean;
  parseWebhook(rawBody: string): PaymentWebhook;
}

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER?.trim().toLowerCase() || "lemonsqueezy";
  if (provider === "lemonsqueezy") return new LemonSqueezyPaymentProvider();
  throw new Error(`Unsupported payment provider: ${provider}`);
}

class LemonSqueezyPaymentProvider implements PaymentProvider {
  readonly id = "lemonsqueezy";
  private readonly apiUrl = "https://api.lemonsqueezy.com/v1";

  private get config() {
    const apiKey = process.env.LEMONSQUEEZY_API_KEY?.trim();
    const storeId = process.env.LEMONSQUEEZY_STORE_ID?.trim();
    if (!apiKey || !storeId) {
      throw new Error("LEMONSQUEEZY_API_KEY and LEMONSQUEEZY_STORE_ID are required");
    }
    return { apiKey, storeId };
  }

  async createCheckout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult> {
    const variantId = input.providerPlanId;
    if (!variantId) throw new Error("A Lemon Squeezy variant is not configured for this product");

    const response = await this.request("/checkouts", "POST", {
      data: {
        type: "checkouts",
        attributes: {
          product_options: { redirect_url: input.returnUrl },
          checkout_data: {
            email: input.customer.email,
            name: input.customer.name,
            custom: input.metadata,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: this.config.storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    });

    const url = String(response.data?.attributes?.url ?? "");
    if (!url) throw new Error("Lemon Squeezy did not return a checkout URL");
    return {
      provider: this.id,
      mode: input.mode,
      orderId: input.orderId,
      checkoutToken: url,
      redirectUrl: url,
      metadata: input.metadata,
    };
  }

  async cancelSubscription(subscriptionId: string) {
    await this.request(`/subscriptions/${encodeURIComponent(subscriptionId)}`, "DELETE");
  }

  async updateSubscription(subscriptionId: string, providerPlanId: string) {
    await this.request(`/subscriptions/${encodeURIComponent(subscriptionId)}`, "PATCH", {
      data: {
        type: "subscriptions",
        id: subscriptionId,
        attributes: { variant_id: Number(providerPlanId) },
      },
    });
  }

  async getCustomerPortalUrl(subscriptionId: string) {
    const response = await this.request(
      `/subscriptions/${encodeURIComponent(subscriptionId)}`,
      "GET",
    );
    const url = String(response.data?.attributes?.urls?.customer_portal ?? "");
    if (!url) throw new Error("Lemon Squeezy did not return a customer portal URL");
    return url;
  }

  async retryPayment(input: { subscriptionId: string }) {
    // Lemon Squeezy exposes payment recovery through the customer portal.
    const url = await this.getCustomerPortalUrl(input.subscriptionId);
    return {
      provider: this.id,
      mode: "subscription" as const,
      orderId: input.subscriptionId,
      checkoutToken: url,
      redirectUrl: url,
      metadata: {},
    };
  }

  verifyWebhook(rawBody: string, signature: string) {
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET?.trim();
    if (!secret || !signature) return false;
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const left = Buffer.from(expected, "utf8");
    const right = Buffer.from(signature, "utf8");
    return left.length === right.length && nodeTimingSafeEqual(left, right);
  }

  parseWebhook(rawBody: string): PaymentWebhook {
    const payload = JSON.parse(rawBody) as Record<string, any>;
    const data = payload.data ?? {};
    const attributes = data.attributes ?? {};
    const eventType = String(payload.meta?.event_name ?? "unknown");
    const customData = payload.meta?.custom_data ?? {};
    const status = String(attributes.status ?? "").toLowerCase();
    const successful =
      eventType === "order_created" ||
      eventType === "subscription_created" ||
      eventType === "subscription_payment_success";

    return {
      eventId: `${String(data.id ?? "unknown")}:${eventType}`,
      type: eventType,
      orderId: attributes.order_id ? String(attributes.order_id) : undefined,
      subscriptionId:
        data.type === "subscriptions" || attributes.subscription_id
          ? String(data.id ?? attributes.subscription_id)
          : undefined,
      status:
        successful || status === "active"
          ? "succeeded"
          : status === "cancelled" || status === "expired"
            ? "cancelled"
            : status === "past_due" || eventType.includes("failed")
              ? "failed"
              : status
                ? "pending"
                : "unknown",
      amount: attributes.total ? Number(attributes.total) / 100 : undefined,
      currency: attributes.currency ? String(attributes.currency) : "USD",
      metadata: Object.fromEntries(
        Object.entries(customData).map(([key, value]) => [key, String(value)]),
      ),
      raw: payload,
    };
  }

  private async request(path: string, method: "GET" | "POST" | "PATCH" | "DELETE", body?: unknown) {
    const response = await fetch(`${this.apiUrl}${path}`, {
      method,
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Lemon Squeezy request failed (${response.status}): ${detail.slice(0, 300)}`);
    }
    return (await response.json()) as { data?: any };
  }
}
