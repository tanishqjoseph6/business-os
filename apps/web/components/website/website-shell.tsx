"use client";

import { useMemo, useState } from "react";
import {
  Blocks,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe2,
  Image,
  Link2,
  Mail,
  Plus,
  Sparkles,
} from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import {
  websiteBlueprintSchema,
  type WebsiteBlueprint,
  type WebsiteDashboardStats,
  type WebsiteDomain,
  type WebsiteForm,
  type WebsiteLink,
  type WebsitePage,
  type WebsiteProject,
} from "@repo/types";
import { TabNav } from "../app/tab-nav";
import { EmptyState, SectionShell } from "../dashboard/section-shell";
import { WebsiteBuilderStudio } from "./website-builder-studio";

type Tab =
  | "overview"
  | "builder"
  | "links"
  | "media"
  | "portfolio"
  | "forms"
  | "domains";

function readBlueprint(project: WebsiteProject | undefined): WebsiteBlueprint | null {
  if (!project) return null;
  const candidate = project.settings?.blueprint;
  const parsed = websiteBlueprintSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export function WebsiteShell({
  stats,
  projects,
  pages,
  links,
  forms,
  domains,
}: {
  stats: WebsiteDashboardStats;
  projects: WebsiteProject[];
  pages: WebsitePage[];
  links: WebsiteLink[];
  forms: WebsiteForm[];
  domains: WebsiteDomain[];
}) {
  const [tab, setTab] = useState<Tab>("builder");
  const latestProject = projects[0];
  const initialBlueprint = useMemo(
    () => readBlueprint(latestProject),
    [latestProject],
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="bos-gradient-border bos-glass-strong bos-noise relative overflow-hidden rounded-[24px] p-6 pbos-animate-rise">
        <header className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Badge variant="accent" className="gap-1.5">
              <Sparkles className="h-3 w-3" aria-hidden /> Website & Landing Pages OS
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Make your best work easy to find.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
              Prompt-first AI website generation with live preview, chat-to-edit, and publish —
              in one premium workspace.
            </p>
          </div>
          <Button onClick={() => setTab("builder")} className="gap-2">
            <Sparkles className="h-4 w-4" aria-hidden /> Open AI Builder
          </Button>
        </header>
      </div>
      <TabNav
        label="Website OS"
        active={tab}
        onChange={(id) => setTab(id as Tab)}
        items={[
          { id: "overview", label: "Dashboard" },
          { id: "builder", label: "AI Builder" },
          { id: "links", label: "Link in Bio" },
          { id: "media", label: "Media Kit" },
          { id: "portfolio", label: "Portfolio" },
          { id: "forms", label: "Forms" },
          { id: "domains", label: "Domains" },
        ]}
      />
      {tab === "overview" ? (
        <Overview stats={stats} projects={projects} onTab={setTab} />
      ) : null}
      {tab === "builder" ? (
        <WebsiteBuilderStudio
          initialBlueprint={initialBlueprint}
          initialProjectId={latestProject?.id ?? null}
          initialStatus={latestProject?.status ?? null}
        />
      ) : null}
      {tab === "links" ? <Links links={links} /> : null}
      {tab === "media" ? <MediaKit /> : null}
      {tab === "portfolio" ? <Portfolio pages={pages} /> : null}
      {tab === "forms" ? <Forms forms={forms} /> : null}
      {tab === "domains" ? <Domains domains={domains} /> : null}
    </div>
  );
}

function Overview({
  stats,
  projects,
  onTab,
}: {
  stats: WebsiteDashboardStats;
  projects: WebsiteProject[];
  onTab: (tab: Tab) => void;
}) {
  const cards = [
    ["Projects", stats.projects, Globe2],
    ["Published", stats.published, CheckCircle2],
    ["Pages", stats.pages, FileText],
    ["Link clicks", stats.clicks, Link2],
    ["Submissions", stats.submissions, Mail],
  ] as const;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value, Icon]) => (
          <Card key={label} className="transition hover:border-primary/40 hover:bg-elevated">
            <div className="flex justify-between">
              <p className="text-sm text-secondary">{label}</p>
              <Icon className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <p className="mt-4 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionShell title="Your sites" description="Websites, landing pages, portfolios, and media kits.">
          <div className="space-y-2">
            {projects.length === 0 ? (
              <EmptyState
                title="No projects yet"
                body="Generate a site from a prompt and preview it live."
              />
            ) : (
              projects.slice(0, 6).map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => onTab("builder")}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-elevated p-3 text-left transition hover:border-primary/40"
                >
                  <span className="min-w-0">
                    <p className="truncate text-sm font-medium">{project.name}</p>
                    <p className="mt-1 text-xs capitalize text-muted">
                      {project.projectType.replace("_", " ")} · {project.template}
                    </p>
                  </span>
                  <Badge variant={project.status === "published" ? "success" : "default"}>
                    {project.status}
                  </Badge>
                </button>
              ))
            )}
          </div>
          <Button className="mt-4" onClick={() => onTab("builder")}>
            Open AI Builder
          </Button>
        </SectionShell>
        <SectionShell title="Performance snapshot" description="Real project, link, and form activity." elevated>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Views" value={stats.views} />
            <Metric label="Clicks" value={stats.clicks} />
            <Metric label="Submissions" value={stats.submissions} />
            <Metric label="Domains" value={stats.domains} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => onTab("links")} className="gap-1.5">
              <Link2 className="h-3.5 w-3.5" aria-hidden /> Manage links
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onTab("forms")}>
              Build a form
            </Button>
          </div>
        </SectionShell>
      </div>
    </div>
  );
}

function Links({ links }: { links: WebsiteLink[] }) {
  return (
    <SectionShell title="Link in Bio" description="Multiple links, social icons, branding, and click analytics." elevated>
      <div className="mb-4 flex justify-between">
        <Badge variant="accent">{links.length} links</Badge>
        <Button size="sm" disabled>
          <Plus className="mr-1 h-3.5 w-3.5" aria-hidden /> Add link
        </Button>
      </div>
      {links.length === 0 ? (
        <EmptyState title="No links yet" body="Create a link-in-bio project to organize your best destinations." />
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id} className="flex items-center justify-between rounded-xl border border-border bg-elevated p-3">
              <span>
                <p className="font-medium">{link.label}</p>
                <p className="text-xs text-muted">
                  {link.url} · {link.clicks} clicks
                </p>
              </span>
              <Badge variant={link.active ? "success" : "default"}>
                {link.active ? "active" : "hidden"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

function MediaKit() {
  return (
    <SectionShell title="Media Kit" description="About, statistics, collaborations, contact, and downloadable PDF." elevated>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {["About", "Statistics", "Collaborations", "Contact form"].map((item) => (
          <Card key={item}>
            <Image className="h-5 w-5 text-primary" aria-hidden />
            <p className="mt-3 font-medium">{item}</p>
            <p className="mt-1 text-xs text-muted">Ready to configure</p>
          </Card>
        ))}
      </div>
      <Button className="mt-4" disabled>
        Download PDF
      </Button>
    </SectionShell>
  );
}

function Portfolio({ pages }: { pages: WebsitePage[] }) {
  return (
    <SectionShell title="Portfolio" description="Projects, case studies, galleries, services, and testimonials." elevated>
      {pages.length === 0 ? (
        <EmptyState title="Your portfolio is waiting" body="Generate a portfolio project to showcase your work." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {pages.map((page) => (
            <Card key={page.id}>
              <Blocks className="h-5 w-5 text-primary" aria-hidden />
              <p className="mt-3 font-medium">{page.title}</p>
              <p className="mt-1 text-xs text-muted">{page.blocks.length} content blocks</p>
            </Card>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

function Forms({ forms }: { forms: WebsiteForm[] }) {
  return (
    <SectionShell title="Forms" description="Contact, lead capture, and newsletter signup forms." elevated>
      <div className="grid gap-3 sm:grid-cols-3">
        {(["contact", "lead_capture", "newsletter"] as const).map((type) => {
          const form = forms.find((item) => item.formType === type);
          return (
            <Card key={type}>
              <Mail className="h-5 w-5 text-primary" aria-hidden />
              <p className="mt-3 font-medium capitalize">{type.replace("_", " ")}</p>
              <p className="mt-1 text-xs text-muted">
                {form ? `${form.submissions} submissions` : "Not configured"}
              </p>
              <Button className="mt-4 w-full" size="sm" variant="secondary" disabled>
                {form ? "Manage" : "Create form"}
              </Button>
            </Card>
          );
        })}
      </div>
    </SectionShell>
  );
}

function Domains({ domains }: { domains: WebsiteDomain[] }) {
  return (
    <SectionShell title="Domains" description="Custom domains, SSL status, and DNS instructions." elevated>
      {domains.length === 0 ? (
        <EmptyState title="No custom domain" body="Connect a domain after publishing your first site." />
      ) : (
        <div className="space-y-2">
          {domains.map((domain) => (
            <div key={domain.id} className="flex items-center justify-between rounded-xl border border-border bg-elevated p-3">
              <span>
                <p className="font-medium">{domain.domain}</p>
                <p className="text-xs text-muted">SSL: {domain.sslStatus}</p>
              </span>
              <Badge variant={domain.status === "verified" ? "success" : "warning"}>
                {domain.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 flex items-center gap-2 text-xs text-muted">
        <ExternalLink className="h-3.5 w-3.5" aria-hidden /> DNS verification and SSL provider adapters remain available after publish.
      </p>
    </SectionShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-elevated px-3 py-3">
      <p className="text-lg font-semibold">{value.toLocaleString()}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
