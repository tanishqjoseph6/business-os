/**
 * @repo/ai — reusable AI infrastructure for VanderBase.
 *
 * Provider abstraction, gateway routing, memory, embeddings, vectors,
 * tools, and agent runtime. No product/business features live here.
 */

export type * from "./types/ai";
export { AiProviderError } from "./types/ai";
export {
  aiMessageSchema,
  completionInputSchema,
} from "./types/ai";

export {
  createGateway,
  getModelRoute,
  listModels,
  resolveRoute,
} from "./gateway";
export type { AiGateway, CreateGatewayInput, GatewayCompletionRequest } from "./gateway";
export { MODEL_CATALOG } from "./gateway/router";

export { createOpenAIProvider } from "./providers/openai";
export { createAnthropicProvider } from "./providers/anthropic";
export { createGeminiProvider } from "./providers/gemini";
export { createGroqProvider } from "./providers/groq";
export { normalizeProviderError } from "./providers/errors";

export {
  createTokenCounter,
  estimateTokens,
  estimateChatMessageTokens,
} from "./tokens";
export type { TokenCounter } from "./tokens";
export { createInMemoryAiRateLimiter } from "./rate-limit";
export type { InMemoryAiRateLimiterOptions } from "./rate-limit";

export {
  DEFAULT_SYSTEM_PROMPT,
  JSON_SYSTEM_PROMPT,
  AGENT_SYSTEM_PROMPT,
  buildSystemPrompt,
} from "./prompts/system";
export {
  PROMPT_TEMPLATES,
  renderPromptTemplate,
  getPromptTemplate,
} from "./prompts/templates";
export type { PromptTemplate, PromptTemplateValues } from "./prompts/templates";

export {
  createMemoryStore,
  InMemoryMemoryStore,
  createConversationSession,
  createConversationMemory,
  createWorkspaceMemory,
  scoreFactAgainstQuery,
  createMemoryRetriever,
  createConversationSummarizer,
  estimateMessageTokens,
} from "./memory";
export type {
  ConversationSession,
  ConversationMemory,
  ConversationMemoryOptions,
  WorkspaceMemory,
  WorkspaceMemoryOptions,
  MemoryRetriever,
  MemoryRetrievalOptions,
  KnowledgeRetrieverLike,
  ConversationSummarizer,
  MemoryScope,
  ConversationSummary,
  WorkspaceMemoryFact,
  MemoryCitation,
  RetrievedContext,
  ConversationMemorySnapshot,
  MemoryCleanupResult,
} from "./memory";

export {
  createEmbeddingsClient,
  cosineSimilarity,
} from "./embeddings/embeddings";
export type { EmbeddingsClient } from "./embeddings/embeddings";

export {
  createVectorStore,
  InMemoryVectorStore,
  vectorSearch,
} from "./vector/vector-search";

export {
  createKnowledgeIndex,
  chunkText,
  buildKnowledgeChunks,
  estimateChunkTokens,
  createKnowledgeEmbeddings,
  createKnowledgeRetriever,
} from "./knowledge";
export type {
  KnowledgeIndex,
  CreateKnowledgeIndexInput,
  KnowledgeEmbeddings,
  KnowledgeRetriever,
  KnowledgeStoreLike,
  KnowledgeDocument,
  KnowledgeChunk,
  KnowledgeCitation,
  KnowledgeSearchHit,
  KnowledgeIngestInput,
  ChunkingOptions,
} from "./knowledge";

export {
  ToolRegistry,
  createToolRegistry,
  echoTool,
  createCoreTools,
  createCrmTools,
  registerCrmTools,
  createInboxTools,
  registerInboxTools,
  createGmailTools,
  registerGmailTools,
  defineTool,
  toToolDefinition,
  fromLegacyTool,
  ToolExecutor,
  createToolExecutor,
  InMemoryToolAuditStore,
  formatToolResult,
  validateToolArgs,
  zodToJsonSchema,
  parseToolArguments,
  ToolValidationError,
  assertToolPermissions,
  hasToolPermission,
  filterToolsByPermissions,
  ToolPermissionError,
} from "./tools";
export type {
  RegisteredTool,
  ToolHandler,
  CoreToolDeps,
  CrmToolDeps,
  InboxToolDeps,
  GmailToolDeps,
  ToolExecutionResult,
  ToolExecutionFailure,
  ToolRunOutcome,
  ToolStreamEvent,
  ToolAuditEntry,
  ToolAuditStore,
  ToolPermission,
  ToolExecutionContext,
  WorkspaceRole,
  JsonSchema,
} from "./tools";

export { planAgentSteps } from "./agents/planner";
export { executeAgentPlan } from "./agents/executor";
export {
  createAgentRuntime,
  agentObjectiveSchema,
} from "./agents/runtime";
export type { AgentRuntime } from "./agents/runtime";

export {
  createConsoleLogger,
  withRetry,
  estimateCost,
  emptyUsage,
  emptyCost,
  addUsage,
  addCost,
  messageContentToText,
  createId,
} from "./utils";

export {
  createCreditEngine,
  creditEngine,
} from "./credits/engine";
export type { CreditEngine, CreditDeductionInput } from "./credits/engine";

export * from "./chat";

export {
  createInboxSummarizer,
  createInboxSmartReply,
  detectMeetingIntent,
  createGmailAdapter,
  createOutlookAdapter,
  getMailProviderAdapter,
} from "./inbox";
export type {
  InboxSummarizer,
  InboxSmartReply,
  SmartReplyResult,
  SmartReplyStyle,
  MeetingDetectionResult,
  MailProviderAdapter,
  MailProviderAccount,
  RemoteMailThread,
  InboxProvider,
} from "./inbox";

export * from "./gmail";
export {
  buildGoogleOAuthUrl,
  exchangeGoogleOAuthCode,
  fetchGoogleOAuthProfile,
  getGoogleOAuthCredentials,
  getGoogleOAuthRedirectUri,
  refreshGoogleOAuthToken,
} from "./google/oauth";
export type {
  GoogleOAuthProfile,
  GoogleOAuthTokenSet,
} from "./google/oauth";

export function getAiPackageName(): string {
  return "@repo/ai";
}
