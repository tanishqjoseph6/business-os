import "server-only";

import { z } from "zod";
import { getUser } from "@repo/auth/server";
import {
  getIntegrationAccountByProvider,
  getMembershipRole,
} from "@repo/database";
import {
  logIntegrationActivity,
  markIntegrationSynced,
} from "@repo/database/integrations";
import { resolveActiveWorkspace } from "./workspace-context";
import {
  getGoogleDriveFileMetadata,
  listGoogleDriveFiles,
  listGoogleDriveFolders,
  refreshDriveAccessToken,
} from "./google-drive";

async function requireDriveContext() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  const context = await resolveActiveWorkspace();
  if (!context) throw new Error("No active workspace");
  const role = await getMembershipRole(context.active.workspace.id, user.id);
  if (!role) throw new Error("Forbidden");
  return { userId: user.id, workspaceId: context.active.workspace.id };
}

async function requireDriveAccount(workspaceId: string) {
  const account = await getIntegrationAccountByProvider({
    workspaceId,
    provider: "google-drive",
  });
  if (!account || account.status !== "connected") {
    throw new Error("Connect Google Drive before browsing files");
  }
  return { account, accessToken: await refreshDriveAccessToken(account) };
}

function fail(error: unknown) {
  return {
    ok: false as const,
    error: error instanceof Error ? error.message : "Google Drive action failed",
  };
}

export async function listGoogleDriveFilesAction(input?: unknown) {
  try {
    const context = await requireDriveContext();
    const parsed = z
      .object({
        folderId: z.string().optional(),
        search: z.string().trim().max(200).optional(),
        recent: z.boolean().optional(),
      })
      .safeParse(input ?? {});
    if (!parsed.success) return fail(parsed.error.issues[0]?.message);
    const { accessToken } = await requireDriveAccount(context.workspaceId);
    return {
      ok: true as const,
      data: await listGoogleDriveFiles({
        accessToken,
        ...parsed.data,
      }),
    };
  } catch (error) {
    return fail(error);
  }
}

export async function listGoogleDriveFoldersAction(input?: unknown) {
  try {
    const context = await requireDriveContext();
    const parsed = z
      .object({
        folderId: z.string().optional(),
        search: z.string().trim().max(200).optional(),
      })
      .safeParse(input ?? {});
    if (!parsed.success) return fail(parsed.error.issues[0]?.message);
    const { accessToken } = await requireDriveAccount(context.workspaceId);
    return {
      ok: true as const,
      data: await listGoogleDriveFolders({
        accessToken,
        ...parsed.data,
      }),
    };
  } catch (error) {
    return fail(error);
  }
}

export async function getGoogleDriveFileMetadataAction(input: unknown) {
  try {
    const context = await requireDriveContext();
    const parsed = z.object({ fileId: z.string().min(1) }).safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message);
    const { accessToken } = await requireDriveAccount(context.workspaceId);
    return {
      ok: true as const,
      data: await getGoogleDriveFileMetadata({
        accessToken,
        fileId: parsed.data.fileId,
      }),
    };
  } catch (error) {
    return fail(error);
  }
}

export async function syncGoogleDriveAction() {
  try {
    const context = await requireDriveContext();
    const { account, accessToken } = await requireDriveAccount(
      context.workspaceId,
    );
    const files = await listGoogleDriveFiles({
      accessToken,
      recent: true,
      pageSize: 1000,
    });
    await markIntegrationSynced({
      workspaceId: context.workspaceId,
      accountId: account.id,
    });
    await logIntegrationActivity({
      workspaceId: context.workspaceId,
      accountId: account.id,
      provider: "google-drive",
      eventType: "manual_sync",
      title: "Synced Google Drive",
      body: `${files.length} recent files`,
      actorId: context.userId,
      metadata: { fileCount: files.length },
    });
    return { ok: true as const, data: files };
  } catch (error) {
    return fail(error);
  }
}
