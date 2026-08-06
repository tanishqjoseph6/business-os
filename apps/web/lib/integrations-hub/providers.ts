import "server-only";

import {
  registerIntegrationProvider,
  type IntegrationProviderDefinition,
  type OAuthAccountProfile,
  type OAuthTokenSet,
} from "./provider";

function env(...keys: string[]): boolean {
  return keys.every((key) => Boolean(process.env[key]?.trim()));
}

function expiresIn(seconds: number | undefined): string | null {
  if (!seconds) return null;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

async function googleExchange(input: {
  code: string;
  redirectUri: string;
  scopes: string[];
}): Promise<OAuthTokenSet> {
  const clientId = process.env.GOOGLE_CLIENT_ID!.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!.trim();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${await response.text()}`);
  }
  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: expiresIn(data.expires_in),
    scopes: data.scope?.split(" ") ?? input.scopes,
    tokenType: data.token_type ?? "Bearer",
  };
}

async function googleRefresh(refreshToken: string): Promise<OAuthTokenSet> {
  const clientId = process.env.GOOGLE_CLIENT_ID!.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!.trim();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    throw new Error(`Google token refresh failed: ${await response.text()}`);
  }
  const data = (await response.json()) as {
    access_token: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
  };
  return {
    accessToken: data.access_token,
    refreshToken,
    expiresAt: expiresIn(data.expires_in),
    scopes: data.scope?.split(" ") ?? [],
    tokenType: data.token_type ?? "Bearer",
  };
}

async function googleProfile(accessToken: string) {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) throw new Error("Failed to load Google profile");
  const data = (await response.json()) as {
    id: string;
    email?: string;
    name?: string;
  };
  return {
    email: data.email ?? null,
    name: data.name ?? null,
    externalAccountId: data.id,
  };
}

function googleAuthUrl(input: {
  redirectUri: string;
  state: string;
  scopes: string[];
}): string {
  const clientId = process.env.GOOGLE_CLIENT_ID!.trim();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: input.redirectUri,
    response_type: "code",
    scope: input.scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: input.state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function defineStubProvider(
  partial: Omit<
    IntegrationProviderDefinition,
    | "buildAuthUrl"
    | "exchangeCode"
    | "fetchProfile"
    | "isConfigured"
    | "requiredEnv"
  > & {
    authBaseUrl: string;
    tokenUrl: string;
    profileUrl?: string;
    clientIdEnv: string;
    clientSecretEnv: string;
  },
): IntegrationProviderDefinition {
  return {
    id: partial.id,
    name: partial.name,
    category: partial.category,
    description: partial.description,
    featured: partial.featured,
    permissions: partial.permissions,
    scopes: partial.scopes,
    kairosActions: partial.kairosActions,
    requiredEnv: [partial.clientIdEnv, partial.clientSecretEnv],
    isConfigured: () => env(partial.clientIdEnv, partial.clientSecretEnv),
    buildAuthUrl: ({ redirectUri, state }) => {
      const clientId = process.env[partial.clientIdEnv]!.trim();
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: partial.scopes.join(" "),
        state,
      });
      return `${partial.authBaseUrl}?${params.toString()}`;
    },
    exchangeCode: async ({ code, redirectUri }) => {
      const clientId = process.env[partial.clientIdEnv]!.trim();
      const clientSecret = process.env[partial.clientSecretEnv]!.trim();
      const response = await fetch(partial.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      if (!response.ok) {
        throw new Error(
          `${partial.name} token exchange failed: ${await response.text()}`,
        );
      }
      const data = (await response.json()) as {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
        token_type?: string;
        scope?: string;
      };
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        expiresAt: expiresIn(data.expires_in),
        scopes: data.scope?.split(/[,\s]+/).filter(Boolean) ?? partial.scopes,
        tokenType: data.token_type ?? "Bearer",
      };
    },
    fetchProfile: async ({ accessToken }) => {
      if (!partial.profileUrl) {
        return {
          email: null,
          name: partial.name,
          externalAccountId: `${partial.id}-${Date.now()}`,
        };
      }
      const response = await fetch(partial.profileUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        return {
          email: null,
          name: partial.name,
          externalAccountId: `${partial.id}-unknown`,
        };
      }
      const data = (await response.json()) as Record<string, unknown>;
      const email =
        (typeof data.email === "string" && data.email) ||
        (typeof data.mail === "string" && data.mail) ||
        null;
      const name =
        (typeof data.name === "string" && data.name) ||
        (typeof data.login === "string" && data.login) ||
        partial.name;
      const id =
        (typeof data.id === "string" && data.id) ||
        (typeof data.id === "number" && String(data.id)) ||
        `${partial.id}-${Date.now()}`;
      return { email, name, externalAccountId: id };
    },
  };
}

function defineApiKeyProvider(
  input: Omit<IntegrationProviderDefinition, "buildAuthUrl" | "exchangeCode" | "fetchProfile" | "isConfigured" | "requiredEnv"> & {
    requiredEnv: string[];
    isConfigured: () => boolean;
  },
): IntegrationProviderDefinition {
  return {
    ...input,
    connectionType: "api_key",
    requiredEnv: input.requiredEnv,
    isConfigured: input.isConfigured,
    buildAuthUrl: () => {
      throw new Error(`${input.name} uses a server-side API key, not OAuth`);
    },
    exchangeCode: async () => {
      throw new Error(`${input.name} uses a server-side API key, not OAuth`);
    },
    fetchProfile: async () => {
      throw new Error(`${input.name} uses a server-side API key, not OAuth`);
    },
  };
}

function defineGoogleProvider(input: {
  id: IntegrationProviderDefinition["id"];
  name: string;
  description: string;
  featured?: boolean;
  scopes: string[];
  permissions: string[];
  kairosActions: IntegrationProviderDefinition["kairosActions"];
}): IntegrationProviderDefinition {
  return {
    id: input.id,
    name: input.name,
    category: "google",
    description: input.description,
    featured: input.featured,
    permissions: input.permissions,
    scopes: input.scopes,
    kairosActions: input.kairosActions,
    requiredEnv: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    isConfigured: () => env("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"),
    buildAuthUrl: ({ redirectUri, state }) =>
      googleAuthUrl({ redirectUri, state, scopes: input.scopes }),
    exchangeCode: ({ code, redirectUri }) =>
      googleExchange({ code, redirectUri, scopes: input.scopes }),
    refreshAccessToken: ({ refreshToken }) => googleRefresh(refreshToken),
    fetchProfile: ({ accessToken }) => googleProfile(accessToken),
  };
}

async function slackExchange(input: { code: string; redirectUri: string }): Promise<OAuthTokenSet> {
  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: process.env.SLACK_CLIENT_ID!.trim(),
      client_secret: process.env.SLACK_CLIENT_SECRET!.trim(),
      redirect_uri: input.redirectUri,
    }),
  });
  const data = (await response.json()) as {
    ok?: boolean;
    error?: string;
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    team?: { id?: string; name?: string };
    authed_user?: { id?: string };
  };
  if (!response.ok || !data.ok || !data.access_token) {
    throw new Error(`Slack token exchange failed: ${data.error ?? response.statusText}`);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: expiresIn(data.expires_in),
    scopes: ["channels:read", "chat:write", "users:read"],
    tokenType: data.token_type ?? "Bearer",
    metadata: {
      workspaceId: data.team?.id ?? null,
      workspaceName: data.team?.name ?? null,
      userId: data.authed_user?.id ?? null,
    },
  };
}

async function slackRefresh(refreshToken: string): Promise<OAuthTokenSet> {
  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.SLACK_CLIENT_ID!.trim(),
      client_secret: process.env.SLACK_CLIENT_SECRET!.trim(),
    }),
  });
  const data = (await response.json()) as {
    ok?: boolean;
    error?: string;
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
  };
  if (!response.ok || !data.ok || !data.access_token) {
    throw new Error(`Slack token refresh failed: ${data.error ?? response.statusText}`);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: expiresIn(data.expires_in),
    scopes: ["channels:read", "chat:write", "users:read"],
    tokenType: data.token_type ?? "Bearer",
  };
}

async function slackProfile(accessToken: string): Promise<OAuthAccountProfile> {
  const response = await fetch("https://slack.com/api/auth.test", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data = (await response.json()) as {
    ok?: boolean;
    error?: string;
    user_id?: string;
    user?: string;
    team_id?: string;
    team?: string;
  };
  if (!response.ok || !data.ok) {
    throw new Error(`Slack profile lookup failed: ${data.error ?? response.statusText}`);
  }
  return {
    email: null,
    name: data.team ?? data.user ?? "Slack workspace",
    externalAccountId: data.team_id ?? data.user_id ?? "slack-workspace",
  };
}

async function notionExchange(input: { code: string; redirectUri: string }): Promise<OAuthTokenSet> {
  const clientId = process.env.NOTION_CLIENT_ID!.trim();
  const clientSecret = process.env.NOTION_CLIENT_SECRET!.trim();
  const redirectUri =
    process.env.NOTION_REDIRECT_URI?.trim() || input.redirectUri;
  const response = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: redirectUri,
    }),
  });
  const data = (await response.json()) as {
    access_token?: string;
    bot_id?: string;
    workspace_id?: string;
    workspace_name?: string;
    owner?: { user?: { id?: string; name?: string; person?: { email?: string } } };
    error?: string;
  };
  if (!response.ok || !data.access_token) {
    throw new Error(`Notion token exchange failed: ${data.error ?? response.statusText}`);
  }
  return {
    accessToken: data.access_token,
    refreshToken: null,
    expiresAt: null,
    scopes: [],
    tokenType: "Bearer",
    metadata: {
      workspaceId: data.workspace_id ?? null,
      workspaceName: data.workspace_name ?? null,
      botId: data.bot_id ?? null,
      ownerId: data.owner?.user?.id ?? null,
    },
  };
}

async function notionProfile(accessToken: string): Promise<OAuthAccountProfile> {
  const response = await fetch("https://api.notion.com/v1/users/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Notion-Version": "2022-06-28",
    },
    cache: "no-store",
  });
  const data = (await response.json()) as {
    id?: string;
    name?: string | null;
    person?: { email?: string };
  };
  if (!response.ok || !data.id) {
    throw new Error(`Notion profile lookup failed (${response.status})`);
  }
  return {
    email: data.person?.email ?? null,
    name: data.name ?? "Notion workspace",
    externalAccountId: data.id,
  };
}

const LAUNCH_PROVIDERS: IntegrationProviderDefinition[] = [
  defineApiKeyProvider({
    id: "openai",
    name: "OpenAI",
    category: "ai",
    description: "Connect OpenAI models to power Kairos workflows.",
    featured: true,
    permissions: ["Chat Completions", "Responses API", "Embeddings", "Image Generation"],
    scopes: [],
    kairosActions: [
      { name: "chat_completions", description: "Run chat completions", examplePrompt: "Ask OpenAI to draft a response." },
      { name: "responses_api", description: "Run Responses API requests", examplePrompt: "Use OpenAI Responses for this task." },
      { name: "embeddings", description: "Create embeddings", examplePrompt: "Create an embedding for this document." },
      { name: "image_generation", description: "Generate images", examplePrompt: "Generate a product image." },
    ],
    requiredEnv: ["OPENAI_API_KEY"],
    isConfigured: () => Boolean(process.env.OPENAI_API_KEY?.trim()),
    connect: async () => {
      const response = await fetch(`${process.env.OPENAI_BASE_URL?.replace(/\/$/, "") || "https://api.openai.com/v1"}/models`, {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY!.trim()}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`OpenAI connection failed (${response.status})`);
      return {
        accountName: "OpenAI API",
        externalAccountId: "openai-api",
        permissions: ["Chat Completions", "Responses API", "Embeddings", "Image Generation"],
        metadata: { connectionType: "api_key", verifiedAt: new Date().toISOString() },
      };
    },
  }),
  defineApiKeyProvider({
    id: "anthropic",
    name: "Anthropic",
    category: "ai",
    description: "Connect Claude models to power Kairos workflows.",
    featured: true,
    permissions: ["Claude API", "Messages API", "Tool Use", "Long Context"],
    scopes: [],
    kairosActions: [
      { name: "claude_api", description: "Run Claude API requests", examplePrompt: "Ask Claude to analyze this." },
      { name: "messages_api", description: "Run Messages API requests", examplePrompt: "Use the Messages API." },
      { name: "tool_use", description: "Run Claude tool use", examplePrompt: "Let Claude call this tool." },
      { name: "long_context", description: "Process long-context prompts", examplePrompt: "Analyze this long document with Claude." },
    ],
    requiredEnv: ["ANTHROPIC_API_KEY"],
    isConfigured: () => Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    connect: async () => {
      const response = await fetch("https://api.anthropic.com/v1/models", {
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY!.trim(),
          "anthropic-version": "2023-06-01",
        },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Anthropic connection failed (${response.status})`);
      return {
        accountName: "Anthropic API",
        externalAccountId: "anthropic-api",
        permissions: ["Claude API", "Messages API", "Tool Use", "Long Context"],
        metadata: { connectionType: "api_key", verifiedAt: new Date().toISOString() },
      };
    },
  }),
  defineApiKeyProvider({
    id: "vercel",
    name: "Vercel",
    category: "development",
    description: "Manage deployments, domains, environments, and logs.",
    featured: true,
    permissions: ["Deployments", "Domains", "Environment Variables", "Logs"],
    scopes: [],
    kairosActions: [
      { name: "deployments", description: "Manage deployments", examplePrompt: "Show recent Vercel deployments." },
      { name: "domains", description: "Manage domains", examplePrompt: "List Vercel domains." },
      { name: "environment_variables", description: "Manage environment variables", examplePrompt: "Show environment variables." },
      { name: "logs", description: "Read deployment logs", examplePrompt: "Show the latest deployment logs." },
    ],
    requiredEnv: ["VERCEL_API_TOKEN"],
    isConfigured: () => Boolean(process.env.VERCEL_API_TOKEN?.trim()),
    connect: async () => {
      const response = await fetch("https://api.vercel.com/v9/projects?limit=1", {
        headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN!.trim()}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Vercel connection failed (${response.status})`);
      return {
        accountName: "Vercel account",
        externalAccountId: "vercel-api",
        permissions: ["Deployments", "Domains", "Environment Variables", "Logs"],
        metadata: { connectionType: "api_key", verifiedAt: new Date().toISOString() },
      };
    },
  }),
  defineApiKeyProvider({
    id: "supabase",
    name: "Supabase",
    category: "development",
    description: "Connect database, authentication, storage, and edge services.",
    featured: true,
    permissions: ["Database", "Authentication", "Storage", "Edge Functions"],
    scopes: [],
    kairosActions: [
      { name: "database", description: "Access database resources", examplePrompt: "Inspect the Supabase database." },
      { name: "authentication", description: "Manage authentication", examplePrompt: "Review Supabase auth users." },
      { name: "storage", description: "Manage storage", examplePrompt: "List Supabase storage buckets." },
      { name: "edge_functions", description: "Manage edge functions", examplePrompt: "List Supabase edge functions." },
    ],
    requiredEnv: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    isConfigured: () =>
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    connect: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();
      const response = await fetch(`${baseUrl}/rest/v1/`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Supabase connection failed (${response.status})`);
      return {
        accountName: "Supabase project",
        externalAccountId: new URL(baseUrl).hostname,
        permissions: ["Database", "Authentication", "Storage", "Edge Functions"],
        metadata: { connectionType: "api_key", verifiedAt: new Date().toISOString() },
      };
    },
  }),
  defineGoogleProvider({
    id: "gmail",
    name: "Gmail",
    description: "Sync and automate email with Kairos.",
    featured: true,
    scopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.send",
      "email",
      "profile",
    ],
    permissions: ["Read email", "Send email", "Modify labels"],
    kairosActions: [
      {
        name: "read_emails",
        description: "Read recent Gmail messages",
        examplePrompt: "Summarize today's Gmail.",
      },
      {
        name: "search_emails",
        description: "Search Gmail threads",
        examplePrompt: "Find emails from Acme this week.",
      },
      {
        name: "draft_reply",
        description: "Draft a reply",
        examplePrompt: "Draft a follow-up reply.",
      },
      {
        name: "send_email",
        description: "Send an email",
        examplePrompt: "Send this draft to the customer.",
      },
    ],
  }),
  defineGoogleProvider({
    id: "google-drive",
    name: "Google Drive",
    description: "Upload, search, and organize Drive files.",
    featured: true,
    scopes: [
      "https://www.googleapis.com/auth/drive.file",
      "email",
      "profile",
    ],
    permissions: ["Upload files", "Search files", "Create folders"],
    kairosActions: [
      {
        name: "upload_file",
        description: "Upload a file to Drive",
        examplePrompt: "Upload this file to Google Drive.",
      },
      {
        name: "search_files",
        description: "Search Drive files",
        examplePrompt: "Find the Q3 proposal in Drive.",
      },
      {
        name: "create_folder",
        description: "Create a Drive folder",
        examplePrompt: "Create a folder for this client.",
      },
    ],
  }),
  defineGoogleProvider({
    id: "google-calendar",
    name: "Google Calendar",
    description: "Schedule meetings and find availability.",
    featured: true,
    scopes: [
      "https://www.googleapis.com/auth/calendar.events",
      "email",
      "profile",
    ],
    permissions: ["Create events", "Update events", "Read availability"],
    kairosActions: [
      {
        name: "create_meeting",
        description: "Create a calendar meeting",
        examplePrompt: "Schedule tomorrow's meeting.",
      },
      {
        name: "cancel_meeting",
        description: "Cancel a meeting",
        examplePrompt: "Cancel the 3pm sync.",
      },
      {
        name: "find_availability",
        description: "Find free slots",
        examplePrompt: "When am I free Thursday afternoon?",
      },
    ],
  }),
  defineGoogleProvider({
    id: "google-docs",
    name: "Google Docs",
    description: "Create and update Docs with AI assistance.",
    scopes: [
      "https://www.googleapis.com/auth/documents",
      "email",
      "profile",
    ],
    permissions: ["Create documents", "Read documents"],
    kairosActions: [
      {
        name: "create_doc",
        description: "Create a Google Doc",
        examplePrompt: "Create a meeting notes doc.",
      },
      {
        name: "search_docs",
        description: "Search Docs",
        examplePrompt: "Find the onboarding doc.",
      },
    ],
  }),
  defineStubProvider({
    id: "outlook",
    name: "Outlook",
    category: "microsoft",
    description: "Connect Outlook mail and calendar.",
    featured: true,
    permissions: ["Read mail", "Send mail", "Manage calendar"],
    scopes: ["openid", "profile", "email", "Mail.ReadWrite", "Calendars.ReadWrite", "offline_access"],
    kairosActions: [
      {
        name: "read_emails",
        description: "Read Outlook mail",
        examplePrompt: "Summarize my Outlook inbox.",
      },
      {
        name: "send_email",
        description: "Send Outlook mail",
        examplePrompt: "Send this via Outlook.",
      },
      {
        name: "create_meeting",
        description: "Create Outlook meeting",
        examplePrompt: "Book a meeting in Outlook.",
      },
    ],
    authBaseUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    profileUrl: "https://graph.microsoft.com/v1.0/me",
    clientIdEnv: "MICROSOFT_CLIENT_ID",
    clientSecretEnv: "MICROSOFT_CLIENT_SECRET",
  }),
  defineStubProvider({
    id: "onedrive",
    name: "OneDrive",
    category: "microsoft",
    description: "Access and sync OneDrive files.",
    permissions: ["Read files", "Upload files"],
    scopes: ["openid", "Files.ReadWrite", "offline_access"],
    kairosActions: [
      {
        name: "upload_file",
        description: "Upload to OneDrive",
        examplePrompt: "Save this to OneDrive.",
      },
      {
        name: "search_files",
        description: "Search OneDrive",
        examplePrompt: "Find the contract in OneDrive.",
      },
    ],
    authBaseUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    profileUrl: "https://graph.microsoft.com/v1.0/me",
    clientIdEnv: "MICROSOFT_CLIENT_ID",
    clientSecretEnv: "MICROSOFT_CLIENT_SECRET",
  }),
  {
    id: "slack",
    name: "Slack",
    category: "communication",
    description: "Post messages and read channels.",
    featured: true,
    permissions: ["Send messages", "Read channels"],
    scopes: ["channels:read", "chat:write", "users:read"],
    kairosActions: [
      {
        name: "send_message",
        description: "Send a Slack message",
        examplePrompt: "Post this to Slack.",
      },
      {
        name: "read_channels",
        description: "List Slack channels",
        examplePrompt: "Which Slack channels do we have?",
      },
    ],
    requiredEnv: ["SLACK_CLIENT_ID", "SLACK_CLIENT_SECRET"],
    isConfigured: () => env("SLACK_CLIENT_ID", "SLACK_CLIENT_SECRET"),
    buildAuthUrl: ({ redirectUri, state }) => {
      const params = new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!.trim(),
        redirect_uri: redirectUri,
        scope: "channels:read,chat:write,users:read",
        state,
      });
      return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
    },
    exchangeCode: slackExchange,
    refreshAccessToken: ({ refreshToken }) => slackRefresh(refreshToken),
    fetchProfile: ({ accessToken }) => slackProfile(accessToken),
  },
  defineStubProvider({
    id: "discord",
    name: "Discord",
    category: "communication",
    description: "Send community alerts and updates.",
    permissions: ["Send messages"],
    scopes: ["identify", "guilds", "bot"],
    kairosActions: [
      {
        name: "send_message",
        description: "Send a Discord message",
        examplePrompt: "Post an update in Discord.",
      },
    ],
    authBaseUrl: "https://discord.com/api/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    profileUrl: "https://discord.com/api/users/@me",
    clientIdEnv: "DISCORD_CLIENT_ID",
    clientSecretEnv: "DISCORD_CLIENT_SECRET",
  }),
  defineStubProvider({
    id: "zoom",
    name: "Zoom",
    category: "communication",
    description: "Create and manage Zoom meetings.",
    permissions: ["Create meetings"],
    scopes: ["meeting:write", "user:read"],
    kairosActions: [
      {
        name: "create_meeting",
        description: "Create a Zoom meeting",
        examplePrompt: "Create a Zoom call for tomorrow.",
      },
    ],
    authBaseUrl: "https://zoom.us/oauth/authorize",
    tokenUrl: "https://zoom.us/oauth/token",
    profileUrl: "https://api.zoom.us/v2/users/me",
    clientIdEnv: "ZOOM_CLIENT_ID",
    clientSecretEnv: "ZOOM_CLIENT_SECRET",
  }),
  {
    id: "notion",
    name: "Notion",
    category: "productivity",
    description: "Create pages and search your workspace notes.",
    featured: true,
    permissions: ["Read pages", "Read databases", "Create pages", "Update pages"],
    scopes: [],
    kairosActions: [
      {
        name: "create_page",
        description: "Create a Notion page",
        examplePrompt: "Create a Notion page for this deal.",
      },
      {
        name: "search_notes",
        description: "Search Notion",
        examplePrompt: "Search Notion for onboarding notes.",
      },
    ],
    requiredEnv: ["NOTION_CLIENT_ID", "NOTION_CLIENT_SECRET", "NOTION_REDIRECT_URI"],
    isConfigured: () =>
      env("NOTION_CLIENT_ID", "NOTION_CLIENT_SECRET", "NOTION_REDIRECT_URI"),
    buildAuthUrl: ({ redirectUri, state }) => {
      const configuredRedirectUri =
        process.env.NOTION_REDIRECT_URI?.trim() || redirectUri;
      const params = new URLSearchParams({
        client_id: process.env.NOTION_CLIENT_ID!.trim(),
        redirect_uri: configuredRedirectUri,
        response_type: "code",
        owner: "user",
        state,
      });
      return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
    },
    exchangeCode: notionExchange,
    fetchProfile: ({ accessToken }) => notionProfile(accessToken),
  },
  defineStubProvider({
    id: "trello",
    name: "Trello",
    category: "productivity",
    description: "Manage boards and cards.",
    permissions: ["Create cards", "List boards"],
    scopes: ["read", "write"],
    kairosActions: [
      {
        name: "create_card",
        description: "Create a Trello card",
        examplePrompt: "Add a Trello card for follow-up.",
      },
      {
        name: "list_boards",
        description: "List Trello boards",
        examplePrompt: "Show my Trello boards.",
      },
    ],
    authBaseUrl: "https://trello.com/1/authorize",
    tokenUrl: "https://trello.com/1/OAuthGetAccessToken",
    clientIdEnv: "TRELLO_CLIENT_ID",
    clientSecretEnv: "TRELLO_CLIENT_SECRET",
  }),
  defineStubProvider({
    id: "clickup",
    name: "ClickUp",
    category: "productivity",
    description: "Create tasks and track projects.",
    permissions: ["Create tasks", "List tasks"],
    scopes: [],
    kairosActions: [
      {
        name: "create_task",
        description: "Create a ClickUp task",
        examplePrompt: "Create a ClickUp task for onboarding.",
      },
      {
        name: "list_tasks",
        description: "List ClickUp tasks",
        examplePrompt: "What's open in ClickUp?",
      },
    ],
    authBaseUrl: "https://app.clickup.com/api",
    tokenUrl: "https://api.clickup.com/api/v2/oauth/token",
    clientIdEnv: "CLICKUP_CLIENT_ID",
    clientSecretEnv: "CLICKUP_CLIENT_SECRET",
  }),
  defineStubProvider({
    id: "asana",
    name: "Asana",
    category: "productivity",
    description: "Coordinate team workflows and tasks.",
    permissions: ["Create tasks", "List projects"],
    scopes: ["default"],
    kairosActions: [
      {
        name: "create_task",
        description: "Create an Asana task",
        examplePrompt: "Create an Asana task for design review.",
      },
      {
        name: "list_projects",
        description: "List Asana projects",
        examplePrompt: "List Asana projects.",
      },
    ],
    authBaseUrl: "https://app.asana.com/-/oauth_authorize",
    tokenUrl: "https://app.asana.com/-/oauth_token",
    profileUrl: "https://app.asana.com/api/1.0/users/me",
    clientIdEnv: "ASANA_CLIENT_ID",
    clientSecretEnv: "ASANA_CLIENT_SECRET",
  }),
  defineStubProvider({
    id: "github",
    name: "GitHub",
    category: "development",
    description: "Issues, PRs, and repository access.",
    featured: true,
    permissions: ["Create issues", "Create PRs", "Read repositories"],
    scopes: ["repo", "read:user", "user:email"],
    kairosActions: [
      {
        name: "create_issue",
        description: "Create a GitHub issue",
        examplePrompt: "Create a GitHub issue.",
      },
      {
        name: "create_pr",
        description: "Create a pull request",
        examplePrompt: "Open a PR for the integrations branch.",
      },
      {
        name: "read_repositories",
        description: "List repositories",
        examplePrompt: "List my GitHub repos.",
      },
    ],
    authBaseUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    profileUrl: "https://api.github.com/user",
    clientIdEnv: "GITHUB_CLIENT_ID",
    clientSecretEnv: "GITHUB_CLIENT_SECRET",
  }),
  defineStubProvider({
    id: "gitlab",
    name: "GitLab",
    category: "development",
    description: "Merge requests and DevOps pipelines.",
    permissions: ["Create issues", "Read repositories"],
    scopes: ["api", "read_user"],
    kairosActions: [
      {
        name: "create_issue",
        description: "Create a GitLab issue",
        examplePrompt: "Create a GitLab issue for the bug.",
      },
      {
        name: "read_repositories",
        description: "List GitLab projects",
        examplePrompt: "Show GitLab projects.",
      },
    ],
    authBaseUrl: "https://gitlab.com/oauth/authorize",
    tokenUrl: "https://gitlab.com/oauth/token",
    profileUrl: "https://gitlab.com/api/v4/user",
    clientIdEnv: "GITLAB_CLIENT_ID",
    clientSecretEnv: "GITLAB_CLIENT_SECRET",
  }),
  defineStubProvider({
    id: "stripe",
    name: "Stripe",
    category: "finance",
    description: "Payments, customers, and invoices.",
    featured: true,
    permissions: ["List payments", "View customers"],
    scopes: ["read_write"],
    kairosActions: [
      {
        name: "list_payments",
        description: "List Stripe payments",
        examplePrompt: "Show recent Stripe payments.",
      },
      {
        name: "view_customers",
        description: "View Stripe customers",
        examplePrompt: "Find Stripe customer Acme.",
      },
    ],
    authBaseUrl: "https://connect.stripe.com/oauth/authorize",
    tokenUrl: "https://connect.stripe.com/oauth/token",
    clientIdEnv: "STRIPE_CLIENT_ID",
    clientSecretEnv: "STRIPE_SECRET_KEY",
  }),
  defineStubProvider({
    id: "paypal",
    name: "PayPal",
    category: "finance",
    description: "View PayPal transactions and payouts.",
    permissions: ["List payments"],
    scopes: ["openid", "email"],
    kairosActions: [
      {
        name: "list_payments",
        description: "List PayPal payments",
        examplePrompt: "Show PayPal transactions.",
      },
    ],
    authBaseUrl: "https://www.paypal.com/signin/authorize",
    tokenUrl: "https://api-m.paypal.com/v1/oauth2/token",
    clientIdEnv: "PAYPAL_CLIENT_ID",
    clientSecretEnv: "PAYPAL_CLIENT_SECRET",
  }),
  defineStubProvider({
    id: "dropbox",
    name: "Dropbox",
    category: "storage",
    description: "Sync and share Dropbox files.",
    permissions: ["Upload files", "Search files"],
    scopes: [],
    kairosActions: [
      {
        name: "upload_file",
        description: "Upload to Dropbox",
        examplePrompt: "Upload this to Dropbox.",
      },
      {
        name: "search_files",
        description: "Search Dropbox",
        examplePrompt: "Find the proposal in Dropbox.",
      },
    ],
    authBaseUrl: "https://www.dropbox.com/oauth2/authorize",
    tokenUrl: "https://api.dropboxapi.com/oauth2/token",
    clientIdEnv: "DROPBOX_CLIENT_ID",
    clientSecretEnv: "DROPBOX_CLIENT_SECRET",
  }),
];

let registered = false;

export function ensureIntegrationProvidersRegistered(): IntegrationProviderDefinition[] {
  if (!registered) {
    for (const provider of LAUNCH_PROVIDERS) {
      registerIntegrationProvider(provider);
    }
    registered = true;
  }
  return LAUNCH_PROVIDERS;
}

export function getLaunchProviders(): IntegrationProviderDefinition[] {
  return ensureIntegrationProvidersRegistered();
}
