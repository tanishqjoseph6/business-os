import type { IntegrationConnectionStatus } from "@repo/types";
import { Check, LoaderCircle } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { isImplementedIntegrationId } from "../../lib/integrations";

const STATUS_LABEL: Record<IntegrationConnectionStatus, string> = {
  connected: "Connected",
  not_connected: "Not Connected",
  error: "Error",
  syncing: "Syncing",
  disconnected: "Not Connected",
};

const STATUS_VARIANT: Record<
  IntegrationConnectionStatus,
  "success" | "default" | "error" | "warning" | "info"
> = {
  connected: "success",
  not_connected: "default",
  disconnected: "default",
  error: "error",
  syncing: "info",
};

export function IntegrationStatusBadge({
  status,
}: {
  status: IntegrationConnectionStatus;
}) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
  );
}

export function IntegrationAvailabilityBadge({
  integrationId,
  connectionStatus,
}: {
  integrationId: string;
  connectionStatus: IntegrationConnectionStatus;
}) {
  const implemented = isImplementedIntegrationId(integrationId);
  const connecting = implemented && connectionStatus === "syncing";

  if (connecting) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#60A5FA] bg-[rgba(96,165,250,0.15)] px-2.5 py-1 text-[11px] font-semibold text-[#60A5FA]">
        <LoaderCircle className="h-3 w-3 animate-spin" aria-hidden />
        Connecting...
      </span>
    );
  }

  if (implemented) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#22C55E] bg-[rgba(34,197,94,0.15)] px-2.5 py-1 text-[11px] font-semibold text-[#22C55E]">
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.8)]"
          aria-hidden
        />
        <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
        Available
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F97316] bg-[rgba(249,115,22,0.15)] px-2.5 py-1 text-[11px] font-semibold text-[#F97316]">
      Coming Soon
    </span>
  );
}

export function formatIntegrationCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Never";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return date.toLocaleDateString();
}
