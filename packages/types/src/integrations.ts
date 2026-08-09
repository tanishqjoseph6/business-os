import { z } from "zod";

export const integrationConnectionStatusSchema = z.enum([
  "connected",
  "not_connected",
  "error",
  "syncing",
  "disconnected",
]);
export type IntegrationConnectionStatus = z.infer<
  typeof integrationConnectionStatusSchema
>;

export const integrationActivityEventSchema = z.enum([
  "connected",
  "disconnected",
  "permission_updated",
  "manual_sync",
  "automatic_sync",
  "error",
  "token_refreshed",
  "reconnect",
]);
export type IntegrationActivityEvent = z.infer<
  typeof integrationActivityEventSchema
>;

export const integrationSyncJobStatusSchema = z.enum([
  "queued",
  "running",
  "succeeded",
  "failed",
  "cancelled",
]);
export type IntegrationSyncJobStatus = z.infer<
  typeof integrationSyncJobStatusSchema
>;

export const integrationHubCategorySchema = z.enum([
  "featured",
  "ai",
  "google",
  "microsoft",
  "communication",
  "productivity",
  "development",
  "crm",
  "finance",
  "storage",
]);
export type IntegrationHubCategory = z.infer<typeof integrationHubCategorySchema>;

export type IntegrationCatalogItem = {
  id: string;
  name: string;
  category: Exclude<IntegrationHubCategory, "featured">;
  description: string;
  logoKey: string | null;
  authType: string;
  featured: boolean;
  launch: boolean;
  kairosActions: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type IntegrationAccount = {
  id: string;
  workspaceId: string;
  provider: string;
  accountEmail: string | null;
  accountName: string | null;
  externalAccountId: string | null;
  status: IntegrationConnectionStatus;
  permissions: string[];
  scopes: string[];
  lastSyncAt: string | null;
  syncFrequency: string;
  autoSync: boolean;
  notificationsEnabled: boolean;
  kairosAccess: boolean;
  health: string;
  errorMessage: string | null;
  connectedBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type IntegrationActivity = {
  id: string;
  workspaceId: string;
  accountId: string | null;
  provider: string;
  eventType: IntegrationActivityEvent;
  title: string;
  body: string | null;
  actorId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type IntegrationSyncJob = {
  id: string;
  workspaceId: string;
  accountId: string;
  provider: string;
  status: IntegrationSyncJobStatus;
  trigger: string;
  attempts: number;
  maxAttempts: number;
  startedAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
  result: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type IntegrationHubCard = IntegrationCatalogItem & {
  account: IntegrationAccount | null;
  status: IntegrationConnectionStatus;
  lastSyncAt: string | null;
};

export const startIntegrationOAuthSchema = z.object({
  provider: z.string().trim().min(1).max(80),
});

export const disconnectIntegrationSchema = z.object({
  accountId: z.string().uuid(),
});

export const updateIntegrationSettingsSchema = z.object({
  accountId: z.string().uuid(),
  autoSync: z.boolean().optional(),
  notificationsEnabled: z.boolean().optional(),
  kairosAccess: z.boolean().optional(),
  syncFrequency: z
    .enum(["manual", "hourly", "daily", "weekly"])
    .optional(),
});

export const manualSyncIntegrationSchema = z.object({
  accountId: z.string().uuid(),
});

export const listIntegrationsSchema = z.object({
  query: z.string().trim().max(120).optional(),
  category: integrationHubCategorySchema.optional(),
  status: integrationConnectionStatusSchema.optional(),
});
