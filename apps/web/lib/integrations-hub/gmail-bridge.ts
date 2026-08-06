import "server-only";

import type { IntegrationAccount, IntegrationConnectionStatus } from "@repo/types";
import { disconnectInboxAccount, listInboxAccounts } from "@repo/database/inbox";

/** Map a workspace Gmail inbox account to the integrations hub account shape. */
export function mapGmailInboxToIntegrationAccount(
  account: Awaited<ReturnType<typeof listInboxAccounts>>[number],
): IntegrationAccount {
  const status: IntegrationConnectionStatus =
    account.status === "disconnected"
      ? "not_connected"
      : account.status === "syncing"
        ? "syncing"
        : account.status === "error"
          ? "error"
          : "connected";

  return {
    id: account.id,
    workspaceId: account.workspaceId,
    provider: "gmail",
    accountEmail: account.email,
    accountName: account.displayName ?? account.email,
    externalAccountId: account.email,
    status,
    permissions: ["Read email", "Send email", "Modify labels"],
    scopes: [],
    lastSyncAt: account.lastSyncedAt,
    syncFrequency: "manual",
    autoSync: true,
    notificationsEnabled: true,
    kairosAccess: true,
    health: account.status === "error" ? "error" : "healthy",
    errorMessage: account.syncError ?? null,
    connectedBy: account.createdBy,
    metadata: account.metadata ?? {},
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

export async function getWorkspaceGmailHubAccount(input: {
  workspaceId: string;
}): Promise<IntegrationAccount | null> {
  const accounts = await listInboxAccounts({ workspaceId: input.workspaceId });
  const gmail =
    accounts.find(
      (account) =>
        account.provider === "gmail" &&
        account.status !== "disconnected",
    ) ?? accounts.find((account) => account.provider === "gmail");
  return gmail ? mapGmailInboxToIntegrationAccount(gmail) : null;
}

export async function getGmailHubAccountById(input: {
  workspaceId: string;
  accountId: string;
}): Promise<IntegrationAccount | null> {
  const accounts = await listInboxAccounts({ workspaceId: input.workspaceId });
  const gmail = accounts.find(
    (account) => account.id === input.accountId && account.provider === "gmail",
  );
  return gmail ? mapGmailInboxToIntegrationAccount(gmail) : null;
}

export async function requireGmailHubAccountById(input: {
  workspaceId: string;
  accountId: string;
}): Promise<IntegrationAccount> {
  const account = await getGmailHubAccountById(input);
  if (!account) throw new Error("Gmail account not found");
  return account;
}

export async function disconnectGmailHubAccount(input: {
  workspaceId: string;
  accountId: string;
}): Promise<void> {
  await disconnectInboxAccount({
    workspaceId: input.workspaceId,
    id: input.accountId,
  });
}
