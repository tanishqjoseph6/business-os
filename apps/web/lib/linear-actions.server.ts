import "server-only";

import { z } from "zod";
import { getUser } from "@repo/auth/server";
import {
  getIntegrationAccountByProvider,
  logIntegrationActivity,
} from "@repo/database/integrations";
import {
  getDecryptedIntegrationTokens,
  upsertIntegrationTokens as storeIntegrationTokens,
} from "@repo/database/integration-tokens";
import { getIntegrationProvider } from "./integrations-hub/provider";
import { ensureIntegrationProvidersRegistered } from "./integrations-hub/providers";
import { resolveActiveWorkspace } from "./workspace-context";

export type LinearTeam = { id: string; name: string; key: string };
export type LinearProject = {
  id: string;
  name: string;
  state: { name: string } | null;
  url: string | null;
  team: { id: string; name: string } | null;
};
export type LinearIssue = {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  priority: number;
  url: string;
  state: { id: string; name: string; type: string } | null;
  team: { id: string; name: string; key: string } | null;
  project: { id: string; name: string } | null;
  assignee: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

const listInputSchema = z.object({
  teamId: z.string().trim().max(100).optional(),
  search: z.string().trim().max(120).optional(),
});

const createInputSchema = z.object({
  teamId: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(20_000).optional(),
  projectId: z.string().trim().max(100).optional(),
  priority: z.number().int().min(0).max(4).optional(),
});

const updateInputSchema = z.object({
  issueId: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(20_000).nullable().optional(),
  stateId: z.string().trim().max(100).optional(),
  priority: z.number().int().min(0).max(4).optional(),
});

async function requireLinearAccess() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  const context = await resolveActiveWorkspace();
  if (!context) throw new Error("No active workspace");

  ensureIntegrationProvidersRegistered();
  const account = await getIntegrationAccountByProvider({
    workspaceId: context.active.workspace.id,
    provider: "linear",
  });
  if (!account || account.status !== "connected") {
    throw new Error("Connect Linear before using Linear data");
  }

  const tokens = await getDecryptedIntegrationTokens({ accountId: account.id });
  if (!tokens) throw new Error("Linear credentials not found — reconnect Linear");

  let accessToken = tokens.accessToken;
  const provider = getIntegrationProvider("linear");
  if (
    tokens.refreshToken &&
    tokens.expiresAt &&
    new Date(tokens.expiresAt).getTime() <= Date.now() + 60_000
  ) {
    if (!provider?.refreshAccessToken) {
      throw new Error("Linear session expired — reconnect Linear");
    }
    try {
      const refreshed = await provider.refreshAccessToken({
        refreshToken: tokens.refreshToken,
      });
      accessToken = refreshed.accessToken;
      await storeIntegrationTokens({
        workspaceId: context.active.workspace.id,
        accountId: account.id,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken ?? tokens.refreshToken,
        expiresAt: refreshed.expiresAt,
        tokenType: refreshed.tokenType,
      });
    } catch {
      throw new Error("Linear session expired — reconnect Linear");
    }
  }

  return {
    userId: user.id,
    workspaceId: context.active.workspace.id,
    accountId: account.id,
    accessToken,
  };
}

async function linearGraphql<T>(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const payload = (await response.json()) as { data?: T; errors?: Array<{ message?: string }> };
  if (!response.ok || payload.errors?.length || !payload.data) {
    throw new Error(
      `Linear API request failed: ${payload.errors?.[0]?.message ?? response.statusText}`,
    );
  }
  return payload.data;
}

export async function listLinearDataAction(input?: unknown) {
  try {
    const parsed = listInputSchema.safeParse(input ?? {});
    if (!parsed.success) return { ok: false as const, error: "Invalid Linear filters" };
    const ctx = await requireLinearAccess();
    const data = await linearGraphql<{
      teams: { nodes: LinearTeam[] };
      projects: { nodes: LinearProject[] };
      issues: { nodes: LinearIssue[] };
    }>(
      ctx.accessToken,
      `query LinearWorkspaceData {
        teams(first: 50) { nodes { id name key } }
        projects(first: 50) {
          nodes { id name state { name } url team { id name } }
        }
        issues(first: 50, orderBy: updatedAt) {
          nodes {
            id identifier title description priority url createdAt updatedAt
            state { id name type }
            team { id name key }
            project { id name }
            assignee { id name }
          }
        }
      }`,
    );
    const search = parsed.data.search?.toLowerCase();
    const issues = data.issues.nodes.filter((issue) => {
      if (parsed.data.teamId && issue.team?.id !== parsed.data.teamId) return false;
      if (!search) return true;
      return `${issue.identifier} ${issue.title} ${issue.description ?? ""}`
        .toLowerCase()
        .includes(search);
    });
    return {
      ok: true as const,
      data: { teams: data.teams.nodes, projects: data.projects.nodes, issues },
    };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to load Linear data",
    };
  }
}

export async function getLinearIssueAction(issueId: string) {
  try {
    const parsed = z.string().trim().min(1).max(100).safeParse(issueId);
    if (!parsed.success) return { ok: false as const, error: "Invalid Linear issue" };
    const ctx = await requireLinearAccess();
    const data = await linearGraphql<{ issue: LinearIssue | null }>(
      ctx.accessToken,
      `query LinearIssue($id: String!) {
        issue(id: $id) {
          id identifier title description priority url createdAt updatedAt
          state { id name type }
          team { id name key }
          project { id name }
          assignee { id name }
        }
      }`,
      { id: parsed.data },
    );
    if (!data.issue) return { ok: false as const, error: "Linear issue not found" };
    return { ok: true as const, data: data.issue };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to load Linear issue",
    };
  }
}

export async function createLinearIssueAction(input: unknown) {
  try {
    const parsed = createInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, error: "Invalid Linear issue details" };
    const ctx = await requireLinearAccess();
    const data = await linearGraphql<{
      issueCreate: { success: boolean; issue: LinearIssue | null };
    }>(
      ctx.accessToken,
      `mutation CreateLinearIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id identifier title description priority url createdAt updatedAt
            state { id name type }
            team { id name key }
            project { id name }
            assignee { id name }
          }
        }
      }`,
      { input: parsed.data },
    );
    if (!data.issueCreate.success || !data.issueCreate.issue) {
      throw new Error("Linear did not create the issue");
    }
    await logIntegrationActivity({
      workspaceId: ctx.workspaceId,
      accountId: ctx.accountId,
      provider: "linear",
      eventType: "manual_sync",
      title: `Created Linear issue ${data.issueCreate.issue.identifier}`,
      actorId: ctx.userId,
    });
    return { ok: true as const, data: data.issueCreate.issue };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to create Linear issue",
    };
  }
}

export async function updateLinearIssueAction(input: unknown) {
  try {
    const parsed = updateInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, error: "Invalid Linear issue details" };
    const { issueId, ...issueInput } = parsed.data;
    const ctx = await requireLinearAccess();
    const data = await linearGraphql<{
      issueUpdate: { success: boolean; issue: LinearIssue | null };
    }>(
      ctx.accessToken,
      `mutation UpdateLinearIssue($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          success
          issue {
            id identifier title description priority url createdAt updatedAt
            state { id name type }
            team { id name key }
            project { id name }
            assignee { id name }
          }
        }
      }`,
      { id: issueId, input: issueInput },
    );
    if (!data.issueUpdate.success || !data.issueUpdate.issue) {
      throw new Error("Linear did not update the issue");
    }
    return { ok: true as const, data: data.issueUpdate.issue };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unable to update Linear issue",
    };
  }
}
