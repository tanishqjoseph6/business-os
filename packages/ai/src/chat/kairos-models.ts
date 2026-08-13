import type { AiProviderId } from "../types/ai";

export const KAIROS_CHAT_MODEL_IDS = [
  "auto",
  "gpt-5-nano",
  "gpt-5-mini",
  "gpt-5",
  "gpt-5.1",
] as const;

export type KairosChatModelId = (typeof KAIROS_CHAT_MODEL_IDS)[number];

export type KairosResolvedModelId = Exclude<KairosChatModelId, "auto">;

export type KairosPlanId = "free" | "pro" | "business";

export type KairosModelGroupId = "kairos" | "fast" | "pro";

export type KairosChatModelOption = {
  id: KairosChatModelId;
  label: string;
  description: string;
  icon: string;
  provider: AiProviderId;
  /** API model id. `auto` is resolved server-side. */
  model: KairosChatModelId;
  group: KairosModelGroupId;
  minPlan: KairosPlanId;
};

export const KAIROS_DEFAULT_MODEL: KairosChatModelId = "auto";
export const KAIROS_MODEL_STORAGE_KEY = "kairos-selected-model";
export const KAIROS_DEFAULT_PLAN: KairosPlanId = "free";
export const KAIROS_UPGRADE_MESSAGE =
  "Upgrade to Pro to unlock GPT-5 and GPT-5.1.";

export const KAIROS_PLAN_MODEL_ALLOWLIST: Record<
  KairosPlanId,
  readonly KairosChatModelId[]
> = {
  free: ["auto", "gpt-5-nano", "gpt-5-mini"],
  pro: ["auto", "gpt-5-nano", "gpt-5-mini", "gpt-5", "gpt-5.1"],
  business: ["auto", "gpt-5-nano", "gpt-5-mini", "gpt-5", "gpt-5.1"],
};

export const KAIROS_MODEL_GROUPS: readonly {
  id: KairosModelGroupId;
  label: string;
  modelIds: readonly KairosChatModelId[];
}[] = [
  { id: "kairos", label: "KAIROS", modelIds: ["auto"] },
  { id: "fast", label: "FAST", modelIds: ["gpt-5-nano", "gpt-5-mini"] },
  { id: "pro", label: "PRO", modelIds: ["gpt-5", "gpt-5.1"] },
];

export const KAIROS_CHAT_MODELS: readonly KairosChatModelOption[] = [
  {
    id: "auto",
    model: "auto",
    provider: "openai",
    label: "Kairos Auto",
    description: "Best for most tasks",
    icon: "✨",
    group: "kairos",
    minPlan: "free",
  },
  {
    id: "gpt-5-nano",
    model: "gpt-5-nano",
    provider: "openai",
    label: "Lite",
    description: "GPT-5 nano · Quick answers",
    icon: "💨",
    group: "fast",
    minPlan: "free",
  },
  {
    id: "gpt-5-mini",
    model: "gpt-5-mini",
    provider: "openai",
    label: "Fast",
    description: "GPT-5 mini · Everyday tasks",
    icon: "🚀",
    group: "fast",
    minPlan: "free",
  },
  {
    id: "gpt-5",
    model: "gpt-5",
    provider: "openai",
    label: "Powerful",
    description: "GPT-5 · Complex work",
    icon: "⚡",
    group: "pro",
    minPlan: "pro",
  },
  {
    id: "gpt-5.1",
    model: "gpt-5.1",
    provider: "openai",
    label: "Advanced",
    description: "GPT-5.1 · Deep reasoning",
    icon: "🧠",
    group: "pro",
    minPlan: "pro",
  },
] as const;

const ALLOWLIST = new Set<string>(KAIROS_CHAT_MODEL_IDS);
const PLAN_ALLOWLIST = {
  free: new Set<KairosChatModelId>(KAIROS_PLAN_MODEL_ALLOWLIST.free),
  pro: new Set<KairosChatModelId>(KAIROS_PLAN_MODEL_ALLOWLIST.pro),
  business: new Set<KairosChatModelId>(KAIROS_PLAN_MODEL_ALLOWLIST.business),
} as const;

const PLAN_RANK: Record<KairosPlanId, number> = {
  free: 0,
  pro: 1,
  business: 2,
};

const RESOLVED_MODEL_TIER: readonly KairosResolvedModelId[] = [
  "gpt-5-nano",
  "gpt-5-mini",
  "gpt-5",
  "gpt-5.1",
];

export function isKairosChatModelId(value: unknown): value is KairosChatModelId {
  return typeof value === "string" && ALLOWLIST.has(value);
}

export function isKairosPlanId(value: unknown): value is KairosPlanId {
  return value === "free" || value === "pro" || value === "business";
}

export function parseKairosChatModelId(
  value: unknown,
  fallback: KairosChatModelId = KAIROS_DEFAULT_MODEL,
): KairosChatModelId {
  return isKairosChatModelId(value) ? value : fallback;
}

export function parseKairosPlanId(
  value: unknown,
  fallback: KairosPlanId = KAIROS_DEFAULT_PLAN,
): KairosPlanId {
  return isKairosPlanId(value) ? value : fallback;
}

export function listKairosChatModels(): KairosChatModelOption[] {
  return [...KAIROS_CHAT_MODELS];
}

export function getKairosChatModel(
  id: string | null | undefined,
): KairosChatModelOption | undefined {
  if (!id) return undefined;
  return KAIROS_CHAT_MODELS.find((option) => option.id === id);
}

export function requiredPlanForKairosModel(
  model: KairosChatModelId,
): KairosPlanId {
  return getKairosChatModel(model)?.minPlan ?? "pro";
}

export function isKairosModelAllowedForPlan(
  model: KairosChatModelId,
  plan: KairosPlanId,
): boolean {
  return PLAN_ALLOWLIST[plan].has(model);
}

export function planSatisfiesKairosRequirement(
  plan: KairosPlanId,
  required: KairosPlanId,
): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[required];
}

export type KairosModelAuthorization =
  | { ok: true; model: KairosChatModelId }
  | {
      ok: false;
      code: "upgrade_required";
      requiredPlan: KairosPlanId;
      message: string;
    };

export function authorizeKairosChatModel(
  plan: KairosPlanId,
  requested: string | null | undefined,
): KairosModelAuthorization {
  const model = parseKairosChatModelId(requested, KAIROS_DEFAULT_MODEL);
  if (isKairosModelAllowedForPlan(model, plan)) {
    return { ok: true, model };
  }

  return {
    ok: false,
    code: "upgrade_required",
    requiredPlan: requiredPlanForKairosModel(model),
    message: KAIROS_UPGRADE_MESSAGE,
  };
}

export function clampKairosModelToPlan(
  model: KairosChatModelId,
  plan: KairosPlanId,
): KairosChatModelId {
  return isKairosModelAllowedForPlan(model, plan) ? model : KAIROS_DEFAULT_MODEL;
}

function clampResolvedModelToPlan(
  model: KairosResolvedModelId,
  plan: KairosPlanId,
): KairosResolvedModelId {
  if (isKairosModelAllowedForPlan(model, plan)) {
    return model;
  }

  const requestedTier = RESOLVED_MODEL_TIER.indexOf(model);
  for (let index = requestedTier; index >= 0; index -= 1) {
    const candidate = RESOLVED_MODEL_TIER[index];
    if (candidate && isKairosModelAllowedForPlan(candidate, plan)) {
      return candidate;
    }
  }

  return "gpt-5-nano";
}

/**
 * Deterministic Auto routing. Never random. Never exposed to the browser.
 * Plan is applied last so Free Auto cannot resolve to GPT-5 / GPT-5.1.
 */
export function routeKairosAuto(
  message: string,
  plan: KairosPlanId = KAIROS_DEFAULT_PLAN,
): KairosResolvedModelId {
  const text = message.trim();
  const lower = text.toLowerCase();
  const words = text ? text.split(/\s+/).length : 0;
  const chars = text.length;

  const isGreeting =
    /^(hi|hello|hey|yo|thanks|thank you|ok|okay|yes|no|gm|good morning|good afternoon|good evening)[\s!.?]*$/i.test(
      text,
    );
  const isSimpleRequest =
    /\b(summarize briefly|short summary|tl;dr|format this|rewrite this simply|fix grammar|make this shorter|bullet points|quick question)\b/.test(
      lower,
    );
  const isDeepReasoning =
    /\b(step[- ]by[- ]step|multi[- ]step|reason(ing)?|architect(ure)?|debug|algorithm|trade[- ]?offs?|deep analys|complex workflow|root cause)\b/.test(
      lower,
    );
  const isComplexAnalysis =
    /\b(analys(is|e)|forecast|strateg(y|ic)|optimize|plan a|business case|compare options|evaluate)\b/.test(
      lower,
    ) ||
    words > 180 ||
    chars > 1200;
  const isEverydayBusiness =
    /\b(crm|deal|lead|customer|invoice|email|follow[- ]up|campaign|content|calendar|pipeline|revenue|inbox|meeting|task)\b/.test(
      lower,
    );

  let desired: KairosResolvedModelId;
  if (isDeepReasoning) {
    desired = "gpt-5.1";
  } else if (isComplexAnalysis) {
    desired = "gpt-5";
  } else if (isEverydayBusiness) {
    desired = "gpt-5-mini";
  } else if (isGreeting || isSimpleRequest || (chars < 80 && words <= 12)) {
    desired = "gpt-5-nano";
  } else {
    desired = "gpt-5-mini";
  }

  return clampResolvedModelToPlan(desired, plan);
}

export function resolveKairosApiModel(input: {
  preference?: string | null;
  message: string;
  fallbackPreference?: string | null;
  plan?: KairosPlanId | null;
}): {
  preference: KairosChatModelId;
  apiModel: KairosResolvedModelId;
  provider: AiProviderId;
} {
  const plan = parseKairosPlanId(input.plan, KAIROS_DEFAULT_PLAN);
  const requested = parseKairosChatModelId(
    input.preference ?? input.fallbackPreference,
    KAIROS_DEFAULT_MODEL,
  );
  const preference = clampKairosModelToPlan(requested, plan);
  const apiModel =
    preference === "auto"
      ? routeKairosAuto(input.message, plan)
      : (preference as KairosResolvedModelId);

  return {
    preference,
    apiModel,
    provider: "openai",
  };
}

export function kairosModelDisplayName(model: string | null | undefined): string | null {
  if (!model) return null;
  const option = getKairosChatModel(model);
  if (option) return option.label;
  if (model === "gpt-5.1") return "Advanced";
  if (model === "gpt-5") return "Powerful";
  if (model === "gpt-5-mini") return "Fast";
  if (model === "gpt-5-nano") return "Lite";
  return null;
}

export type KairosChatErrorCode =
  | "model_unavailable"
  | "rate_limited"
  | "upgrade_required"
  | "generic";

export function classifyKairosProviderError(error: unknown): {
  code: KairosChatErrorCode;
  message: string;
} {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (
    lower.includes("rate limit") ||
    lower.includes("too many") ||
    lower.includes("http 429") ||
    /\b429\b/.test(lower)
  ) {
    return {
      code: "rate_limited",
      message:
        "Kairos is receiving a lot of requests right now. Please wait a moment and try again.",
    };
  }

  if (
    lower.includes("model_not_found") ||
    lower.includes("does not exist") ||
    lower.includes("does not have access") ||
    lower.includes("invalid model") ||
    lower.includes("unknown model") ||
    lower.includes("model is not available") ||
    (lower.includes("http 404") && lower.includes("model"))
  ) {
    return {
      code: "model_unavailable",
      message:
        "That model is currently unavailable. Kairos Auto can continue this request.",
    };
  }

  return {
    code: "generic",
    message: "Kairos could not complete that request. Please try again.",
  };
}
