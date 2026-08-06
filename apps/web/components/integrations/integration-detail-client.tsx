"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type {
  IntegrationAccount,
  IntegrationActivity,
  IntegrationCatalogItem,
  InboxThread,
} from "@repo/types";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import {
  disconnectIntegrationAction,
  manualSyncIntegrationAction,
  startIntegrationOAuthAction,
} from "../../app/(protected)/actions/integrations";
import { IntegrationProviderLogo } from "./integration-logo";
import {
  formatIntegrationCategory,
  formatRelativeTime,
  IntegrationStatusBadge,
} from "./integration-status";
import { GmailIntegrationInbox } from "./gmail-integration-inbox";
import { GmailSyncPanel } from "../inbox/gmail-sync-panel";
import { GoogleCalendarPanel } from "./google-calendar-panel";
import { GoogleDrivePanel } from "./google-drive-panel";

const EVENT_LABEL: Record<string, string> = {
  connected: "Connected",
  disconnected: "Disconnected",
  permission_updated: "Permission Updated",
  manual_sync: "Manual Sync",
  automatic_sync: "Automatic Sync",
  error: "Error",
  token_refreshed: "Token Refreshed",
  reconnect: "Reconnected",
};

export function IntegrationDetailClient({
  catalog,
  account,
  activity,
  justConnected,
  gmailThreads = [],
  oauthError,
}: {
  catalog: IntegrationCatalogItem;
  account: IntegrationAccount | null;
  activity: IntegrationActivity[];
  justConnected?: boolean;
  gmailThreads?: InboxThread[];
  oauthError?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const connected = account?.status === "connected" || account?.status === "syncing";
  const status = connected
    ? account!.status
    : account?.status === "error"
      ? "error"
      : "not_connected";

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  const connectLabel =
    catalog.id === "gmail"
      ? "Connect Gmail"
      : catalog.id === "google-calendar"
        ? "Connect Google Calendar"
        : catalog.id === "google-drive"
          ? "Connect Google Drive"
      : catalog.id === "notion"
        ? "Connect Notion"
        : "Connect";

  return (
    <div className="space-y-5">
      {justConnected ? (
        <div className="bos-glass rounded-2xl border border-success/30 px-4 py-3 text-sm text-success">
          {catalog.name} connected successfully.
          {catalog.id === "gmail"
            ? " Inbox metadata sync started — latest emails appear below."
            : " Kairos can use it when AI access is enabled."}
        </div>
      ) : null}

      {oauthError ? (
        <div className="bos-glass rounded-2xl border border-error/30 px-4 py-3 text-sm text-error">
          {catalog.name} connection failed: {oauthError}. Check your Google OAuth
          settings and try again.
        </div>
      ) : null}

      {error ? (
        <div className="bos-glass rounded-2xl border border-error/30 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card elevated className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <IntegrationProviderLogo provider={catalog.id} name={catalog.name} />
              <div>
                <h2 className="text-xl font-semibold">{catalog.name}</h2>
                <p className="text-sm text-secondary">
                  {formatIntegrationCategory(catalog.category)}
                </p>
              </div>
            </div>
            <IntegrationStatusBadge status={status} />
          </div>

          <p className="text-sm leading-6 text-secondary">{catalog.description}</p>

          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="bos-glass rounded-xl p-3">
              <dt className="text-[11px] uppercase tracking-wide text-muted">
                Account email
              </dt>
              <dd className="mt-1 text-sm">{account?.accountEmail ?? "—"}</dd>
            </div>
            <div className="bos-glass rounded-xl p-3">
              <dt className="text-[11px] uppercase tracking-wide text-muted">
                Connection health
              </dt>
              <dd className="mt-1 text-sm capitalize">{account?.health ?? "unknown"}</dd>
            </div>
            <div className="bos-glass rounded-xl p-3">
              <dt className="text-[11px] uppercase tracking-wide text-muted">
                Last sync
              </dt>
              <dd className="mt-1 text-sm">
                {formatRelativeTime(account?.lastSyncAt)}
              </dd>
            </div>
            <div className="bos-glass rounded-xl p-3">
              <dt className="text-[11px] uppercase tracking-wide text-muted">
                Sync frequency
              </dt>
              <dd className="mt-1 text-sm capitalize">
                {account?.syncFrequency ?? "manual"}
              </dd>
            </div>
          </dl>

          <div>
            <h3 className="mb-2 text-sm font-medium">Permissions granted</h3>
            <div className="flex flex-wrap gap-2">
              {(account?.permissions?.length
                ? account.permissions
                : catalog.kairosActions
              ).map((permission) => (
                <span
                  key={permission}
                  className="rounded-lg border border-border bg-elevated px-2 py-1 text-xs text-secondary"
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!connected ? (
              <Button
                loading={pending}
                onClick={() =>
                  run(async () => {
                    const result = await startIntegrationOAuthAction({
                      provider: catalog.id,
                    });
                    if (!result.ok) throw new Error(result.error);
                    window.location.href = result.data.authUrl;
                  })
                }
              >
                {connectLabel}
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  loading={pending}
                  onClick={() =>
                    run(async () => {
                      const result = await startIntegrationOAuthAction({
                        provider: catalog.id,
                      });
                      if (!result.ok) throw new Error(result.error);
                      window.location.href = result.data.authUrl;
                    })
                  }
                >
                  Reconnect
                </Button>
                <Button
                  variant="secondary"
                  loading={pending}
                  onClick={() =>
                    run(async () => {
                      if (!account) return;
                      const result = await manualSyncIntegrationAction({
                        accountId: account.id,
                      });
                      if (!result.ok) throw new Error(result.error);
                      router.refresh();
                    })
                  }
                >
                  Manual Sync
                </Button>
                {catalog.id === "gmail" ? (
                  <Link
                    href="/inbox"
                    className="inline-flex h-10 items-center rounded-xl border border-border bg-elevated px-4 text-sm"
                  >
                    Open Inbox
                  </Link>
                ) : (
                  <Link
                    href={`/integrations/${catalog.id}/settings`}
                    className="inline-flex h-10 items-center rounded-xl border border-border bg-elevated px-4 text-sm"
                  >
                    Sync Settings
                  </Link>
                )}
                <Button
                  variant="danger"
                  loading={pending}
                  onClick={() =>
                    run(async () => {
                      if (!account) return;
                      const result = await disconnectIntegrationAction({
                        accountId: account.id,
                      });
                      if (!result.ok) throw new Error(result.error);
                      router.refresh();
                    })
                  }
                >
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </Card>

        <div className="space-y-5">
          <Card elevated>
            <CardHeader>
              <CardTitle>Kairos actions</CardTitle>
              <CardDescription>
                Available once connected with AI access enabled.
              </CardDescription>
            </CardHeader>
            <ul className="space-y-2">
              {catalog.kairosActions.map((action) => (
                <li
                  key={action}
                  className="rounded-xl border border-border/70 bg-elevated/40 px-3 py-2 text-sm text-secondary"
                >
                  {action.replaceAll("_", " ")}
                </li>
              ))}
            </ul>
          </Card>

          <Card elevated>
            <CardHeader>
              <CardTitle>Activity log</CardTitle>
              <CardDescription>Connection and sync timeline</CardDescription>
            </CardHeader>
            {activity.length === 0 ? (
              <p className="text-sm text-secondary">
                No activity yet. Connect {catalog.name} to start the timeline.
              </p>
            ) : (
              <ol className="relative space-y-4 border-l border-border/70 pl-4">
                {activity.map((item) => (
                  <li key={item.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                    <p className="text-sm font-medium">
                      {EVENT_LABEL[item.eventType] ?? item.title}
                    </p>
                    <p className="text-xs text-secondary">
                      {item.body || item.title}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>

      {catalog.id === "gmail" ? (
        <div className="space-y-5">
          {account ? (
            <GmailSyncPanel accountId={account.id} />
          ) : null}
          <GmailIntegrationInbox
            threads={gmailThreads}
            accountEmail={account?.accountEmail ?? null}
            connected={connected}
          />
        </div>
      ) : null}
      {catalog.id === "google-calendar" && connected ? (
        <GoogleCalendarPanel />
      ) : null}
      {catalog.id === "google-drive" && connected ? <GoogleDrivePanel /> : null}
    </div>
  );
}
