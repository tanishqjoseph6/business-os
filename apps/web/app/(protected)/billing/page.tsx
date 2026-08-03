import type { Metadata } from "next";
import { ModulePageShell } from "../../../components/app/module-page-shell";
import { BillingShell } from "../../../components/billing/billing-shell";

export const metadata: Metadata = {
  title: "Billing | KorClaw",
  description: "Manage your KorClaw plan, usage, invoices, and payment methods.",
};

export default function BillingPage() {
  return (
    <ModulePageShell
      badge="Billing"
      title="Billing & subscription"
      description="Manage your plan, usage, invoices, and payment methods from one place."
    >
      <BillingShell />
    </ModulePageShell>
  );
}
