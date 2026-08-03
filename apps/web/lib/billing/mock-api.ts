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
    features: ["1 Workspace", "Up to 2 AI Agents", "250 Audit Events / month", "5 GB Storage", "Community Support"],
    limits: { agents: 2, auditEvents: 250, apiCalls: 0, storageGb: 5, seats: 3, workspaces: 1 },
  },
  {
    id: "pro",
    name: "Pro",
    description: "For teams turning repeatable work into leverage.",
    monthlyPrice: 59,
    yearlyPrice: 649,
    popular: true,
    features: ["Up to 5 Workspaces", "Up to 10 AI Agents", "5,000 Audit Events / month", "50,000 API Calls / month", "50 GB Storage", "Priority Support", "All Core KorClaw Features"],
    limits: { agents: 10, auditEvents: 5000, apiCalls: 50000, storageGb: 50, seats: 10, workspaces: 5 },
  },
  {
    id: "business",
    name: "Business",
    description: "For sophisticated operations with room to scale.",
    monthlyPrice: 149,
    yearlyPrice: 1639,
    features: ["Up to 20 Workspaces", "Up to 50 AI Agents", "15,000 Audit Events / month", "250,000 API Calls / month", "250 GB Storage", "API Access", "Advanced Admin Controls", "Team Management", "Audit Logs", "Priority Support"],
    limits: { agents: 50, auditEvents: 15000, apiCalls: 250000, storageGb: 250, seats: 50, workspaces: 20 },
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

