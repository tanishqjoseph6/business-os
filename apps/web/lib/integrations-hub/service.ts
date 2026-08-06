import "server-only";

import {
  getIntegrationCatalogItem,
  getIntegrationAccount,
  listIntegrationActivity,
  listIntegrationCatalog,
  listWorkspaceIntegrationAccounts,
} from "@repo/database/integrations";
import type {
  IntegrationAccount,
  IntegrationActivity,
  IntegrationCatalogItem,
  IntegrationConnectionStatus,
  IntegrationHubCard,
  IntegrationHubCategory,
} from "@repo/types";
import { getLaunchProviders } from "./providers";
import {
  getWorkspaceGmailHubAccount,
  mapGmailInboxToIntegrationAccount,
} from "./gmail-bridge";
import { listInboxAccounts } from "@repo/database/inbox";
import { isImplementedIntegrationId } from "../integrations";

export { INTEGRATION_HUB_CATEGORIES } from "./categories";

const FALLBACK_CATALOG: IntegrationCatalogItem[] = getLaunchProviders().map(
  (provider) => ({
    id: provider.id,
    name: provider.name,
    category: provider.category,
    description: provider.description,
    logoKey: provider.id,
    authType: "oauth2",
    featured: Boolean(provider.featured),
    launch: true,
    kairosActions: provider.kairosActions.map((action) => action.name),
    metadata: {},
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  }),
);

export async function loadIntegrationCatalog(): Promise<IntegrationCatalogItem[]> {
  try {
    const rows = await listIntegrationCatalog();
    if (rows.length > 0) {
      const known = new Set(rows.map((row) => row.id));
      return [...rows, ...FALLBACK_CATALOG.filter((row) => !known.has(row.id))];
    }
  } catch {
    // Migration may not be applied yet — fall back to code catalog.
  }
  return FALLBACK_CATALOG;
}

export async function buildIntegrationHubCards(input: {
  workspaceId: string;
  query?: string;
  category?: IntegrationHubCategory;
  status?: IntegrationConnectionStatus;
}): Promise<{
  cards: IntegrationHubCard[];
  connectedCount: number;
  accounts: IntegrationAccount[];
}> {
  const [catalog, accounts, inboxAccounts] = await Promise.all([
    loadIntegrationCatalog(),
    listWorkspaceIntegrationAccounts({ workspaceId: input.workspaceId }).catch(
      () => [] as IntegrationAccount[],
    ),
    listInboxAccounts({ workspaceId: input.workspaceId }).catch(() => []),
  ]);

  const accountByProvider = new Map<string, IntegrationAccount>();
  for (const account of accounts) {
    const current = accountByProvider.get(account.provider);
    if (!current || account.status === "connected") {
      accountByProvider.set(account.provider, account);
    }
  }

  let cards: IntegrationHubCard[] = catalog.map((item) => {
    if (item.id === "gmail") {
      const inboxGmail =
        inboxAccounts.find(
          (account) =>
            account.provider === "gmail" && account.status !== "disconnected",
        ) ?? inboxAccounts.find((account) => account.provider === "gmail");
      if (inboxGmail) {
        const mapped = mapGmailInboxToIntegrationAccount(inboxGmail);
        return {
          ...item,
          account: mapped.status === "not_connected" ? null : mapped,
          status: mapped.status,
          lastSyncAt: mapped.lastSyncAt ?? null,
        };
      }
      return {
        ...item,
        account: null,
        status: "not_connected" as IntegrationConnectionStatus,
        lastSyncAt: null,
      };
    }

    const account = accountByProvider.get(item.id) ?? null;
    const rawStatus: IntegrationConnectionStatus =
      account?.status ?? "not_connected";
    const status: IntegrationConnectionStatus =
      rawStatus === "disconnected" ? "not_connected" : rawStatus;
    return {
      ...item,
      account: status === "not_connected" && rawStatus === "disconnected" ? null : account,
      status,
      lastSyncAt: account?.lastSyncAt ?? null,
    };
  });

  if (input.category && input.category !== "featured") {
    cards = cards.filter((card) => card.category === input.category);
  } else if (input.category === "featured") {
    cards = cards.filter((card) => card.featured);
  }

  if (input.status) {
    cards = cards.filter((card) => card.status === input.status);
  }

  if (input.query?.trim()) {
    const q = input.query.trim().toLowerCase();
    cards = cards.filter(
      (card) =>
        card.name.toLowerCase().includes(q) ||
        card.description.toLowerCase().includes(q) ||
        card.category.toLowerCase().includes(q) ||
        card.status.replaceAll("_", " ").includes(q),
    );
  }

  // Available first, then actively connecting, then upcoming integrations.
  cards.sort((a, b) => {
    const availabilityRank = (card: IntegrationHubCard) => {
      if (!isImplementedIntegrationId(card.id)) return 2;
      if (card.status === "syncing") return 1;
      return 0;
    };
    const availabilityDelta = availabilityRank(a) - availabilityRank(b);
    if (availabilityDelta !== 0) return availabilityDelta;
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const connectedCount =
    cards.filter((card) => card.status === "connected" || card.status === "syncing")
      .length;

  return { cards, connectedCount, accounts };
}

export async function loadIntegrationDetail(input: {
  workspaceId: string;
  provider: string;
}): Promise<{
  catalog: IntegrationCatalogItem;
  account: IntegrationAccount | null;
  activity: IntegrationActivity[];
} | null> {
  let catalog: IntegrationCatalogItem | null = null;
  try {
    catalog = await getIntegrationCatalogItem({ provider: input.provider });
  } catch {
    catalog = null;
  }
  if (!catalog) {
    catalog = FALLBACK_CATALOG.find((item) => item.id === input.provider) ?? null;
  }
  if (!catalog) return null;

  if (input.provider === "gmail") {
    const gmailAccount = await getWorkspaceGmailHubAccount({
      workspaceId: input.workspaceId,
    });
    const activity = await listIntegrationActivity({
      workspaceId: input.workspaceId,
      provider: "gmail",
      limit: 30,
    }).catch(() => [] as IntegrationActivity[]);
    return { catalog, account: gmailAccount, activity };
  }

  const accounts = await listWorkspaceIntegrationAccounts({
    workspaceId: input.workspaceId,
    provider: input.provider,
  }).catch(() => [] as IntegrationAccount[]);
  const account =
    accounts.find((item) => item.status === "connected") ?? accounts[0] ?? null;

  const activity = account
    ? await listIntegrationActivity({
        workspaceId: input.workspaceId,
        accountId: account.id,
        limit: 30,
      }).catch(() => [] as IntegrationActivity[])
    : await listIntegrationActivity({
        workspaceId: input.workspaceId,
        provider: input.provider,
        limit: 30,
      }).catch(() => [] as IntegrationActivity[]);

  return { catalog, account, activity };
}

export function getIntegrationOAuthRedirectUri(origin?: string): string {
  const base =
    origin?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${base}/api/integrations/oauth/callback`;
}

export async function requireIntegrationAccount(input: {
  workspaceId: string;
  accountId: string;
}): Promise<IntegrationAccount> {
  const account = await getIntegrationAccount(input);
  if (!account) throw new Error("Integration account not found");
  return account;
}
