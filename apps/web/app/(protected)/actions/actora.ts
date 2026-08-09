"use server";

export async function listActoraTasksAction(input?: unknown) {
  const mod = await import("../../../lib/actora-actions.server");
  return mod.listActoraTasksAction(input);
}

export async function createActoraTaskAction(input: unknown) {
  const mod = await import("../../../lib/actora-actions.server");
  return mod.createActoraTaskAction(input);
}

export async function deleteActoraTaskAction(id: string) {
  const mod = await import("../../../lib/actora-actions.server");
  return mod.deleteActoraTaskAction(id);
}

export async function listActoraContactsAction(input?: unknown) {
  const mod = await import("../../../lib/actora-actions.server");
  return mod.listActoraContactsAction(input);
}

export async function getActoraContactAction(id: string) {
  const mod = await import("../../../lib/actora-actions.server");
  return mod.getActoraContactAction(id);
}

export async function createActoraContactAction(input: unknown) {
  const mod = await import("../../../lib/actora-actions.server");
  return mod.createActoraContactAction(input);
}

export async function updateActoraContactAction(id: string, input: unknown) {
  const mod = await import("../../../lib/actora-actions.server");
  return mod.updateActoraContactAction(id, input);
}

export async function deleteActoraContactAction(id: string) {
  const mod = await import("../../../lib/actora-actions.server");
  return mod.deleteActoraContactAction(id);
}

export async function listActoraCompaniesAction(input?: unknown) {
  const mod = await import("../../../lib/actora-actions.server");
  return mod.listActoraCompaniesAction(input);
}

export async function createActoraCompanyAction(input: unknown) {
  const mod = await import("../../../lib/actora-actions.server");
  return mod.createActoraCompanyAction(input);
}

export async function updateActoraCompanyAction(id: string, input: unknown) {
  const mod = await import("../../../lib/actora-actions.server");
  return mod.updateActoraCompanyAction(id, input);
}

export async function listActoraDealsAction(input?: unknown) {
  const mod = await import("../../../lib/actora-actions.server");
  return mod.listActoraDealsAction(input);
}

export async function createActoraDealAction(input: unknown) {
  const mod = await import("../../../lib/actora-actions.server");
  return mod.createActoraDealAction(input);
}

export async function updateActoraDealAction(id: string, input: unknown) {
  const mod = await import("../../../lib/actora-actions.server");
  return mod.updateActoraDealAction(id, input);
}
