import { PRICING_PLANS } from "../pricing";

export type BillingPlanId = "free" | "pro" | "business";
export type BillingInterval = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "paused" | "cancelled";

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  popular?: boolean;
  features: string[];
  limits: {
    agents: number;
    auditEvents: number;
    apiCalls: number;
    storageGb: number;
    seats: number;
    workspaces: number;
  };
};

export type UsageMetric = {
  id: string;
  label: string;
  used: number;
  limit: number;
  unit: string;
  color: string;
};

export type Invoice = {
  id: string;
  amount: number;
  status: "paid" | "open" | "void";
  date: string;
};

export type PaymentMethod = {
  id: string;
  brand: "Visa" | "Mastercard" | "Amex";
  last4: string;
  expiry: string;
  isDefault: boolean;
};

export type BillingSnapshot = {
  plan: BillingPlanId;
  interval: BillingInterval;
  status: SubscriptionStatus;
  renewalDate: string;
  billingEmail: string;
  workspaceName: string;
  usage: UsageMetric[];
  invoices: Invoice[];
  paymentMethods: PaymentMethod[];
};

export const billingPlans: BillingPlan[] = PRICING_PLANS.map((plan) => ({
  id: plan.id,
  name: plan.name,
  description: plan.description,
  monthlyPrice: plan.monthlyPrice,
  yearlyPrice: plan.yearlyPrice,
  popular: plan.popular,
  features: plan.features,
  limits: {
    agents: plan.id === "free" ? 2 : plan.id === "pro" ? 10 : 50,
    auditEvents: plan.id === "free" ? 250 : plan.id === "pro" ? 5000 : 15000,
    apiCalls: plan.id === "free" ? 0 : plan.id === "pro" ? 50000 : 250000,
    storageGb: plan.id === "free" ? 5 : plan.id === "pro" ? 50 : 250,
    seats: plan.id === "free" ? 3 : plan.id === "pro" ? 10 : 50,
    workspaces: plan.workspaces ?? 1,
  },
}));

export const mockBillingSnapshot: BillingSnapshot = {
  plan: "pro",
  interval: "monthly",
  status: "active",
  renewalDate: "2026-09-01",
  billingEmail: "billing@korclaw.com",
  workspaceName: "KorClaw HQ",
  usage: [
    { id: "agents", label: "AI Agents", used: 7, limit: 10, unit: "agents", color: "bg-violet-400" },
    { id: "audit-events", label: "Audit Events", used: 2840, limit: 5000, unit: "events", color: "bg-cyan-400" },
    { id: "api-calls", label: "API Calls", used: 28420, limit: 50000, unit: "calls", color: "bg-amber-400" },
    { id: "storage", label: "Storage", used: 32, limit: 50, unit: "GB", color: "bg-emerald-400" },
    { id: "seats", label: "Seats", used: 6, limit: 10, unit: "seats", color: "bg-pink-400" },
  ],
  invoices: [
    { id: "INV-2026-08-001", amount: 59, status: "paid", date: "2026-08-01" },
    { id: "INV-2026-07-001", amount: 59, status: "paid", date: "2026-07-01" },
    { id: "INV-2026-06-001", amount: 59, status: "paid", date: "2026-06-01" },
  ],
  paymentMethods: [],
};

export async function getBillingSnapshot(): Promise<BillingSnapshot> {
  await Promise.resolve();
  return structuredClone(mockBillingSnapshot);
}

export async function changeBillingPlan(plan: BillingPlanId, interval: BillingInterval) {
  // TODO(stripe): Create a Checkout Session for plan changes and return its URL.
  await Promise.resolve({ plan, interval });
  return { ok: true as const };
}

export async function manageSubscription(action: "upgrade" | "downgrade" | "cancel" | "pause" | "reactivate") {
  // TODO(stripe): Replace with Customer Portal session or subscription mutation.
  await Promise.resolve(action);
  return { ok: true as const };
}

export async function addPaymentMethod() {
  // TODO(stripe): Create SetupIntent and confirm the card client-side with Stripe Elements.
  await Promise.resolve();
  return { ok: true as const };
}

export async function buyAddon(addon: string) {
  // TODO(stripe): Create a one-time Checkout Session for the selected add-on.
  await Promise.resolve(addon);
  return { ok: true as const };
}

export async function updateBillingSettings(values: Record<string, string>) {
  // TODO(stripe): Update the Stripe Customer tax and billing address metadata.
  await Promise.resolve(values);
  return { ok: true as const };
}

