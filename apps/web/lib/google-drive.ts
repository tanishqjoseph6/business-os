import "server-only";

import {
  getDecryptedIntegrationTokens,
  upsertIntegrationTokens,
} from "@repo/database/integration-tokens";
import type { IntegrationAccount } from "@repo/types";
import { refreshGoogleOAuthToken } from "@repo/ai";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
export const GOOGLE_DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";

export type GoogleDriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
  createdTime: string | null;
  size: string | null;
  webViewLink: string | null;
  iconLink: string | null;
  description: string | null;
  parents: string[];
  owners: Array<{ displayName?: string; emailAddress?: string }>;
  starred: boolean;
  trashed: boolean;
};

async function driveFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${DRIVE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as T & {
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(
      `Google Drive request failed: ${data.error?.message ?? response.statusText}`,
    );
  }
  return data;
}

export async function refreshDriveAccessToken(account: IntegrationAccount) {
  const tokens = await getDecryptedIntegrationTokens({ accountId: account.id });
  if (!tokens) throw new Error("Google Drive tokens were not found");
  if (
    tokens.expiresAt &&
    new Date(tokens.expiresAt).getTime() > Date.now() + 60_000
  ) {
    return tokens.accessToken;
  }
  if (!tokens.refreshToken) {
    throw new Error("Google Drive has expired. Please reconnect it.");
  }
  const refreshed = await refreshGoogleOAuthToken(tokens.refreshToken);
  await upsertIntegrationTokens({
    workspaceId: account.workspaceId,
    accountId: account.id,
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    expiresAt: refreshed.expiresAt,
    tokenType: refreshed.tokenType,
  });
  return refreshed.accessToken;
}

function mapFile(file: Partial<GoogleDriveFile> & { id: string; name: string; mimeType: string }): GoogleDriveFile {
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    modifiedTime: file.modifiedTime ?? null,
    createdTime: file.createdTime ?? null,
    size: file.size ?? null,
    webViewLink: file.webViewLink ?? null,
    iconLink: file.iconLink ?? null,
    description: file.description ?? null,
    parents: file.parents ?? [],
    owners: file.owners ?? [],
    starred: file.starred ?? false,
    trashed: file.trashed ?? false,
  };
}

export async function listGoogleDriveFiles(input: {
  accessToken: string;
  folderId?: string;
  search?: string;
  recent?: boolean;
  pageSize?: number;
}): Promise<GoogleDriveFile[]> {
  const files: GoogleDriveFile[] = [];
  let pageToken: string | undefined;
  do {
    const clauses = ["trashed = false"];
    if (input.folderId) {
      clauses.push(`'${input.folderId.replaceAll("'", "\\'")}' in parents`);
    }
    if (input.search?.trim()) {
      const escaped = input.search.trim().replaceAll("'", "\\'");
      clauses.push(`name contains '${escaped}'`);
    }
    const query = new URLSearchParams({
      q: clauses.join(" and "),
      pageSize: String(input.pageSize ?? 100),
      orderBy: input.recent ? "modifiedTime desc" : "folder,name",
      spaces: "drive",
      fields:
        "nextPageToken,files(id,name,mimeType,modifiedTime,createdTime,size,webViewLink,iconLink,description,parents,owners(displayName,emailAddress),starred,trashed)",
    });
    if (pageToken) query.set("pageToken", pageToken);
    const data = await driveFetch<{
      files?: Array<Partial<GoogleDriveFile> & { id: string; name: string; mimeType: string }>;
      nextPageToken?: string;
    }>(input.accessToken, `/files?${query}`);
    files.push(...(data.files ?? []).map(mapFile));
    pageToken = data.nextPageToken;
  } while (pageToken && files.length < 1000);
  return files;
}

export async function getGoogleDriveFileMetadata(input: {
  accessToken: string;
  fileId: string;
}) {
  const query = new URLSearchParams({
    fields:
      "id,name,mimeType,modifiedTime,createdTime,size,webViewLink,iconLink,description,parents,owners(displayName,emailAddress),starred,trashed",
  });
  const file = await driveFetch<
    Partial<GoogleDriveFile> & { id: string; name: string; mimeType: string }
  >(input.accessToken, `/files/${encodeURIComponent(input.fileId)}?${query}`);
  return mapFile(file);
}

export async function listGoogleDriveFolders(input: {
  accessToken: string;
  folderId?: string;
  search?: string;
}) {
  const files = await listGoogleDriveFiles(input);
  return files.filter((file) => file.mimeType === GOOGLE_DRIVE_FOLDER_MIME);
}
