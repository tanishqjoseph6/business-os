import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { listInboxThreads } from "@repo/database/inbox";
import { IntegrationDetailClient } from "../../../../components/integrations/integration-detail-client";
import { IntegrationsShell } from "../../../../components/integrations/integrations-shell";
import { ensureIntegrationProvidersRegistered } from "../../../../lib/integrations-hub/providers";
import { loadIntegrationDetail } from "../../../../lib/integrations-hub/service";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ provider: string }>;
}): Promise<Metadata> {
  const { provider } = await params;
  return { title: `${provider} · Integrations` };
}

export default async function IntegrationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ provider: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");

  const { provider } = await params;
  const query = await searchParams;
  ensureIntegrationProvidersRegistered();

  const detail = await loadIntegrationDetail({
    workspaceId: context.active.workspace.id,
    provider,
  });
  if (!detail) notFound();

  const searchQuery = typeof query.q === "string" ? query.q : undefined;
  const oauthError =
    typeof query.error === "string"
      ? query.error
      : query.oauth === "error"
        ? "OAuth authorization failed"
        : null;

  const gmailThreads =
    provider === "gmail" && detail.account
      ? await listInboxThreads({
          workspaceId: context.active.workspace.id,
          accountId: detail.account.id,
          query: searchQuery,
        }).catch(() => [])
      : [];

  return (
    <IntegrationsShell
      badge={detail.catalog.name}
      title={detail.catalog.name}
      description={detail.catalog.description}
    >
      <IntegrationDetailClient
        catalog={detail.catalog}
        account={detail.account}
        activity={detail.activity}
        justConnected={query.connected === "1"}
        gmailThreads={gmailThreads}
        oauthError={oauthError}
      />
    </IntegrationsShell>
  );
}
