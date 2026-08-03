import type { IntegrationHubCategory } from "@repo/types";

export const INTEGRATION_HUB_CATEGORIES: {
  id: IntegrationHubCategory;
  label: string;
  emoji?: string;
}[] = [
  { id: "featured", label: "Featured", emoji: "⭐" },
  { id: "ai", label: "AI", emoji: "✦" },
  { id: "google", label: "Google" },
  { id: "microsoft", label: "Microsoft" },
  { id: "communication", label: "Communication" },
  { id: "productivity", label: "Productivity" },
  { id: "development", label: "Development" },
  { id: "finance", label: "Finance" },
  { id: "storage", label: "Storage" },
];
