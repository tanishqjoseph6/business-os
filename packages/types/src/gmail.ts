import { z } from "zod";

export const gmailPrioritySchema = z.enum([
  "urgent",
  "high",
  "normal",
  "low",
]);
export type GmailPriority = z.infer<typeof gmailPrioritySchema>;

export const gmailClassificationSchema = z.enum([
  "sales",
  "support",
  "billing",
  "partnership",
  "internal",
  "newsletter",
  "personal",
  "other",
]);
export type GmailClassification = z.infer<typeof gmailClassificationSchema>;

export type GmailSuggestedAction = {
  type:
    | "reply"
    | "archive"
    | "create_task"
    | "schedule_meeting"
    | "create_lead"
    | "follow_up";
  label: string;
  confidence: number;
};

/** Server-only secrets — never serialize to the client. */
export type InboxAccountSecrets = {
  id: string;
  workspaceId: string;
  provider: "gmail" | "outlook";
  email: string;
  displayName: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
  scopes: string[];
  status: "connected" | "syncing" | "error" | "disconnected";
  lastSyncedAt: string | null;
  historyId: string | null;
  syncError: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
};

export type GmailSyncPhase =
  | "starting"
  | "labels"
  | "inbox"
  | "sent"
  | "drafts"
  | "trash"
  | "spam"
  | "history"
  | "threads"
  | "ai"
  | "finalizing"
  | "done";

export type GmailSyncProgressStatus =
  | "idle"
  | "running"
  | "completed"
  | "error";

export type GmailSyncProgressError = {
  threadExternalId?: string;
  message: string;
  retries: number;
  at: string;
};

export type GmailSyncProgress = {
  jobId: string;
  status: GmailSyncProgressStatus;
  phase: GmailSyncPhase;
  mode: "full" | "incremental";
  startedAt: string;
  updatedAt: string;
  completedAt?: string | null;
  threadsTotal: number;
  threadsProcessed: number;
  messagesUpserted: number;
  labelsUpserted: number;
  attachmentsUpserted: number;
  summariesGenerated: number;
  tasksCreated: number;
  meetingsScheduled: number;
  linkedContacts: number;
  errors: GmailSyncProgressError[];
  currentThreadSubject?: string | null;
  historyId?: string | null;
};

export type GmailSyncResult = {
  accountId: string;
  mode: "full" | "incremental";
  threadsUpserted: number;
  messagesUpserted: number;
  labelsUpserted: number;
  attachmentsUpserted: number;
  historyId: string | null;
  linkedContacts: number;
  summariesGenerated: number;
  tasksCreated: number;
  meetingsScheduled: number;
  errors: GmailSyncProgressError[];
  progress: GmailSyncProgress;
};

export const startGmailOAuthSchema = z.object({
  // Optional prefill; email comes from Google userinfo after consent.
  displayName: z.string().trim().max(160).optional().nullable(),
  /** Post-OAuth redirect path (must start with `/`). Defaults to inbox accounts. */
  returnTo: z
    .string()
    .trim()
    .regex(/^\/[^\s]*$/, "returnTo must be a relative path")
    .optional()
    .nullable(),
});

export const gmailSyncSchema = z.object({
  accountId: z.string().uuid(),
  full: z.boolean().optional(),
  background: z.boolean().optional(),
});

export const gmailSendSchema = z.object({
  accountId: z.string().uuid(),
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string().trim().min(1).max(998),
  body: z.string().trim().min(1).max(200000),
  threadId: z.string().uuid().optional().nullable(),
  inReplyToExternalId: z.string().optional().nullable(),
});

export const gmailReplySchema = z.object({
  threadId: z.string().uuid(),
  body: z.string().trim().min(1).max(200000),
  replyAll: z.boolean().optional(),
  useSmartReply: z.boolean().optional(),
});

export const gmailForwardSchema = z.object({
  threadId: z.string().uuid(),
  to: z.array(z.string().email()).min(1),
  body: z.string().trim().max(200000).optional(),
});

export const gmailThreadActionSchema = z.object({
  threadId: z.string().uuid(),
});

export const gmailStarSchema = z.object({
  threadId: z.string().uuid(),
  starred: z.boolean(),
});

export const gmailReadStateSchema = z.object({
  threadId: z.string().uuid(),
  unread: z.boolean(),
});

export const gmailMoveLabelsSchema = z.object({
  threadId: z.string().uuid(),
  addLabelIds: z.array(z.string()).optional(),
  removeLabelIds: z.array(z.string()).optional(),
});

export const gmailCreateDraftSchema = z.object({
  accountId: z.string().uuid(),
  to: z.array(z.string().email()).min(1),
  subject: z.string().trim().min(1).max(998),
  body: z.string().trim().min(1).max(200000),
  threadId: z.string().uuid().optional().nullable(),
});

export const gmailSearchSchema = z.object({
  accountId: z.string().uuid().optional(),
  query: z.string().trim().min(1).max(500),
  limit: z.number().int().positive().max(100).optional(),
});

export const gmailCreateLeadSchema = z.object({
  threadId: z.string().uuid(),
});
