import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { Building2, Target, UserPlus } from "lucide-react";
import { ensureCrmAiToolsRegistered } from "../../../lib/crm-ai";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import { getCrmModuleData } from "../actions/crm";
import { CrmShell } from "../../../components/crm/crm-shell";
import { CrmAiInsightsCard } from "../../../components/crm/crm-extra";
import { CrmGlobalSearch } from "../../../components/crm/crm-global-search";
import { EmptyState } from "../../../components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function CrmDashboardPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");

  const { registered } = ensureCrmAiToolsRegistered();
  const data = await getCrmModuleData();
  const recentActivities = data.activities.slice(0, 6);

  return (
    <CrmShell
      title="CRM Overview"
      description="Contacts, companies, deals, and pipeline — searchable and actionable."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <CrmGlobalSearch />
          <Link href="/crm/contacts">
            <Button size="sm" variant="secondary" className="gap-1.5">
              <UserPlus className="h-3.5 w-3.5" aria-hidden />
              Add contact
            </Button>
          </Link>
          <Link href="/crm/companies">
            <Button size="sm" variant="secondary" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              Add company
            </Button>
          </Link>
          <Link href="/crm/deals">
            <Button size="sm" className="gap-1.5">
              <Target className="h-3.5 w-3.5" aria-hidden />
              Create deal
            </Button>
          </Link>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total leads" value={data.stats.leads} hint="Lifecycle = lead" href="/crm/leads" />
        <StatCard
          title="Qualified leads"
          value={data.stats.qualifiedLeads}
          hint="Ready for outreach"
          href="/crm/leads"
        />
        <StatCard title="Open deals" value={data.stats.openDeals} hint="Active pipeline" href="/crm/deals" />
        <StatCard title="Won deals" value={data.stats.wonDeals} hint="Closed won" href="/crm/deals" />
        <StatCard title="Lost deals" value={data.stats.lostDeals} hint="Closed lost" href="/crm/deals" />
        <StatCard
          title="Revenue pipeline"
          value={`$${data.stats.pipelineValue.toLocaleString()}`}
          hint="Open deal value"
          href="/crm/pipeline"
        />
        <StatCard
          title="Conversion rate"
          value={`${data.stats.conversionRate}%`}
          hint="Won / closed"
          href="/crm/reports"
        />
        <StatCard
          title="Sales this month"
          value={`$${data.stats.salesThisMonth.toLocaleString()}`}
          hint="Won amount MTD"
          href="/crm/reports"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Recent activities</CardTitle>
            <CardDescription>Latest calls, meetings, emails, and tasks</CardDescription>
          </CardHeader>
          {recentActivities.length === 0 ? (
            <div className="px-1 pb-2">
              <EmptyState
                title="No activities yet"
                body="Log calls, meetings, and follow-ups to build a customer timeline."
                href="/crm/activities"
                cta="Open activities"
              />
            </div>
          ) : (
            <ul className="space-y-2 px-1 pb-1">
              {recentActivities.map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-elevated/60 px-3 py-2.5 text-sm"
                >
                  <span className="truncate text-foreground">{activity.subject}</span>
                  <Badge variant="default">{activity.type}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <CrmAiInsightsCard stats={data.stats} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Workspaces</CardTitle>
              <CardDescription>
                Jump into contacts, companies, deals, and pipeline views.
              </CardDescription>
            </div>
            <Link href="/chat?prompt=Show%20hot%20leads">
              <Button size="sm" variant="secondary">
                Ask Kairos about CRM
              </Button>
            </Link>
          </div>
        </CardHeader>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/crm/contacts", label: "Contacts", hint: "People in your CRM" },
            { href: "/crm/companies", label: "Companies", hint: "Accounts & orgs" },
            { href: "/crm/deals", label: "Deals", hint: "Opportunities" },
            { href: "/crm/pipeline", label: "Pipeline", hint: "Stage board" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-border/70 bg-elevated/40 px-4 py-3 transition hover:border-primary/35 hover:bg-elevated"
            >
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="mt-1 text-xs text-muted">{item.hint}</p>
            </Link>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(registered.length
            ? registered
            : [
                "crm.listContacts",
                "crm.createLead",
                "crm.updateDeal",
                "crm.searchCompany",
                "crm.getCustomerTimeline",
                "crm.listDeals",
              ]
          ).map((name) => (
            <Badge key={name} variant="accent">
              {name}
            </Badge>
          ))}
        </div>
      </Card>
    </CrmShell>
  );
}

function StatCard({
  title,
  value,
  hint,
  href,
}: {
  title: string;
  value: string | number;
  hint: string;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="h-full transition hover:border-primary/35">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{hint}</CardDescription>
        </CardHeader>
        <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      </Card>
    </Link>
  );
}
