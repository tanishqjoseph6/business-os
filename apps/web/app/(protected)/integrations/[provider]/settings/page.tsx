import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { IntegrationSettingsClient } from "../../../../../components/integrations/integration-settings-client";
import { IntegrationsShell } from "../../../../../components/integrations/integrations-shell";
import { ensureIntegrationProvidersRegistered } from "../../../../../lib/integrations-hub/providers";
import { loadIntegrationDetail } from "../../../../../lib/integrations-hub/service";
import { resolveActiveWorkspace } from "../../../../../lib/workspace-context";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Integration Settings" };

export default async function IntegrationSettingsPage({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");

  const { provider } = await params;
  ensureIntegrationProvidersRegistered();
  const detail = await loadIntegrationDetail({
    workspaceId: context.active.workspace.id,
    provider,
  });
  if (!detail) notFound();
  if (provider === "gmail") {
    redirect(`/integrations/gmail`);
  }
  if (!detail.account || detail.account.status === "disconnected") {
    redirect(`/integrations/${provider}`);
  }

  return (
    <IntegrationsShell
      badge="Settings"
      title={`${detail.catalog.name} settings`}
      description="Auto sync, notifications, AI access, and permission management."
    >
      <IntegrationSettingsClient
        catalog={detail.catalog}
        account={detail.account}
      />
    </IntegrationsShell>
  );
}
