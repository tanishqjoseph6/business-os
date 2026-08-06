"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { IntegrationHubCard } from "@repo/types";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import {
  disconnectIntegrationAction,
  startIntegrationOAuthAction,
} from "../../app/(protected)/actions/integrations";
import {
  formatIntegrationCategory,
  formatRelativeTime,
  IntegrationStatusBadge,
} from "./integration-status";
import { IntegrationProviderLogo } from "./integration-logo";

const INTEGRATION_COMPANIES: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  vercel: "Vercel",
  supabase: "Supabase",
  github: "GitHub, Inc.",
  gmail: "Google",
  "google-calendar": "Google",
  "google-drive": "Google",
  notion: "Notion Labs",
  outlook: "Microsoft",
  slack: "Salesforce",
  stripe: "Stripe, Inc.",
};

const FEATURE_LABELS: Record<string, string> = {
  read_emails: "Read Emails",
  search_emails: "Search Emails",
  send_email: "Send Emails",
  create_meeting: "Create Events",
  find_availability: "Find Availability",
  upload_file: "Upload Files",
  search_files: "Search Files",
  create_folder: "Create Folders",
  create_page: "Create Pages",
  search_notes: "Search Notes",
  send_message: "Send Messages",
  read_channels: "Read Channels",
  create_issue: "Create Issues",
  create_pr: "Create Pull Requests",
  read_repositories: "Read Repositories",
  list_payments: "Read Payments",
  view_customers: "View Customers",
  chat_completions: "Chat Completions",
  responses_api: "Responses API",
  embeddings: "Embeddings",
  image_generation: "Image Generation",
  claude_api: "Claude API",
  messages_api: "Messages API",
  tool_use: "Tool Use",
  long_context: "Long Context",
  deployments: "Deployments",
  domains: "Domains",
  environment_variables: "Environment Variables",
  logs: "Logs",
  database: "Database",
  authentication: "Authentication",
  storage: "Storage",
  edge_functions: "Edge Functions",
};

export function IntegrationCard({ card }: { card: IntegrationHubCard }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const connected = card.status === "connected" || card.status === "syncing";

  function connect() {
    setError(null);
    startTransition(async () => {
      const result = await startIntegrationOAuthAction({ provider: card.id });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.data.authUrl) {
        window.location.href = result.data.authUrl;
        return;
      }
      router.refresh();
    });
  }

  function disconnect() {
    if (!card.account) return;
    setError(null);
    startTransition(async () => {
      const result = await disconnectIntegrationAction({
        accountId: card.account!.id,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card
      elevated
      className="bos-float group flex h-full flex-col overflow-hidden border-white/[0.08] transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_55px_rgba(249,115,22,0.12)]"
    >
      <CardHeader className="mb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <IntegrationProviderLogo provider={card.id} name={card.name} />
            <div className="min-w-0">
              <CardTitle className="truncate">{card.name}</CardTitle>
              <CardDescription className="mt-0.5">{INTEGRATION_COMPANIES[card.id] ?? "VanderBase partner"}</CardDescription>
            </div>
          </div>
          <IntegrationStatusBadge status={card.status} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
          <span className="rounded-full border border-border bg-elevated/60 px-2 py-1">
            {formatIntegrationCategory(card.category)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-success" : "bg-muted"}`} />
            {connected ? "Connected" : "Not Connected"}
          </span>
        </div>
      </CardHeader>

      <p className="mb-4 flex-1 text-sm leading-6 text-secondary">
        {card.description}
      </p>

      {error ? (
        <p className="mb-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary" role="status">
          {error}
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {!connected ? (
          <Button size="sm" loading={pending} onClick={connect}>
            {card.id === "notion"
              ? "Connect Notion"
              : card.id === "gmail"
                ? "Connect Gmail"
                : card.id === "google-calendar"
                  ? "Connect Google Calendar"
                : "Connect"}
          </Button>
        ) : (
          <>
            <Link
              href={`/integrations/${card.id}`}
              className="inline-flex h-8 items-center rounded-xl border border-border bg-elevated px-3 text-xs text-foreground transition hover:bg-surface"
            >
              Open
            </Link>
            {card.id === "gmail" ? (
              <Link
                href="/inbox"
                className="inline-flex h-8 items-center rounded-xl px-3 text-xs text-secondary transition hover:bg-elevated hover:text-foreground"
              >
                Inbox
              </Link>
            ) : (
              <Link
                href={`/integrations/${card.id}/settings`}
                className="inline-flex h-8 items-center rounded-xl px-3 text-xs text-secondary transition hover:bg-elevated hover:text-foreground"
              >
                Configure
              </Link>
            )}
            <Button
              size="sm"
              variant="danger"
              loading={pending}
              onClick={disconnect}
            >
              Disconnect
            </Button>
          </>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(card.account?.permissions ?? card.kairosActions.map((action) => action))
          .slice(0, 3)
          .map((feature) => (
            <span key={feature} className="rounded-md border border-border/70 bg-white/[0.03] px-2 py-1 text-[10px] text-secondary">
              {FEATURE_LABELS[feature] ?? feature.replaceAll("_", " ")}
            </span>
          ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted">
        <span>Last sync · {formatRelativeTime(card.lastSyncAt)}</span>
        <span className="truncate pl-2">{connected ? "Ready to automate" : "OAuth ready"}</span>
      </div>
    </Card>
  );
}
