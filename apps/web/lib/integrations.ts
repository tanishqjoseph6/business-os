export type IntegrationCategory =
  | "ai"
  | "communication"
  | "productivity"
  | "development"
  | "payments"
  | "marketing"
  | "storage"
  | "crm"
  | "scheduling";

export type Integration = {
  id: string;
  name: string;
  categories: IntegrationCategory[];
  description: string;
  keywords?: string[];
  /** True when the integration is live in VanderBase today */
  available: boolean;
};

/** Canonical list shared by the public landing page and Integrations hub. */
export const IMPLEMENTED_INTEGRATIONS: Integration[] = [
  {
    id: "slack",
    name: "Slack",
    categories: ["communication"],
    description: "Post messages and read channels.",
    keywords: ["chat", "teams", "notifications"],
    available: true,
  },
  {
    id: "notion",
    name: "Notion",
    categories: ["productivity"],
    description: "Create pages and search workspace notes.",
    keywords: ["docs", "wiki", "knowledge"],
    available: true,
  },
  {
    id: "gmail",
    name: "Gmail",
    categories: ["communication"],
    description: "Sync, search, and automate email.",
    keywords: ["email", "inbox", "google"],
    available: true,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    categories: ["scheduling"],
    description: "Schedule meetings and find availability.",
    keywords: ["calendar", "events", "google"],
    available: true,
  },
  {
    id: "google-drive",
    name: "Google Drive",
    categories: ["storage"],
    description: "Browse and search workspace files.",
    keywords: ["drive", "files", "docs", "google"],
    available: true,
  },
  {
    id: "linear",
    name: "Linear",
    categories: ["productivity"],
    description: "Connect Linear teams, projects, and issues.",
    keywords: ["issues", "tasks", "projects", "engineering"],
    available: true,
  },
  {
    id: "actora",
    name: "Actora CRM",
    categories: ["crm"],
    description: "Connect your CRM workspace, contacts, companies, and deals.",
    keywords: ["crm", "contacts", "tasks", "customer data"],
    available: true,
  },
];

export const IMPLEMENTED_INTEGRATION_IDS = new Set(
  IMPLEMENTED_INTEGRATIONS.map((integration) => integration.id),
);

export function isImplementedIntegrationId(id: string): boolean {
  return IMPLEMENTED_INTEGRATION_IDS.has(id);
}

export function isIntegrationAvailable(integration: Integration): boolean {
  return integration.available;
}

export const INTEGRATION_FILTERS: { id: IntegrationCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ai", label: "AI" },
  { id: "communication", label: "Communication" },
  { id: "productivity", label: "Productivity" },
  { id: "development", label: "Development" },
  { id: "payments", label: "Payments" },
  { id: "marketing", label: "Marketing" },
  { id: "storage", label: "Storage" },
  { id: "crm", label: "CRM" },
  { id: "scheduling", label: "Scheduling" },
];

export const INTEGRATIONS: Integration[] = [
  { id: "google", name: "Google", categories: ["productivity"], description: "Workspace Sync", keywords: ["workspace", "google"], available: true },
  { id: "gmail", name: "Gmail", categories: ["communication"], description: "Email Sync", keywords: ["email", "inbox"], available: true },
  { id: "googlecalendar", name: "Google Calendar", categories: ["scheduling"], description: "Calendar Sync", keywords: ["calendar", "events"], available: true },
  { id: "googledrive", name: "Google Drive", categories: ["storage"], description: "File Sync", keywords: ["drive", "files"], available: false },
  { id: "slack", name: "Slack", categories: ["communication"], description: "Instant Team Notifications", keywords: ["chat", "teams"], available: false },
  { id: "discord", name: "Discord", categories: ["communication"], description: "Community Alerts", keywords: ["community"], available: false },
  { id: "notion", name: "Notion", categories: ["productivity"], description: "Knowledge Base", keywords: ["docs", "wiki"], available: false },
  { id: "github", name: "GitHub", categories: ["development"], description: "Repositories", keywords: ["git", "code"], available: false },
  { id: "gitlab", name: "GitLab", categories: ["development"], description: "DevOps Pipelines", keywords: ["ci", "cd"], available: false },
  { id: "stripe", name: "Stripe", categories: ["payments"], description: "Payments", keywords: ["billing", "checkout"], available: false },
  { id: "razorpay", name: "Razorpay", categories: ["payments"], description: "Global Payments", keywords: ["india", "upi"], available: false },
  { id: "meta", name: "Meta", categories: ["marketing"], description: "Ads & Social Graph", keywords: ["facebook", "ads"], available: false },
  { id: "instagram", name: "Instagram", categories: ["marketing"], description: "Social Publishing", keywords: ["social", "reels"], available: false },
  { id: "facebook", name: "Facebook", categories: ["marketing"], description: "Page Management", keywords: ["pages"], available: false },
  { id: "linkedin", name: "LinkedIn", categories: ["marketing"], description: "Professional Reach", keywords: ["b2b", "posts"], available: false },
  { id: "x", name: "X", categories: ["marketing"], description: "Social Distribution", keywords: ["twitter"], available: false },
  { id: "youtube", name: "YouTube", categories: ["marketing"], description: "Video Publishing", keywords: ["video"], available: false },
  { id: "tiktok", name: "TikTok", categories: ["marketing"], description: "Short-form Content", keywords: ["video", "social"], available: false },
  { id: "openai", name: "OpenAI", categories: ["ai"], description: "AI Generation", keywords: ["gpt", "chat"], available: true },
  { id: "anthropic", name: "Anthropic", categories: ["ai"], description: "Claude Models", keywords: ["claude"], available: true },
  { id: "googlegemini", name: "Gemini", categories: ["ai"], description: "Multimodal AI", keywords: ["gemini", "google ai"], available: true },
  { id: "microsoft", name: "Microsoft", categories: ["productivity"], description: "Microsoft 365", keywords: ["office", "365"], available: false },
  { id: "microsoftoutlook", name: "Outlook", categories: ["communication"], description: "Email & Calendar", keywords: ["outlook", "email"], available: false },
  { id: "onedrive", name: "OneDrive", categories: ["storage"], description: "Cloud Storage", keywords: ["microsoft", "files"], available: false },
  { id: "dropbox", name: "Dropbox", categories: ["storage"], description: "Shared Files", keywords: ["files", "sync"], available: false },
  { id: "zoom", name: "Zoom", categories: ["communication", "scheduling"], description: "Video Meetings", keywords: ["video", "calls"], available: false },
  { id: "amazonaws", name: "AWS", categories: ["development"], description: "Cloud Infrastructure", keywords: ["amazon", "cloud"], available: false },
  { id: "cloudflare", name: "Cloudflare", categories: ["development"], description: "Edge Network", keywords: ["cdn", "dns"], available: false },
  { id: "vercel", name: "Vercel", categories: ["development"], description: "Deploy & Preview", keywords: ["hosting", "nextjs"], available: false },
  { id: "supabase", name: "Supabase", categories: ["development"], description: "Database & Auth", keywords: ["postgres", "backend"], available: false },
  { id: "postgresql", name: "PostgreSQL", categories: ["development"], description: "Relational Data", keywords: ["sql", "database"], available: false },
  { id: "mongodb", name: "MongoDB", categories: ["development"], description: "Document Store", keywords: ["nosql"], available: false },
  { id: "redis", name: "Redis", categories: ["development"], description: "Caching Layer", keywords: ["cache", "queue"], available: false },
  { id: "hubspot", name: "HubSpot", categories: ["crm", "marketing"], description: "CRM & Marketing Hub", keywords: ["crm", "leads"], available: false },
  { id: "salesforce", name: "Salesforce", categories: ["crm"], description: "Enterprise CRM", keywords: ["sales", "pipeline"], available: false },
  { id: "zapier", name: "Zapier", categories: ["productivity"], description: "Workflow Automation", keywords: ["automation", "zaps"], available: false },
  { id: "n8n", name: "n8n", categories: ["productivity"], description: "Self-hosted Automations", keywords: ["workflows"], available: false },
  { id: "figma", name: "Figma", categories: ["productivity"], description: "Design Handoff", keywords: ["design", "ui"], available: false },
  { id: "linear", name: "Linear", categories: ["productivity"], description: "Issue Tracking", keywords: ["issues", "tasks"], available: true },
  { id: "clickup", name: "ClickUp", categories: ["productivity"], description: "Project Management", keywords: ["tasks"], available: false },
  { id: "trello", name: "Trello", categories: ["productivity"], description: "Kanban Boards", keywords: ["boards"], available: false },
  { id: "asana", name: "Asana", categories: ["productivity"], description: "Team Workflows", keywords: ["projects"], available: false },
  { id: "jira", name: "Jira", categories: ["productivity"], description: "Agile Delivery", keywords: ["sprints", "atlassian"], available: false },
  { id: "calendly", name: "Calendly", categories: ["scheduling"], description: "Booking Links", keywords: ["scheduling", "meetings"], available: false },
  { id: "twilio", name: "Twilio", categories: ["communication"], description: "SMS & Voice API", keywords: ["sms", "api"], available: false },
  { id: "resend", name: "Resend", categories: ["communication"], description: "Transactional Email", keywords: ["email", "api"], available: false },
  { id: "mailchimp", name: "Mailchimp", categories: ["marketing"], description: "Email Campaigns", keywords: ["newsletter"], available: false },
  { id: "brevo", name: "Brevo", categories: ["marketing"], description: "Marketing Automation", keywords: ["sendinblue"], available: false },
  { id: "intercom", name: "Intercom", categories: ["communication"], description: "Customer Messaging", keywords: ["support", "chat"], available: false },
  { id: "airtable", name: "Airtable", categories: ["productivity"], description: "Flexible Databases", keywords: ["tables", "records"], available: false },
  { id: "shopify", name: "Shopify", categories: ["payments"], description: "E-commerce Storefront", keywords: ["store", "commerce"], available: false },
  { id: "woocommerce", name: "WooCommerce", categories: ["payments"], description: "WordPress Commerce", keywords: ["wordpress", "store"], available: false },
];

export const AVAILABLE_INTEGRATION_COUNT = IMPLEMENTED_INTEGRATIONS.length;

export function filterIntegrations(input: {
  query: string;
  category: IntegrationCategory | "all";
}): Integration[] {
  const q = input.query.trim().toLowerCase();
  return IMPLEMENTED_INTEGRATIONS.filter((integration) => {
    const categoryMatch =
      input.category === "all" || integration.categories.includes(input.category);
    if (!categoryMatch) return false;
    if (!q) return true;
    return (
      integration.name.toLowerCase().includes(q) ||
      integration.id.includes(q) ||
      integration.description.toLowerCase().includes(q) ||
      integration.keywords?.some((keyword) => keyword.includes(q))
    );
  });
}
