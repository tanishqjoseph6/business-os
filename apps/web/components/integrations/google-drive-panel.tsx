"use client";

import { useEffect, useState, useTransition } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import {
  getGoogleDriveFileMetadataAction,
  listGoogleDriveFilesAction,
  syncGoogleDriveAction,
} from "../../app/(protected)/actions/google-drive";

type DriveFile = {
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
  starred: boolean;
};

const FOLDER_MIME = "application/vnd.google-apps.folder";

function fileKind(file: DriveFile) {
  if (file.mimeType === FOLDER_MIME) return "Folder";
  if (file.mimeType.includes("document")) return "Google Doc";
  if (file.mimeType.includes("spreadsheet")) return "Google Sheet";
  if (file.mimeType.includes("presentation")) return "Google Slide";
  if (file.mimeType === "application/pdf") return "PDF";
  return file.mimeType.split("/").pop()?.toUpperCase() ?? "File";
}

export function GoogleDrivePanel() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folderId, setFolderId] = useState<string | undefined>();
  const [folderStack, setFolderStack] = useState<Array<{ id: string; name: string }>>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DriveFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function load(options?: {
    recent?: boolean;
    folder?: string | undefined;
    search?: string;
  }) {
    setError(null);
    startTransition(async () => {
      const targetFolder =
        options && Object.prototype.hasOwnProperty.call(options, "folder")
          ? options.folder
          : folderId;
      const result = await listGoogleDriveFilesAction({
        folderId: targetFolder,
        search: options?.search ?? search,
        recent: options?.recent,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setFiles(result.data);
    });
  }

  useEffect(() => {
    load({ recent: true });
    // Initial load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openFolder(file: DriveFile) {
    setFolderId(file.id);
    setFolderStack((stack) => [...stack, { id: file.id, name: file.name }]);
    load({ folder: file.id, recent: false });
  }

  function goToRoot() {
    setFolderId(undefined);
    setFolderStack([]);
    load({ folder: undefined, recent: true });
  }

  function goBack() {
    const next = folderStack.slice(0, -1);
    setFolderStack(next);
    const parent = next.at(-1)?.id;
    setFolderId(parent);
    load({ folder: parent, recent: false });
  }

  function inspect(file: DriveFile) {
    startTransition(async () => {
      const result = await getGoogleDriveFileMetadataAction({ fileId: file.id });
      if (!result.ok) setError(result.error);
      else setSelected(result.data);
    });
  }

  function sync() {
    setError(null);
    startTransition(async () => {
      const result = await syncGoogleDriveAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setFiles(result.data);
    });
  }

  return (
    <Card elevated className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-4">
        <div>
          <CardTitle className="text-base">Google Drive</CardTitle>
          <CardDescription className="mt-1">
            Browse folders, search files, and inspect document metadata.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") load({ recent: false });
            }}
            placeholder="Search files…"
            className="h-9 w-44"
          />
          <Button size="sm" variant="secondary" loading={pending} onClick={() => load({ recent: false })}>
            Search
          </Button>
          <Button size="sm" variant="secondary" loading={pending} onClick={sync}>
            Recent files
          </Button>
        </div>
      </div>

      {error ? (
        <p className="border-b border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 px-4 py-3 text-xs text-secondary">
        <button type="button" onClick={goToRoot} className="hover:text-foreground">
          My Drive
        </button>
        {folderStack.map((folder, index) => (
          <span key={folder.id} className="flex items-center gap-2">
            <span>/</span>
            <button
              type="button"
              onClick={() => {
                const next = folderStack.slice(0, index + 1);
                setFolderStack(next);
                setFolderId(folder.id);
                load({ folder: folder.id, recent: false });
              }}
              className="hover:text-foreground"
            >
              {folder.name}
            </button>
          </span>
        ))}
        {folderStack.length > 0 ? (
          <Button size="sm" variant="secondary" onClick={goBack}>
            Back
          </Button>
        ) : null}
      </div>

      <ul className="divide-y divide-border/70">
        {files.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-muted">
            No Drive files found.
          </li>
        ) : (
          files.map((file) => (
            <li key={file.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-lg">{file.mimeType === FOLDER_MIME ? "▰" : "▱"}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-secondary">
                    {fileKind(file)}
                    {file.modifiedTime
                      ? ` · Updated ${new Date(file.modifiedTime).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={file.mimeType === FOLDER_MIME ? "accent" : "default"}>
                  {fileKind(file)}
                </Badge>
                {file.mimeType === FOLDER_MIME ? (
                  <Button size="sm" onClick={() => openFolder(file)}>
                    Open
                  </Button>
                ) : (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => inspect(file)}>
                      Metadata
                    </Button>
                    {file.webViewLink ? (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 items-center rounded-xl border border-border bg-elevated px-3 text-xs"
                      >
                        View
                      </a>
                    ) : null}
                  </>
                )}
              </div>
            </li>
          ))
        )}
      </ul>

      {selected ? (
        <div className="border-t border-border/70 bg-elevated/30 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{selected.name}</p>
              <p className="mt-1 text-xs text-secondary">{selected.mimeType}</p>
              {selected.description ? (
                <p className="mt-2 text-sm text-secondary">{selected.description}</p>
              ) : null}
              <p className="mt-2 text-xs text-muted">
                Created {selected.createdTime ? new Date(selected.createdTime).toLocaleString() : "—"}
                {" · "}
                Modified {selected.modifiedTime ? new Date(selected.modifiedTime).toLocaleString() : "—"}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}

      <div className="border-t border-border/70 px-4 py-3 text-xs text-secondary">
        Drive metadata is ready for future AI document search, summarization, and semantic indexing.
      </div>
    </Card>
  );
}
