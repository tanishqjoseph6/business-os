export type * from "./types";
export {
  toAiMessages,
  ensureSystemMessage,
  visibleChatMessages,
  truncateForTitle,
} from "./messages";
export type { StoredChatMessage } from "./messages";
export {
  buildChatContext,
  buildChatSystemPrompt,
  buildGatewayMessages,
  resolveModelSelection,
} from "./context";
export {
  listChatModels,
  groupChatModelsByProvider,
  formatModelLabel,
  createChatGateway,
  createChatSessionDeps,
} from "./session";
export type { ChatSessionDeps } from "./session";
export {
  KAIROS_CHAT_MODELS,
  KAIROS_CHAT_MODEL_IDS,
  KAIROS_DEFAULT_MODEL,
  KAIROS_DEFAULT_PLAN,
  KAIROS_MODEL_GROUPS,
  KAIROS_MODEL_STORAGE_KEY,
  KAIROS_PLAN_MODEL_ALLOWLIST,
  KAIROS_UPGRADE_MESSAGE,
  listKairosChatModels,
  parseKairosChatModelId,
  parseKairosPlanId,
  isKairosChatModelId,
  isKairosPlanId,
  isKairosModelAllowedForPlan,
  authorizeKairosChatModel,
  clampKairosModelToPlan,
  requiredPlanForKairosModel,
  resolveKairosApiModel,
  routeKairosAuto,
  kairosModelDisplayName,
  classifyKairosProviderError,
  getKairosChatModel,
} from "./kairos-models";
export type {
  KairosChatModelId,
  KairosChatModelOption,
  KairosChatErrorCode,
  KairosResolvedModelId,
  KairosPlanId,
  KairosModelAuthorization,
  KairosModelGroupId,
} from "./kairos-models";
export {
  encodeSseEvent,
  chatEventsToReadableStream,
  createSseResponse,
  streamGatewayToChatEvents,
} from "./streaming";
export {
  createChatService,
  type ChatRepository,
  type CreditRepository,
  type ChatServiceDeps,
} from "./service";
