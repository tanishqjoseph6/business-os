export type Id = string;

export type Timestamps = {
  createdAt: string;
  updatedAt: string;
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export type {
  AppRole,
  AuthProvider,
  AuthUser,
  AuthSession,
  Profile,
  Organization,
  OrganizationMember,
  UserRoleRecord,
} from "./auth";

export type {
  WorkspaceRole,
  InvitationStatus,
  Workspace,
  WorkspaceMember,
  WorkspaceMemberWithProfile,
  Invitation,
  WorkspaceMembership,
  CreateWorkspaceInput,
  InviteMemberInput,
  UpdateWorkspaceInput,
  TransferOwnershipInput,
  DeleteWorkspaceInput,
} from "./workspace";

export {
  workspaceRoleSchema,
  invitationStatusSchema,
  createWorkspaceSchema,
  inviteMemberSchema,
  updateWorkspaceSchema,
  transferOwnershipSchema,
  deleteWorkspaceSchema,
  WORKSPACE_COOKIE,
  slugifyWorkspaceName,
} from "./workspace";

export type {
  PlatformModule,
  WorkspaceNotificationType,
  WorkspaceNotification,
  WorkspaceActivityEvent,
  WorkspaceAiMemory,
  DashboardInsight,
  DashboardConversationItem,
  DashboardLeadItem,
  DashboardDealItem,
  DashboardPipelineStage,
  DashboardContentItem,
  DashboardAgendaItem,
  DashboardSnapshot,
  CreateWorkspaceNotificationInput,
  CreateWorkspaceActivityEventInput,
  CreateWorkspaceAiMemoryInput,
} from "./platform";

export {
  platformModuleSchema,
  workspaceNotificationTypeSchema,
  createWorkspaceNotificationSchema,
  markWorkspaceNotificationReadSchema,
  createWorkspaceActivityEventSchema,
  createWorkspaceAiMemorySchema,
} from "./platform";

export type {
  NotificationCategory,
  NotificationPriority,
  NotificationDeliveryChannel,
  NotificationSection,
  UserNotificationPreferences,
  UserNotificationState,
  NotificationListItem,
  NotificationTemplate,
  DeliveryQueueItem,
  ListNotificationsInput,
  UpdateNotificationPreferencesInput,
} from "./notifications";

export {
  notificationCategorySchema,
  notificationPrioritySchema,
  notificationDeliveryChannelSchema,
  notificationSectionSchema,
  listNotificationsSchema,
  markNotificationReadSchema,
  archiveNotificationSchema,
  deleteNotificationSchema,
  updateNotificationPreferencesSchema,
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_SECTION_CATEGORIES,
} from "./notifications";

export type {
  WorkspaceSecuritySettings,
  WorkspaceApiKey,
  UserLoginHistoryItem,
  UserDeviceSession,
  SecurityAuditLogItem,
  CreateWorkspaceApiKeyInput,
  UpdateWorkspaceSecuritySettingsInput,
} from "./security-platform";

export {
  createWorkspaceApiKeySchema,
  revokeWorkspaceApiKeySchema,
  revokeDeviceSessionSchema,
  updateWorkspaceSecuritySettingsSchema,
} from "./security-platform";

export type {
  KairosAgentId,
  WorkspaceAiSettings,
  KairosAgentRun,
  AiOutputVersion,
  WorkspaceOnboardingProgress,
  WorkspaceAiSuggestion,
  UpdateWorkspaceAiMemoryInput,
  CreateKairosAgentRunInput,
  CreateAiOutputVersionInput,
} from "./kairos-platform";

export {
  kairosAgentIdSchema,
  updateWorkspaceAiMemorySchema,
  deleteWorkspaceAiMemorySchema,
  setWorkspaceMemoryEnabledSchema,
  createKairosAgentRunSchema,
  createAiOutputVersionSchema,
  renameAiOutputVersionSchema,
  restoreAiOutputVersionSchema,
  completeOnboardingStepSchema,
  dismissAiSuggestionSchema,
} from "./kairos-platform";

export type {
  WorkspaceTemplateKey,
  BetaEventCategory,
  WorkspaceBetaLaunchProfile,
  BetaAnalyticsEvent,
  BetaReleaseNote,
  TrackBetaAnalyticsEventInput,
  UpsertWorkspaceBetaProfileInput,
} from "./beta-launch";

export {
  workspaceTemplateKeySchema,
  betaEventCategorySchema,
  trackBetaAnalyticsEventSchema,
  upsertWorkspaceBetaProfileSchema,
  seedDemoWorkspaceSchema,
} from "./beta-launch";

export type {
  ContentType,
  ContentStatus,
  ContentAnalytics,
  ContentItem,
  ContentBrandVoice,
  ContentAsset,
  ContentTemplate,
  ContentDashboardStats,
  CreateContentItemInput,
  UpdateContentItemInput,
  GenerateContentInput,
  UpdateBrandVoiceInput,
} from "./content";

export {
  contentTypeSchema,
  contentStatusSchema,
  createContentItemSchema,
  updateContentItemSchema,
  generateContentSchema,
  updateBrandVoiceSchema,
} from "./content";

export type {
  SocialPlatform,
  SocialPostStatus,
  SocialApprovalStatus,
  SocialAccount,
  SocialPostAnalytics,
  SocialPost,
  SocialEngagement,
  SocialAnalytics,
  SocialDashboardStats,
  CreateSocialPostInput,
  UpdateSocialPostInput,
  GenerateSocialInput,
} from "./social";

export {
  socialPlatformSchema,
  socialPostStatusSchema,
  socialApprovalStatusSchema,
  createSocialPostSchema,
  updateSocialPostSchema,
  generateSocialSchema,
} from "./social";

export type {
  WebsiteProjectType,
  WebsiteProject,
  WebsiteBlock,
  WebsitePage,
  WebsiteLink,
  WebsiteForm,
  WebsiteDomain,
  WebsiteDashboardStats,
  WebsiteBlueprint,
  WebsiteBlueprintPage,
  WebsiteBlueprintBlock,
  CreateWebsiteProjectInput,
  GenerateWebsiteInput,
  RefineWebsiteInput,
  ImproveWebsiteInput,
  PublishWebsiteInput,
} from "./website";

export {
  websiteProjectTypeSchema,
  createWebsiteProjectSchema,
  generateWebsiteSchema,
  refineWebsiteSchema,
  improveWebsiteSchema,
  publishWebsiteSchema,
  websiteBlueprintSchema,
} from "./website";

export type {
  CalendarBookingLink,
  CalendarAvailability,
  CalendarMeetingNote,
  CalendarDashboardStats,
  CreateBookingLinkInput,
  UpdateAvailabilityInput,
} from "./calendar";
export {
  createBookingLinkSchema,
  updateAvailabilitySchema,
  meetingSummarySchema,
} from "./calendar";

export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./database";

export type {
  ChatProviderId,
  ChatMessageRole,
  ChatConversation,
  ChatMessage,
  WorkspaceCredits,
  CreditTransaction,
} from "./chat";

export {
  chatProviderSchema,
  kairosChatModelSchema,
  createConversationSchema,
  renameConversationSchema,
  chatStreamRequestSchema,
  pinConversationSchema,
  deleteConversationSchema,
  searchConversationsSchema,
} from "./chat";

export type {
  KairosCustomerContext,
  KairosSelectedRecord,
  KairosMemoryContext,
  KairosMemoryRecord,
  KairosSemanticSearchAdapter,
} from "./kairos-memory";

export type {
  CrmLifecycleStage,
  CrmDealStage,
  CrmActivityType,
  CrmEntityType,
  CrmPriority,
  CrmTaskStatus,
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmActivity,
  CrmNote,
  CrmTag,
  CrmTagging,
  CrmTimelineItem,
  CrmDashboardStats,
  CrmTask,
  CrmPipeline,
  CrmPipelineStage,
  CrmSettings,
  CrmReportSnapshot,
} from "./crm";

export {
  crmLifecycleStageSchema,
  crmDealStageSchema,
  crmActivityTypeSchema,
  crmEntityTypeSchema,
  crmPrioritySchema,
  crmTaskStatusSchema,
  createCompanySchema,
  updateCompanySchema,
  createContactSchema,
  updateContactSchema,
  createLeadSchema,
  createDealSchema,
  updateDealSchema,
  createActivitySchema,
  updateActivitySchema,
  createNoteSchema,
  createTagSchema,
  assignTagSchema,
  crmSearchSchema,
  deleteCrmEntitySchema,
  createCrmTaskSchema,
  updateCrmTaskSchema,
  createPipelineStageSchema,
  updateCrmSettingsSchema,
} from "./crm";

export type {
  FinanceInvoiceStatus,
  FinanceExpenseStatus,
  FinanceTransactionType,
  FinanceInvoiceItem,
  FinanceInvoice,
  FinanceExpense,
  FinanceTransaction,
  FinanceMonthlyPoint,
  FinanceDashboardStats,
  FinanceCustomer,
  FinanceVendor,
  FinanceBudget,
  FinanceCashFlowEntry,
  FinanceReport,
  FinanceSettings,
  FinanceCashFlowPoint,
} from "./finance";

export {
  financeInvoiceStatusSchema,
  financeExpenseStatusSchema,
  financeTransactionTypeSchema,
  financeSearchSchema,
} from "./finance";

export type {
  FeedbackCategory,
  FeedbackPriority,
  FeedbackStatus,
  FeedbackItem,
  FeedbackVote,
  CreateFeedbackInput,
  UpdateFeedbackStatusInput,
  ListFeedbackInput,
} from "./feedback";

export {
  feedbackCategorySchema,
  feedbackPrioritySchema,
  feedbackStatusSchema,
  createFeedbackSchema,
  updateFeedbackStatusSchema,
  listFeedbackSchema,
  voteFeedbackSchema,
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_PRIORITY_LABELS,
  ROADMAP_STATUSES,
} from "./feedback";

export type {
  InboxProvider,
  InboxAccountStatus,
  InboxThreadStatus,
  InboxMessageDirection,
  InboxTaskStatus,
  InboxParticipant,
  InboxAccount,
  InboxThread,
  InboxMessage,
  InboxLabel,
  InboxAttachment,
  InboxTask,
  InboxCalendarEvent,
  InboxThreadDetail,
  InboxDashboardStats,
  EmailSummaryPriority,
  EmailThreadSummary,
  SmartReplyStyle,
  SmartReplyStatus,
  InboxAiReplyDraft,
} from "./inbox";

export {
  inboxProviderSchema,
  inboxAccountStatusSchema,
  inboxThreadStatusSchema,
  inboxMessageDirectionSchema,
  inboxTaskStatusSchema,
  emailSummaryPrioritySchema,
  emailThreadSummarySchema,
  smartReplyStyleSchema,
  smartReplyStatusSchema,
  connectInboxAccountSchema,
  inboxSearchSchema,
  archiveThreadSchema,
  replyThreadSchema,
  summarizeThreadSchema,
  generateSmartReplySchema,
  updateSmartReplyDraftSchema,
  sendSmartReplySchema,
  listSmartReplyDraftsSchema,
  createInboxTaskSchema,
  scheduleMeetingSchema,
  createInboxLabelSchema,
  assignInboxLabelSchema,
  seedDemoInboxSchema,
} from "./inbox";

export type {
  GmailPriority,
  GmailClassification,
  GmailSuggestedAction,
  InboxAccountSecrets,
  GmailSyncPhase,
  GmailSyncProgress,
  GmailSyncProgressError,
  GmailSyncProgressStatus,
  GmailSyncResult,
} from "./gmail";

export {
  gmailPrioritySchema,
  gmailClassificationSchema,
  startGmailOAuthSchema,
  gmailSyncSchema,
  gmailSendSchema,
  gmailReplySchema,
  gmailForwardSchema,
  gmailThreadActionSchema,
  gmailStarSchema,
  gmailReadStateSchema,
  gmailMoveLabelsSchema,
  gmailCreateDraftSchema,
  gmailSearchSchema,
  gmailCreateLeadSchema,
} from "./gmail";

export type {
  IntegrationConnectionStatus,
  IntegrationActivityEvent,
  IntegrationSyncJobStatus,
  IntegrationHubCategory,
  IntegrationCatalogItem,
  IntegrationAccount,
  IntegrationActivity,
  IntegrationSyncJob,
  IntegrationHubCard,
} from "./integrations";

export {
  integrationConnectionStatusSchema,
  integrationActivityEventSchema,
  integrationSyncJobStatusSchema,
  integrationHubCategorySchema,
  startIntegrationOAuthSchema,
  disconnectIntegrationSchema,
  updateIntegrationSettingsSchema,
  manualSyncIntegrationSchema,
  listIntegrationsSchema,
} from "./integrations";

export type {
  ProjectStatus,
  ProjectPriority,
  ProjectTaskStatus,
  Project,
  ProjectTask,
  ProjectSubtask,
  ProjectMember,
  ProjectLabel,
  ProjectComment,
  ProjectTimeLog,
  ProjectReport,
  ProjectSettings,
  ProjectDashboardStats,
  ProjectReportSnapshot,
} from "./projects";

export {
  projectStatusSchema,
  projectPrioritySchema,
  projectTaskStatusSchema,
  createProjectSchema,
  updateProjectSchema,
  createProjectTaskSchema,
  updateProjectTaskSchema,
  createSubtaskSchema,
  updateProjectSettingsSchema,
  createTimeLogSchema,
} from "./projects";

export type {
  DocumentStatus,
  DocumentSharePermission,
  KnowledgeCategory,
  DocFolder,
  WorkspaceDocument,
  DocumentVersion,
  DocumentComment,
  DocumentShare,
  KnowledgeArticle,
  DocumentSettings,
  DocumentsDashboardStats,
} from "./documents";

export {
  documentStatusSchema,
  documentSharePermissionSchema,
  knowledgeCategorySchema,
  createFolderSchema,
  updateFolderSchema,
  createDocumentSchema,
  updateDocumentSchema,
  createDocumentCommentSchema,
  createDocumentShareSchema,
  createKnowledgeArticleSchema,
  updateDocumentSettingsSchema,
} from "./documents";

export type { CalendarEventStatus, CalendarEventPriority, CalendarIntegrationProvider, CalendarEvent, CalendarMeeting, CalendarParticipant, CalendarReminder, CalendarIntegration, CalendarWorkingAvailability, CalendarSettings, CalendarOverview } from "./calendar-module";
export { calendarEventStatusSchema, calendarEventPrioritySchema, calendarIntegrationProviderSchema, createCalendarEventSchema, updateCalendarEventSchema, createCalendarReminderSchema, createCalendarMeetingSchema, updateCalendarAvailabilitySchema } from "./calendar-module";
export type { AnalyticsWidgetType, AnalyticsDashboard, AnalyticsWidget, AnalyticsReport, SavedAnalyticsReport, AiInsight, AnalyticsForecast, ExecutiveAnalytics } from "./analytics";
export { analyticsWidgetTypeSchema, createAnalyticsDashboardSchema, createAnalyticsReportSchema } from "./analytics";
