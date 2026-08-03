/**
 * Modular integration provider interface.
 * Every provider implements the same contract so the Hub can scale to 200+.
 *
 * OAuth state signing lives in oauth-state.server.ts (server-only).
 */

export type IntegrationProviderId =
  | "openai"
  | "anthropic"
  | "vercel"
  | "supabase"
  | "gmail"
  | "google-drive"
  | "google-calendar"
  | "google-docs"
  | "outlook"
  | "onedrive"
  | "slack"
  | "discord"
  | "zoom"
  | "notion"
  | "trello"
  | "clickup"
  | "asana"
  | "github"
  | "gitlab"
  | "stripe"
  | "paypal"
  | "dropbox";

export type IntegrationProviderCategory =
  | "ai"
  | "google"
  | "microsoft"
  | "communication"
  | "productivity"
  | "development"
  | "finance"
  | "storage";

export type KairosIntegrationAction = {
  name: string;
  description: string;
  examplePrompt: string;
};

export type OAuthTokenSet = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  scopes: string[];
  tokenType: string;
  metadata?: Record<string, unknown>;
};

export type OAuthAccountProfile = {
  email: string | null;
  name: string | null;
  externalAccountId: string;
};

export type IntegrationProviderDefinition = {
  id: IntegrationProviderId;
  name: string;
  category: IntegrationProviderCategory;
  description: string;
  featured?: boolean;
  permissions: string[];
  scopes: string[];
  kairosActions: KairosIntegrationAction[];
  requiredEnv: string[];
  buildAuthUrl: (input: {
    workspaceId: string;
    userId: string;
    redirectUri: string;
    state: string;
  }) => string;
  exchangeCode: (input: {
    code: string;
    redirectUri: string;
  }) => Promise<OAuthTokenSet>;
  refreshAccessToken?: (input: {
    refreshToken: string;
  }) => Promise<OAuthTokenSet>;
  fetchProfile: (input: {
    accessToken: string;
  }) => Promise<OAuthAccountProfile>;
  isConfigured: () => boolean;
  connectionType?: "oauth" | "api_key";
  connect?: () => Promise<{
    accountName: string;
    externalAccountId: string;
    permissions: string[];
    metadata?: Record<string, unknown>;
  }>;
};

const providers = new Map<string, IntegrationProviderDefinition>();

export function registerIntegrationProvider(
  provider: IntegrationProviderDefinition,
): void {
  providers.set(provider.id, provider);
}

export function getIntegrationProvider(
  id: string,
): IntegrationProviderDefinition | undefined {
  return providers.get(id);
}

export function listIntegrationProviders(): IntegrationProviderDefinition[] {
  return [...providers.values()];
}
