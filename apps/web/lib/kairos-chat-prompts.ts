export const KAIROS_SUGGESTED_PROMPTS = [
  {
    id: "summarize",
    label: "Summarize today's business",
    description: "Revenue, customers, deals and tasks at a glance",
    icon: "sparkles",
  },
  {
    id: "customers",
    label: "Show my newest customers",
    description: "Pull recent CRM activity into focus",
    icon: "users",
  },
  {
    id: "deals",
    label: "Find deals that need attention",
    description: "Surface stalled opportunities",
    icon: "target",
  },
  {
    id: "followups",
    label: "Schedule my follow-ups",
    description: "Organize next actions from your calendar",
    icon: "calendar",
  },
  {
    id: "email",
    label: "Draft a follow-up email",
    description: "Write a polished outreach message",
    icon: "mail",
  },
  {
    id: "revenue",
    label: "Analyze this month's revenue",
    description: "Break down performance and trends",
    icon: "chart",
  },
  {
    id: "invoice",
    label: "Create an invoice",
    description: "Start billing from a natural request",
    icon: "file",
  },
  {
    id: "campaign",
    label: "Build a marketing campaign",
    description: "Outline messaging, channels and next steps",
    icon: "megaphone",
  },
] as const;

export type KairosSuggestedPrompt = (typeof KAIROS_SUGGESTED_PROMPTS)[number];
