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

export const billingPlans: BillingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "For exploring the KorClaw workspace.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ["1 workspace", "2 AI agents", "500 audit events / month", "5 GB storage"],
    limits: { agents: 2, auditEvents: 500, apiCalls: 1000, storageGb: 5, seats: 3, workspaces: 1 },
  },
  {
    id: "pro",
    name: "Pro",
    description: "For teams turning repeatable work into leverage.",
    monthlyPrice: 29,
    yearlyPrice: 290,
    popular: true,
    features: ["10 AI agents", "25,000 audit events / month", "100K API calls / month", "100 GB storage"],
    limits: { agents: 10, auditEvents: 25000, apiCalls: 100000, storageGb: 100, seats: 10, workspaces: 3 },
  },
  {
    id: "business",
    name: "Business",
    description: "For sophisticated operations with room to scale.",
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: ["Unlimited AI agents", "250,000 audit events / month", "1M API calls / month", "1 TB storage"],
    limits: { agents: 50, auditEvents: 250000, apiCalls: 1000000, storageGb: 1000, seats: 50, workspaces: 10 },
  },
];

export const mockBillingSnapshot: BillingSnapshot = {
  plan: "pro",
  interval: "monthly",
  status: "active",
  renewalDate: "2026-09-01",
  billingEmail: "billing@korclaw.com",
  workspaceName: "KorClaw HQ",
  usage: [
    { id: "agents", label: "AI Agents", used: 7, limit: 10, unit: "agents", color: "bg-violet-400" },
    { id: "audit-events", label: "Audit Events", used: 18420, limit: 25000, unit: "events", color: "bg-cyan-400" },
    { id: "api-calls", label: "API Calls", used: 68420, limit: 100000, unit: "calls", color: "bg-amber-400" },
    { id: "storage", label: "Storage", used: 68, limit: 100, unit: "GB", color: "bg-emerald-400" },
    { id: "seats", label: "Seats", used: 6, limit: 10, unit: "seats", color: "bg-pink-400" },
  ],
  invoices: [
    { id: "INV-2026-08-001", amount: 29, status: "paid", date: "2026-08-01" },
    { id: "INV-2026-07-001", amount: 29, status: "paid", date: "2026-07-01" },
    { id: "INV-2026-06-001", amount: 29, status: "paid", date: "2026-06-01" },
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

