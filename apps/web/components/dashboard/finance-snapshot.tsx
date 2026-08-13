import Link from "next/link";
import { Badge } from "@repo/ui/badge";
import type { DashboardSnapshot } from "@repo/types";
import { formatCurrency } from "./format";
import { ClientRelativeTime } from "./client-relative-time";
import { EmptyState, SectionShell } from "./section-shell";

export function FinanceSnapshot({ snapshot }: { snapshot: DashboardSnapshot }) {
  const { finance } = snapshot;

  return (
    <SectionShell
      title="Finance Snapshot"
      description="Pipeline value and credit activity from CRM and billing."
      actionHref="/finance"
      actionLabel="Finance"
    >
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Pipeline" value={formatCurrency(finance.pipelineValue)} />
        <Metric label="Open deals" value={String(finance.openDeals)} />
        <Metric label="Won" value={formatCurrency(finance.wonValue)} />
        <Metric
          label="AI credits"
          value={finance.aiCredits.toLocaleString()}
        />
      </div>

      {finance.recentCredits.length === 0 && finance.openDeals === 0 ? (
        <EmptyState
          title="No finance activity yet"
          body="Open deals and AI credit usage will appear here as the workspace grows."
          href="/crm/deals"
          cta="Add a deal"
        />
      ) : (
        <ul className="space-y-2">
          {snapshot.deals.slice(0, 3).map((deal) => (
            <li key={deal.id}>
              <Link
                href={deal.href}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-elevated px-3 py-2.5 transition hover:border-primary/40"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {deal.title}
                  </span>
                  <span className="text-xs text-muted capitalize">
                    {deal.stage} · {deal.probability}%
                  </span>
                </span>
                <span className="text-sm font-medium text-primary">
                  {formatCurrency(deal.amount)}
                </span>
              </Link>
            </li>
          ))}
          {finance.recentCredits.slice(0, 3).map((credit) => (
            <li
              key={credit.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-foreground capitalize">
                  {credit.reason}
                </span>
                <span className="text-xs text-muted">
                  <ClientRelativeTime iso={credit.createdAt} />
                </span>
              </span>
              <Badge variant={credit.amount < 0 ? "warning" : "success"}>
                {credit.amount > 0 ? "+" : ""}
                {credit.amount}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}
