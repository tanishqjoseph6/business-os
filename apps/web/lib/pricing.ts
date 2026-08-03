/** Shared production pricing configuration used by the landing and billing pages. */
export type PricingPlanId = "free" | "pro" | "business";

export type PricingPlan = {
  id: PricingPlanId;
  name: string;
  description: string;
  /** One-time price in USD. null = custom / contact sales. */
  price: number | null;
  monthlyPrice: number;
  yearlyPrice: number;
  /** Billing cadence label shown in UI. */
  billingLabel: "Free forever" | "One-time purchase" | "Custom pricing" | "Monthly or yearly";
  credits: number | null;
  teamMembers: number | null;
  workspaces: number | null;
  features: string[];
  popular?: boolean;
  cta: string;
  ctaHref: string;
};

export type CreditPack = {
  id: string;
  credits: number | null;
  price: number | null;
  label: string;
  popular?: boolean;
  contactSales?: boolean;
};

export type TeamSeatProduct = {
  id: "additional-seat";
  name: string;
  price: number;
  billingLabel: "One-time purchase";
  description: string;
};

export type StorageAddon = {
  id: string;
  label: string;
  gb: number;
  monthlyPrice: number;
  popular?: boolean;
};

export const PRICING_TAGLINE =
  "Simple, transparent pricing that scales with your business.";

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Start with the essentials—no card required.",
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    billingLabel: "Free forever",
    credits: 100,
    teamMembers: 3,
    workspaces: 1,
    features: [
      "1 Workspace",
      "2 AI Agents",
      "250 Audit Events / month",
      "5 GB Storage",
    ],
    cta: "Get Started",
    ctaHref: "/?join=waitlist",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For teams turning repeatable work into leverage.",
    price: 59,
    monthlyPrice: 59,
    yearlyPrice: 649,
    billingLabel: "Monthly or yearly",
    credits: null,
    teamMembers: null,
    workspaces: 5,
    popular: true,
    features: [
      "Up to 10 AI Agents",
      "Up to 5 Workspaces",
      "5,000 Audit Events / month",
      "50K API Calls / month",
      "50 GB Storage",
    ],
    cta: "Start Free Trial",
    ctaHref: "/signup",
  },
  {
    id: "business",
    name: "Business",
    description: "For sophisticated operations with room to scale.",
    price: 149,
    monthlyPrice: 149,
    yearlyPrice: 1639,
    billingLabel: "Monthly or yearly",
    credits: null,
    teamMembers: null,
    workspaces: 20,
    features: [
      "Up to 50 AI Agents",
      "Up to 20 Workspaces",
      "15,000 Audit Events / month",
      "250K API Calls / month",
      "250 GB Storage",
    ],
    cta: "Contact Sales",
    ctaHref: "mailto:sales@vanderbase.com",
  },
];

export const STORAGE_ADDONS: StorageAddon[] = [
  { id: "storage-25", label: "+25 GB", gb: 25, monthlyPrice: 9 },
  { id: "storage-100", label: "+100 GB", gb: 100, monthlyPrice: 29, popular: true },
  { id: "storage-250", label: "+250 GB", gb: 250, monthlyPrice: 59 },
  { id: "storage-500", label: "+500 GB", gb: 500, monthlyPrice: 99 },
  { id: "storage-1tb", label: "+1 TB", gb: 1000, monthlyPrice: 179 },
];

export const ADDITIONAL_TEAM_SEAT: TeamSeatProduct = {
  id: "additional-seat",
  name: "Additional Team Member",
  price: 25,
  billingLabel: "One-time purchase",
  description:
    "Expand beyond your plan’s included seats. Each additional member is a one-time purchase.",
};

export const AI_CREDIT_PACKS: CreditPack[] = [
  {
    id: "credits-1k",
    credits: 1_000,
    price: 9,
    label: "1,000 Credits",
  },
  {
    id: "credits-5k",
    credits: 5_000,
    price: 29,
    label: "5,000 Credits",
    popular: true,
  },
  {
    id: "credits-10k",
    credits: 10_000,
    price: 49,
    label: "10,000 Credits",
  },
  {
    id: "credits-25k",
    credits: 25_000,
    price: 99,
    label: "25,000 Credits",
  },
  {
    id: "credits-50k",
    credits: 50_000,
    price: 179,
    label: "50,000 Credits",
  },
  {
    id: "credits-100k",
    credits: 100_000,
    price: 299,
    label: "100,000 Credits",
  },
  {
    id: "credits-250k",
    credits: 250_000,
    price: 599,
    label: "250,000 Credits",
  },
  {
    id: "credits-500k",
    credits: 500_000,
    price: null,
    label: "500,000 Credits",
    contactSales: true,
  },
];

export const COMPARISON_ROWS: string[][] = [
  ["Price", "$0 / month", "$59 / month", "$149 / month"],
  ["Yearly", "$0 / year", "$649 / year", "$1,639 / year"],
  ["Workspaces", "1", "5", "20"],
  ["AI agents", "2", "10", "50"],
  ["Audit events", "250 / month", "5,000 / month", "15,000 / month"],
  ["API calls", "—", "50K / month", "250K / month"],
  ["Storage", "5 GB", "50 GB", "250 GB"],
];

export const CREDITS_USAGE_HINT =
  "Shared across chat, inbox, content, agents, and automations. Buy more packs anytime—never a subscription.";

export function formatPlanPrice(plan: PricingPlan): string {
  if (plan.price === null) return "Custom";
  if (plan.price === 0) return "$0";
  return `$${plan.price}`;
}

export function formatPlanCredits(plan: PricingPlan): string {
  if (plan.credits === null) return "Custom AI Credits";
  return `${plan.credits.toLocaleString()} AI Credits included`;
}

export function formatCreditPackPrice(pack: CreditPack): string {
  if (pack.contactSales || pack.price === null) return "Contact Sales";
  return `$${pack.price}`;
}

export function getPlanById(id: PricingPlanId): PricingPlan | undefined {
  return PRICING_PLANS.find((plan) => plan.id === id);
}

export function getCreditPackById(id: string): CreditPack | undefined {
  return AI_CREDIT_PACKS.find((pack) => pack.id === id);
}
