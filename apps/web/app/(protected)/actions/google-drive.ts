"use server";

export async function listGoogleDriveFilesAction(input?: unknown) {
  const mod = await import("../../../lib/google-drive-actions.server");
  return mod.listGoogleDriveFilesAction(input);
}

export async function listGoogleDriveFoldersAction(input?: unknown) {
  const mod = await import("../../../lib/google-drive-actions.server");
  return mod.listGoogleDriveFoldersAction(input);
}

export async function getGoogleDriveFileMetadataAction(input: unknown) {
  const mod = await import("../../../lib/google-drive-actions.server");
  return mod.getGoogleDriveFileMetadataAction(input);
}

export async function syncGoogleDriveAction() {
  const mod = await import("../../../lib/google-drive-actions.server");
  return mod.syncGoogleDriveAction();
}
