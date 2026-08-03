import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ModulePageShell } from "../../../../components/app/module-page-shell";
import { BillingShell, type BillingSection } from "../../../../components/billing/billing-shell";

const sections = new Set<BillingSection>([
  "plans",
  "usage",
  "invoices",
  "payment-methods",
  "addons",
  "settings",
  "subscription",
]);

export const metadata: Metadata = {
  title: "Billing | KorClaw",
  description: "Manage your KorClaw billing workspace.",
};

export default async function BillingSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.has(section as BillingSection)) notFound();

  return (
    <ModulePageShell
      badge="Billing"
      title="Billing & subscription"
      description="Manage your plan, usage, invoices, and payment methods from one place."
    >
      <BillingShell section={section as BillingSection} />
    </ModulePageShell>
  );
}

