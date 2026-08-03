import type { Metadata } from "next";
import { PricingPage } from "../../components/pricing/pricing-page";

export const metadata: Metadata = {
  title: "Pricing | VanderBase",
  description:
    "Simple, transparent pricing for VanderBase teams. Free, Pro, and Business plans with flexible yearly billing.",
};

export default function PricingRoute() {
  return <PricingPage />;
}
