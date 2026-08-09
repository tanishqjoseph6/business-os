import "server-only";

import { z } from "zod";
import { getUser } from "@repo/auth/server";
import { getIntegrationAccountByProvider } from "@repo/database/integrations";
import { resolveActiveWorkspace } from "./workspace-context";
import {
  createActoraTask,
  deleteActoraTask,
  listActoraTasks,
  createActoraContact,
  deleteActoraContact,
  getActoraContact,
  listActoraContacts,
  updateActoraContact,
  createActoraCompany,
  listActoraCompanies,
  updateActoraCompany,
  createActoraDeal,
  listActoraDeals,
  updateActoraDeal,
} from "./actora-client.server";

const taskInputSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().max(20_000).optional(),
  status: z.string().max(100).optional(),
  priority: z.string().max(100).optional(),
  due_date: z.string().datetime().optional(),
});

const pageSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

const contactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().email().max(320).nullable().optional(),
  phone: z.string().max(80).optional(),
  title: z.string().max(200).optional(),
  companyId: z.string().uuid().nullable().optional(),
  companyName: z.string().max(200).nullable().optional(),
  owner: z.string().max(200).optional(),
  status: z.enum(["active", "lead", "inactive"]).optional(),
  aiLeadScore: z.number().int().min(0).max(100).optional(),
});

const companySchema = z.object({
  name: z.string().trim().min(1).max(200),
  industry: z.string().max(200).optional(),
  size: z.enum(["startup", "smb", "enterprise"]).optional(),
  status: z.enum(["active", "prospect", "churned"]).optional(),
  website: z.string().url().max(2048).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(10_000).optional(),
  revenue: z.number().min(0).optional(),
  employeeCount: z.number().int().min(0).optional(),
  owner: z.string().max(200).optional(),
  aiScore: z.number().int().min(0).max(100).optional(),
});

const dealSchema = z.object({
  title: z.string().trim().min(1).max(200),
  companyId: z.string().uuid().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  stage: z.enum(["lead", "qualified", "proposal", "negotiation", "won", "lost"]).optional(),
  value: z.number().min(0).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  closeDate: z.string().date().nullable().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  owner: z.string().max(200).optional(),
  aiScore: z.number().int().min(0).max(100).optional(),
  labels: z.array(z.string().max(80)).optional(),
});

function uuid(value: string) {
  return z.string().uuid().safeParse(value);
}

async function requireActoraAccess() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  const context = await resolveActiveWorkspace();
  if (!context) throw new Error("No active workspace");
  const account = await getIntegrationAccountByProvider({
    workspaceId: context.active.workspace.id,
    provider: "actora",
  });
  if (!account || account.status !== "connected") {
    throw new Error("Connect Actora before using Actora data");
  }
  return context;
}

export async function listActoraTasksAction(input?: unknown) {
  try {
    await requireActoraAccess();
    const parsed = z.object({
      status: z.string().trim().max(100).optional(),
      limit: z.number().int().min(1).max(100).optional(),
    }).safeParse(input ?? {});
    if (!parsed.success) return { ok: false as const, error: "Invalid task filters" };
    const result = await listActoraTasks(parsed.data);
    return { ok: true as const, data: result.data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Actora request failed" };
  }
}

export async function createActoraTaskAction(input: unknown) {
  try {
    await requireActoraAccess();
    const parsed = taskInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid task" };
    const result = await createActoraTask(parsed.data);
    return { ok: true as const, data: result.data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Actora request failed" };
  }
}

export async function deleteActoraTaskAction(id: string) {
  try {
    await requireActoraAccess();
    const parsed = z.string().uuid().safeParse(id);
    if (!parsed.success) return { ok: false as const, error: "Invalid task ID" };
    const result = await deleteActoraTask(parsed.data);
    return { ok: true as const, data: result.data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Actora request failed" };
  }
}

export async function listActoraContactsAction(input?: unknown) {
  try {
    await requireActoraAccess();
    const parsed = pageSchema.safeParse(input ?? {});
    if (!parsed.success) return { ok: false as const, error: "Invalid contact pagination" };
    return { ok: true as const, data: (await listActoraContacts(parsed.data)).data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Actora request failed" };
  }
}

export async function getActoraContactAction(id: string) {
  try {
    await requireActoraAccess();
    const parsed = uuid(id);
    if (!parsed.success) return { ok: false as const, error: "Invalid contact ID" };
    return { ok: true as const, data: (await getActoraContact(parsed.data)).data.data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Actora request failed" };
  }
}

export async function createActoraContactAction(input: unknown) {
  try {
    await requireActoraAccess();
    const parsed = contactSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid contact" };
    return { ok: true as const, data: (await createActoraContact(parsed.data)).data.data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Actora request failed" };
  }
}

export async function updateActoraContactAction(id: string, input: unknown) {
  try {
    await requireActoraAccess();
    const parsedId = uuid(id);
    const parsed = contactSchema.partial().safeParse(input);
    if (!parsedId.success || !parsed.success) return { ok: false as const, error: "Invalid contact update" };
    return { ok: true as const, data: (await updateActoraContact(parsedId.data, parsed.data)).data.data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Actora request failed" };
  }
}

export async function deleteActoraContactAction(id: string) {
  try {
    await requireActoraAccess();
    const parsed = uuid(id);
    if (!parsed.success) return { ok: false as const, error: "Invalid contact ID" };
    return { ok: true as const, data: (await deleteActoraContact(parsed.data)).data.data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Actora request failed" };
  }
}

export async function listActoraCompaniesAction(input?: unknown) {
  try {
    await requireActoraAccess();
    const parsed = pageSchema.safeParse(input ?? {});
    if (!parsed.success) return { ok: false as const, error: "Invalid company pagination" };
    return { ok: true as const, data: (await listActoraCompanies(parsed.data)).data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Actora request failed" };
  }
}

export async function createActoraCompanyAction(input: unknown) {
  try {
    await requireActoraAccess();
    const parsed = companySchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid company" };
    return { ok: true as const, data: (await createActoraCompany(parsed.data)).data.data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Actora request failed" };
  }
}

export async function updateActoraCompanyAction(id: string, input: unknown) {
  try {
    await requireActoraAccess();
    const parsedId = uuid(id);
    const parsed = companySchema.partial().safeParse(input);
    if (!parsedId.success || !parsed.success) return { ok: false as const, error: "Invalid company update" };
    return { ok: true as const, data: (await updateActoraCompany(parsedId.data, parsed.data)).data.data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Actora request failed" };
  }
}

export async function listActoraDealsAction(input?: unknown) {
  try {
    await requireActoraAccess();
    const parsed = pageSchema.safeParse(input ?? {});
    if (!parsed.success) return { ok: false as const, error: "Invalid deal pagination" };
    return { ok: true as const, data: (await listActoraDeals(parsed.data)).data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Actora request failed" };
  }
}

export async function createActoraDealAction(input: unknown) {
  try {
    await requireActoraAccess();
    const parsed = dealSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid deal" };
    return { ok: true as const, data: (await createActoraDeal(parsed.data)).data.data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Actora request failed" };
  }
}

export async function updateActoraDealAction(id: string, input: unknown) {
  try {
    await requireActoraAccess();
    const parsedId = uuid(id);
    const parsed = dealSchema.partial().safeParse(input);
    if (!parsedId.success || !parsed.success) return { ok: false as const, error: "Invalid deal update" };
    return { ok: true as const, data: (await updateActoraDeal(parsedId.data, parsed.data)).data.data };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Actora request failed" };
  }
}

