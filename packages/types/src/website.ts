import { z } from "zod";

export const websiteProjectTypeSchema = z.enum([
  "website",
  "landing_page",
  "link_in_bio",
  "media_kit",
  "portfolio",
]);
export type WebsiteProjectType = z.infer<typeof websiteProjectTypeSchema>;

export type WebsiteProject = {
  id: string;
  workspaceId: string;
  createdBy: string;
  name: string;
  projectType: WebsiteProjectType;
  template: string;
  status: "draft" | "published" | "archived";
  slug: string;
  theme: Record<string, unknown>;
  settings: Record<string, unknown>;
  analytics: { views: number; clicks: number; submissions: number };
  createdAt: string;
  updatedAt: string;
};

export type WebsiteBlock = {
  id: string;
  type:
    | "hero"
    | "features"
    | "testimonials"
    | "pricing"
    | "faq"
    | "cta"
    | "text"
    | "gallery"
    | "team"
    | "contact"
    | "footer";
  props: Record<string, unknown>;
};

export type WebsitePage = {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  blocks: WebsiteBlock[];
  seo: Record<string, unknown>;
  sortOrder: number;
  updatedAt: string;
};

export type WebsiteLink = {
  id: string;
  projectId: string;
  label: string;
  url: string;
  icon: string | null;
  sortOrder: number;
  clicks: number;
  active: boolean;
};

export type WebsiteForm = {
  id: string;
  projectId: string | null;
  name: string;
  formType: "contact" | "lead_capture" | "newsletter";
  fields: unknown[];
  submissions: number;
  active: boolean;
};

export type WebsiteDomain = {
  id: string;
  projectId: string | null;
  domain: string;
  status: "pending" | "verified" | "error";
  sslStatus: "pending" | "active" | "error";
  dnsInstructions: Record<string, unknown>;
};

export type WebsiteDashboardStats = {
  projects: number;
  published: number;
  pages: number;
  links: number;
  views: number;
  clicks: number;
  submissions: number;
  domains: number;
};

export const websiteColorPaletteSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  surface: z.string(),
  text: z.string(),
  muted: z.string(),
});

export const websiteBlueprintBlockSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  props: z.record(z.string(), z.unknown()).default({}),
});

export const websiteBlueprintPageSchema = z.object({
  title: z.string(),
  slug: z.string(),
  blocks: z.array(websiteBlueprintBlockSchema),
});

export const websiteBlueprintSchema = z.object({
  name: z.string(),
  projectType: websiteProjectTypeSchema.default("website"),
  purpose: z.string(),
  audience: z.string(),
  navigation: z.array(z.string()).default([]),
  cta: z.object({
    label: z.string(),
    href: z.string().default("#contact"),
  }),
  theme: z.object({
    style: z.string(),
    typography: z.object({
      heading: z.string(),
      body: z.string(),
    }),
    colorPalette: websiteColorPaletteSchema,
  }),
  headline: z.string(),
  description: z.string(),
  pages: z.array(websiteBlueprintPageSchema).min(1),
});

export type WebsiteBlueprint = z.infer<typeof websiteBlueprintSchema>;
export type WebsiteBlueprintPage = z.infer<typeof websiteBlueprintPageSchema>;
export type WebsiteBlueprintBlock = z.infer<typeof websiteBlueprintBlockSchema>;

export const createWebsiteProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  projectType: websiteProjectTypeSchema.default("website"),
  template: z.string().trim().min(1).max(80).default("creator"),
  prompt: z.string().trim().max(3000).optional(),
});

/** Prompt-first generation — name/type inferred when omitted. */
export const generateWebsiteSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  projectType: websiteProjectTypeSchema.optional().default("website"),
  prompt: z.string().trim().min(8).max(3000),
  template: z.string().trim().min(1).max(80).default("creator"),
});

export const refineWebsiteSchema = z.object({
  projectId: z.string().uuid(),
  instruction: z.string().trim().min(3).max(2000),
  blueprint: websiteBlueprintSchema,
});

export const improveWebsiteSchema = z.object({
  projectId: z.string().uuid(),
  blueprint: websiteBlueprintSchema,
});

export const publishWebsiteSchema = z.object({
  projectId: z.string().uuid(),
});

export type CreateWebsiteProjectInput = z.infer<typeof createWebsiteProjectSchema>;
export type GenerateWebsiteInput = z.infer<typeof generateWebsiteSchema>;
export type RefineWebsiteInput = z.infer<typeof refineWebsiteSchema>;
export type ImproveWebsiteInput = z.infer<typeof improveWebsiteSchema>;
export type PublishWebsiteInput = z.infer<typeof publishWebsiteSchema>;
