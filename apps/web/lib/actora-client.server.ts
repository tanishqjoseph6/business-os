import "server-only";

const ACTORA_API_BASE_URL = "https://useactora.com/api/v1";

type ActoraApiErrorBody = {
  error?: { code?: string; message?: string };
};

export type ActoraContact = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  title: string;
  companyId: string | null;
  companyName: string | null;
  owner: string;
  status: "active" | "lead" | "inactive";
  aiLeadScore: number;
  createdAt: string;
  updatedAt: string;
};

export type ActoraCompany = {
  id: string;
  name: string;
  industry: string;
  size: "startup" | "smb" | "enterprise";
  status: "active" | "prospect" | "churned";
  website: string;
  address: string;
  notes: string;
  revenue: number;
  employeeCount: number;
  owner: string;
  aiScore: number;
  createdAt: string;
};

export type ActoraDeal = {
  id: string;
  title: string;
  companyId: string | null;
  contactId: string | null;
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  value: number;
  probability: number;
  closeDate: string | null;
  priority: "high" | "medium" | "low";
  owner: string;
  aiScore: number;
  labels: string[];
  lastActivityAt: string;
  createdAt: string;
};

type Collection<T> = {
  data: T[];
  meta: { count: number; limit: number; offset: number };
};

type Resource<T> = { data: T };

function getApiKey(): string {
  const apiKey = process.env.ACTORA_API_KEY?.trim();
  if (!apiKey) throw new Error("Actora API key is not configured");
  return apiKey;
}

function apiError(status: number, body: ActoraApiErrorBody): Error {
  const code = body.error?.code;
  const message = body.error?.message;
  if (status === 401) return new Error("Actora API key is invalid");
  if (status === 403) return new Error(`Actora scope required${code ? `: ${code}` : ""}`);
  if (status === 404) return new Error("Actora resource was not found in the authorized workspace");
  if (status === 429) return new Error("Actora rate limit reached. Try again shortly.");
  if (status >= 500) return new Error("Actora is temporarily unavailable. Try again shortly.");
  return new Error(message || `Actora request failed (${status})`);
}

async function actoraRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; response: Response }> {
  const response = await fetch(`${ACTORA_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${getApiKey()}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as T & ActoraApiErrorBody;
  if (!response.ok) throw apiError(response.status, body);
  return { data: body as T, response };
}

export function getActoraWorkspace() {
  return actoraRequest<unknown>("/workspace");
}

export function listActoraTasks(input?: { status?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (input?.status) params.set("status", input.status);
  if (input?.limit) params.set("limit", String(Math.min(input.limit, 100)));
  const query = params.toString();
  return actoraRequest<unknown>(`/tasks${query ? `?${query}` : ""}`);
}

export function createActoraTask(input: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
}) {
  return actoraRequest<unknown>("/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteActoraTask(id: string) {
  return actoraRequest<unknown>(`/tasks/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

function collectionParams(input?: { limit?: number; offset?: number }) {
  const params = new URLSearchParams();
  if (input?.limit) params.set("limit", String(Math.min(input.limit, 100)));
  if (input?.offset) params.set("offset", String(Math.max(input.offset, 0)));
  return params.toString();
}

export function listActoraContacts(input?: { limit?: number; offset?: number }) {
  const query = collectionParams(input);
  return actoraRequest<Collection<ActoraContact>>(`/contacts${query ? `?${query}` : ""}`);
}

export function getActoraContact(id: string) {
  return actoraRequest<Resource<ActoraContact>>(`/contacts/${encodeURIComponent(id)}`);
}

export function createActoraContact(input: Partial<Omit<ActoraContact, "id" | "createdAt" | "updatedAt">> & { name: string }) {
  return actoraRequest<Resource<ActoraContact>>("/contacts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateActoraContact(id: string, input: Partial<Omit<ActoraContact, "id" | "createdAt" | "updatedAt">>) {
  return actoraRequest<Resource<ActoraContact>>(`/contacts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteActoraContact(id: string) {
  return actoraRequest<Resource<{ deleted: true }>>(`/contacts/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function listActoraCompanies(input?: { limit?: number; offset?: number }) {
  const query = collectionParams(input);
  return actoraRequest<Collection<ActoraCompany>>(`/companies${query ? `?${query}` : ""}`);
}

export function createActoraCompany(input: Partial<Omit<ActoraCompany, "id" | "createdAt">> & { name: string }) {
  return actoraRequest<Resource<ActoraCompany>>("/companies", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateActoraCompany(id: string, input: Partial<Omit<ActoraCompany, "id" | "createdAt">>) {
  return actoraRequest<Resource<ActoraCompany>>(`/companies/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listActoraDeals(input?: { limit?: number; offset?: number }) {
  const query = collectionParams(input);
  return actoraRequest<Collection<ActoraDeal>>(`/deals${query ? `?${query}` : ""}`);
}

export function createActoraDeal(input: Partial<Omit<ActoraDeal, "id" | "lastActivityAt" | "createdAt">> & { title: string }) {
  return actoraRequest<Resource<ActoraDeal>>("/deals", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateActoraDeal(id: string, input: Partial<Omit<ActoraDeal, "id" | "lastActivityAt" | "createdAt">>) {
  return actoraRequest<Resource<ActoraDeal>>(`/deals/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
