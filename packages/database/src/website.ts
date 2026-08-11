import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Json,
  WebsiteDashboardStats,
  WebsiteDomain,
  WebsiteForm,
  WebsiteLink,
  WebsitePage,
  WebsiteProject,
} from "@repo/types";
import { createServerClient } from "./server";

type Client = SupabaseClient<Database>;
const clientOrDefault = async (client?: Client) => client ?? (await createServerClient());
const objectValue = (value: Json) =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

type ProjectRow = Database["public"]["Tables"]["website_projects"]["Row"];
type PageRow = Database["public"]["Tables"]["website_pages"]["Row"];
type LinkRow = Database["public"]["Tables"]["website_links"]["Row"];
type FormRow = Database["public"]["Tables"]["website_forms"]["Row"];
type DomainRow = Database["public"]["Tables"]["website_domains"]["Row"];

function mapProject(row: ProjectRow): WebsiteProject {
  const analytics = objectValue(row.analytics);
  return {
    id: row.id, workspaceId: row.workspace_id, createdBy: row.created_by,
    name: row.name, projectType: row.project_type as WebsiteProject["projectType"],
    template: row.template, status: row.status, slug: row.slug,
    theme: objectValue(row.theme), settings: objectValue(row.settings),
    analytics: { views: Number(analytics.views ?? 0), clicks: Number(analytics.clicks ?? 0), submissions: Number(analytics.submissions ?? 0) },
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}
function mapPage(row: PageRow): WebsitePage {
  return { id: row.id, projectId: row.project_id, title: row.title, slug: row.slug, blocks: Array.isArray(row.blocks) ? row.blocks as WebsitePage["blocks"] : [], seo: objectValue(row.seo), sortOrder: row.sort_order, updatedAt: row.updated_at };
}
function mapLink(row: LinkRow): WebsiteLink {
  return { id: row.id, projectId: row.project_id, label: row.label, url: row.url, icon: row.icon, sortOrder: row.sort_order, clicks: row.clicks, active: row.active };
}
function mapForm(row: FormRow): WebsiteForm {
  return { id: row.id, projectId: row.project_id, name: row.name, formType: row.form_type as WebsiteForm["formType"], fields: Array.isArray(row.fields) ? row.fields : [], submissions: row.submissions, active: row.active };
}
function mapDomain(row: DomainRow): WebsiteDomain {
  return { id: row.id, projectId: row.project_id, domain: row.domain, status: row.status as WebsiteDomain["status"], sslStatus: row.ssl_status as WebsiteDomain["sslStatus"], dnsInstructions: objectValue(row.dns_instructions) };
}

export async function listWebsiteProjects(input: { workspaceId: string; client?: Client }) {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase.from("website_projects").select("*").eq("workspace_id", input.workspaceId).order("updated_at", { ascending: false });
  if (error) throw new Error(`Failed to list website projects: ${error.message}`);
  return (data ?? []).map(mapProject);
}
export async function listWebsitePages(input: { workspaceId: string; projectId?: string; client?: Client }) {
  const supabase = await clientOrDefault(input.client);
  let query = supabase.from("website_pages").select("*").eq("workspace_id", input.workspaceId).order("sort_order");
  if (input.projectId) query = query.eq("project_id", input.projectId);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list website pages: ${error.message}`);
  return (data ?? []).map(mapPage);
}
export async function listWebsiteLinks(input: { workspaceId: string; projectId?: string; client?: Client }) {
  const supabase = await clientOrDefault(input.client);
  let query = supabase.from("website_links").select("*").eq("workspace_id", input.workspaceId).order("sort_order");
  if (input.projectId) query = query.eq("project_id", input.projectId);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list website links: ${error.message}`);
  return (data ?? []).map(mapLink);
}
export async function listWebsiteForms(input: { workspaceId: string; client?: Client }) {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase.from("website_forms").select("*").eq("workspace_id", input.workspaceId).order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to list website forms: ${error.message}`);
  return (data ?? []).map(mapForm);
}
export async function listWebsiteDomains(input: { workspaceId: string; client?: Client }) {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase.from("website_domains").select("*").eq("workspace_id", input.workspaceId).order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to list website domains: ${error.message}`);
  return (data ?? []).map(mapDomain);
}
export async function getWebsiteDashboardStats(input: { workspaceId: string; client?: Client }): Promise<WebsiteDashboardStats> {
  const [projects, pages, links, forms, domains] = await Promise.all([
    listWebsiteProjects({ workspaceId: input.workspaceId, client: input.client }),
    listWebsitePages({ workspaceId: input.workspaceId, client: input.client }),
    listWebsiteLinks({ workspaceId: input.workspaceId, client: input.client }),
    listWebsiteForms({ workspaceId: input.workspaceId, client: input.client }),
    listWebsiteDomains({ workspaceId: input.workspaceId, client: input.client }),
  ]);
  return {
    projects: projects.length, published: projects.filter((p) => p.status === "published").length,
    pages: pages.length, links: links.length,
    views: projects.reduce((sum, p) => sum + p.analytics.views, 0),
    clicks: links.reduce((sum, l) => sum + l.clicks, 0) + projects.reduce((sum, p) => sum + p.analytics.clicks, 0),
    submissions: forms.reduce((sum, f) => sum + f.submissions, 0) + projects.reduce((sum, p) => sum + p.analytics.submissions, 0),
    domains: domains.length,
  };
}
export async function createWebsiteProject(input: { workspaceId: string; userId: string; name: string; projectType: string; template: string; slug: string; settings?: Record<string, unknown>; theme?: Record<string, unknown>; client?: Client }): Promise<WebsiteProject> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase.from("website_projects").insert({
    workspace_id: input.workspaceId, created_by: input.userId, name: input.name,
    project_type: input.projectType, template: input.template, slug: input.slug,
    settings: (input.settings ?? {}) as Json,
    theme: (input.theme ?? {}) as Json,
  }).select("*").single();
  if (error || !data) throw new Error(`Failed to create website project: ${error?.message ?? "Unknown"}`);
  return mapProject(data);
}

export async function updateWebsiteProject(input: {
  workspaceId: string;
  projectId: string;
  name?: string;
  status?: WebsiteProject["status"];
  settings?: Record<string, unknown>;
  theme?: Record<string, unknown>;
  client?: Client;
}): Promise<WebsiteProject> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["website_projects"]["Update"] = {
    updated_at: new Date().toISOString(),
  };
  if (input.name !== undefined) patch.name = input.name;
  if (input.status !== undefined) patch.status = input.status;
  if (input.settings !== undefined) patch.settings = input.settings as Json;
  if (input.theme !== undefined) patch.theme = input.theme as Json;

  const { data, error } = await supabase
    .from("website_projects")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.projectId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update website project: ${error?.message ?? "Unknown"}`);
  }
  return mapProject(data);
}
