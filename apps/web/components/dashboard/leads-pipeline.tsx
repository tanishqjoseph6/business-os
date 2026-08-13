import Link from "next/link";
import { Badge } from "@repo/ui/badge";
import type { DashboardSnapshot } from "@repo/types";
import { formatCurrency } from "./format";
import { ClientRelativeTime } from "./client-relative-time";
import { EmptyState, SectionShell } from "./section-shell";

export function LeadsPipeline({ snapshot }: { snapshot: DashboardSnapshot }) {
  const maxValue = Math.max(...snapshot.pipeline.map((stage) => stage.value), 1);

  return (
    <SectionShell
      title="Leads Pipeline"
      description="Live CRM leads and deal stages across your workspace."
      actionHref="/crm/leads"
      actionLabel="CRM leads"
    >
      <div className="mb-4 space-y-2">
        {snapshot.pipeline.map((stage) => (
          <div key={stage.stage} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="capitalize text-secondary">{stage.stage}</span>
              <span className="text-muted">
                {stage.count} · {formatCurrency(stage.value)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{
                  width: `${Math.max(4, (stage.value / maxValue) * 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {snapshot.leads.length === 0 ? (
        <EmptyState
          title="No leads yet"
          body="New CRM leads will land here as soon as they are created."
          href="/crm/leads"
          cta="Create lead"
        />
      ) : (
        <ul className="space-y-2">
          {snapshot.leads.map((lead) => (
            <li key={lead.id}>
              <Link
                href={lead.href}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-elevated px-3 py-2.5 transition hover:border-primary/40"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {lead.name}
                  </span>
                  <span className="text-xs text-muted">
                    {lead.email ?? lead.source ?? "Lead"} ·{" "}
                    <ClientRelativeTime iso={lead.updatedAt} />
                  </span>
                </span>
                <Badge variant="accent">{lead.stage}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
}
