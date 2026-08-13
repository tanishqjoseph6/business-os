import "server-only";

import { createAdminClient } from "./admin";

export type WorkspacePlanId = "free" | "pro" | "business";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ACTIVE_STATUSES = new Set([
  "active",
  "trialing",
  "on_trial",
  "paid",
]);

type BillingSubscriptionRow = {
  plan_id: string;
  status: string;
  current_period_end: string | null;
  workspace_id: string | null;
  user_id: string;
  updated_at: string;
};

type BillingQuery = {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        order(
          column: string,
          options: { ascending: boolean },
        ): {
          limit(count: number): Promise<{
            data: BillingSubscriptionRow[] | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
};

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function isActiveStatus(status: string): boolean {
  return ACTIVE_STATUSES.has(status.trim().toLowerCase());
}

function isCurrentPeriodOpen(periodEnd: string | null): boolean {
  if (!periodEnd) return true;
  const end = Date.parse(periodEnd);
  if (Number.isNaN(end)) return true;
  return end > Date.now();
}

/**
 * Map stored checkout / provider plan ids onto VanderBase plans.
 * Unknown or numeric provider variant ids stay Free — never invent a paid plan.
 */
export function normalizeWorkspacePlanId(raw: string | null | undefined): WorkspacePlanId {
  if (!raw) return "free";
  const value = raw.trim().toLowerCase();
  if (!value || value === "free" || value === "unknown") return "free";
  if (value === "business" || /(^|[^a-z])business([^a-z]|$)/.test(value)) {
    return "business";
  }
  if (value === "pro" || /(^|[^a-z])pro([^a-z]|$)/.test(value)) {
    return "pro";
  }
  return "free";
}

function highestPlan(plans: WorkspacePlanId[]): WorkspacePlanId {
  if (plans.includes("business")) return "business";
  if (plans.includes("pro")) return "pro";
  return "free";
}

function activePaidPlan(rows: BillingSubscriptionRow[] | null): WorkspacePlanId {
  if (!rows?.length) return "free";
  const active = rows.filter(
    (row) => isActiveStatus(row.status) && isCurrentPeriodOpen(row.current_period_end),
  );
  return highestPlan(active.map((row) => normalizeWorkspacePlanId(row.plan_id)));
}

async function listSubscriptions(
  column: "workspace_id" | "user_id",
  id: string,
): Promise<BillingSubscriptionRow[]> {
  const admin = createAdminClient() as unknown as BillingQuery;
  const { data, error } = await admin
    .from("billing_subscriptions")
    .select("plan_id,status,current_period_end,workspace_id,user_id,updated_at")
    .eq(column, id)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    console.warn("[billing.plan] lookup failed", { column, message: error.message });
    return [];
  }

  return data ?? [];
}

/**
 * Server-side workspace plan from real subscription rows.
 * Defaults to Free when no active subscription exists. Does not use mock billing data.
 */
export async function getWorkspacePlan(input: {
  workspaceId: string;
  userId?: string;
}): Promise<WorkspacePlanId> {
  try {
    if (!isUuid(input.workspaceId)) return "free";

    const workspaceRows = await listSubscriptions("workspace_id", input.workspaceId);
    const workspacePlan = activePaidPlan(workspaceRows);
    if (workspacePlan !== "free") return workspacePlan;

    if (input.userId && isUuid(input.userId)) {
      const userRows = await listSubscriptions("user_id", input.userId);
      const userPlan = activePaidPlan(userRows);
      if (userPlan !== "free") return userPlan;
    }

    return "free";
  } catch (error) {
    console.warn("[billing.plan] unavailable", {
      error: error instanceof Error ? error.message : String(error),
    });
    return "free";
  }
}
