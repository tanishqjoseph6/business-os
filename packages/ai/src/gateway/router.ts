import type { AiProviderId, ModelRoute, RoutingStrategy } from "../types/ai";

/** Curated model catalog for routing + cost estimates. */
export const MODEL_CATALOG: ModelRoute[] = [
  {
    id: "openai:gpt-5.1",
    provider: "openai",
    model: "gpt-5.1",
    capabilities: ["chat", "tools", "json", "streaming"],
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.01,
    priority: 99,
  },
  {
    id: "openai:gpt-5",
    provider: "openai",
    model: "gpt-5",
    capabilities: ["chat", "tools", "json", "streaming"],
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.01,
    priority: 97,
  },
  {
    id: "openai:gpt-5-mini",
    provider: "openai",
    model: "gpt-5-mini",
    capabilities: ["chat", "tools", "json", "streaming"],
    costPer1kInput: 0.00025,
    costPer1kOutput: 0.002,
    priority: 86,
  },
  {
    id: "openai:gpt-5-nano",
    provider: "openai",
    model: "gpt-5-nano",
    capabilities: ["chat", "tools", "json", "streaming"],
    costPer1kInput: 0.00005,
    costPer1kOutput: 0.0004,
    priority: 78,
  },
  {
    id: "openai:gpt-4o-mini",
    provider: "openai",
    model: "gpt-4o-mini",
    capabilities: ["chat", "tools", "json", "streaming"],
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
    priority: 80,
  },
  {
    id: "openai:gpt-4o",
    provider: "openai",
    model: "gpt-4o",
    capabilities: ["chat", "tools", "json", "streaming", "vision"],
    costPer1kInput: 0.0025,
    costPer1kOutput: 0.01,
    priority: 95,
  },
  {
    id: "openai:text-embedding-3-small",
    provider: "openai",
    model: "text-embedding-3-small",
    capabilities: ["embeddings"],
    costPer1kInput: 0.00002,
    costPer1kOutput: 0,
    priority: 70,
  },
  {
    id: "anthropic:claude-sonnet-4-5",
    provider: "anthropic",
    model: "claude-sonnet-4-5-20250929",
    capabilities: ["chat", "tools", "json", "streaming"],
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    priority: 98,
  },
  {
    id: "anthropic:claude-haiku-4-5",
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    capabilities: ["chat", "tools", "json", "streaming"],
    costPer1kInput: 0.001,
    costPer1kOutput: 0.005,
    priority: 85,
  },
  {
    id: "gemini:gemini-2.5-flash",
    provider: "gemini",
    model: "gemini-2.5-flash",
    capabilities: ["chat", "tools", "json", "streaming", "embeddings"],
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
    priority: 88,
  },
  {
    id: "gemini:text-embedding-004",
    provider: "gemini",
    model: "text-embedding-004",
    capabilities: ["embeddings"],
    costPer1kInput: 0.00001,
    costPer1kOutput: 0,
    priority: 70,
  },
  {
    id: "groq:llama-3.3-70b",
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    capabilities: ["chat", "tools", "json", "streaming"],
    costPer1kInput: 0.00059,
    costPer1kOutput: 0.00079,
    priority: 90,
  },
  {
    id: "groq:llama-3.1-8b",
    provider: "groq",
    model: "llama-3.1-8b-instant",
    capabilities: ["chat", "json", "streaming"],
    costPer1kInput: 0.00005,
    costPer1kOutput: 0.00008,
    priority: 75,
  },
];

export function getModelRoute(model: string): ModelRoute | undefined {
  return MODEL_CATALOG.find((route) => route.model === model || route.id === model);
}

export function listModels(provider?: AiProviderId): ModelRoute[] {
  return provider
    ? MODEL_CATALOG.filter((route) => route.provider === provider)
    : [...MODEL_CATALOG];
}

export function resolveRoute(input: {
  model?: string;
  provider?: AiProviderId;
  strategy?: RoutingStrategy;
  capability?: ModelRoute["capabilities"][number];
}): ModelRoute {
  if (input.model) {
    const explicit = getModelRoute(input.model);
    if (explicit) {
      return explicit;
    }
    return {
      id: `${input.provider ?? "openai"}:${input.model}`,
      provider: input.provider ?? "openai",
      model: input.model,
      capabilities: ["chat", "streaming"],
      costPer1kInput: 0,
      costPer1kOutput: 0,
      priority: 50,
    };
  }

  const capability = input.capability ?? "chat";
  let candidates = MODEL_CATALOG.filter((route) =>
    route.capabilities.includes(capability),
  );

  if (input.provider) {
    candidates = candidates.filter((route) => route.provider === input.provider);
  }

  if (candidates.length === 0) {
    throw new Error(`No models available for capability=${capability}`);
  }

  const strategy = input.strategy ?? "balanced";

  switch (strategy) {
    case "cheapest":
      return [...candidates].sort(
        (a, b) =>
          a.costPer1kInput +
          a.costPer1kOutput -
          (b.costPer1kInput + b.costPer1kOutput),
      )[0]!;
    case "fastest":
      return (
        candidates.find((route) => route.provider === "groq") ??
        [...candidates].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0]!
      );
    case "quality":
      return [...candidates].sort(
        (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
      )[0]!;
    case "explicit":
    case "balanced":
    default:
      return [...candidates].sort((a, b) => {
        const scoreA =
          (a.priority ?? 0) - (a.costPer1kInput + a.costPer1kOutput) * 1000;
        const scoreB =
          (b.priority ?? 0) - (b.costPer1kInput + b.costPer1kOutput) * 1000;
        return scoreB - scoreA;
      })[0]!;
  }
}
