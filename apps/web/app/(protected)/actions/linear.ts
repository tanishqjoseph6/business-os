"use server";

export async function listLinearDataAction(input?: unknown) {
  const mod = await import("../../../lib/linear-actions.server");
  return mod.listLinearDataAction(input);
}

export async function getLinearIssueAction(issueId: string) {
  const mod = await import("../../../lib/linear-actions.server");
  return mod.getLinearIssueAction(issueId);
}

export async function createLinearIssueAction(input: unknown) {
  const mod = await import("../../../lib/linear-actions.server");
  return mod.createLinearIssueAction(input);
}

export async function updateLinearIssueAction(input: unknown) {
  const mod = await import("../../../lib/linear-actions.server");
  return mod.updateLinearIssueAction(input);
}
