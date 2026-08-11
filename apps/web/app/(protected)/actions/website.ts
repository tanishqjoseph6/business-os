"use server";

import {
  createWebsiteProject,
  updateWebsiteProject,
} from "@repo/database/website";
import {
  generateWebsiteSchema,
  improveWebsiteSchema,
  publishWebsiteSchema,
  refineWebsiteSchema,
  type WebsiteBlueprint,
} from "@repo/types";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import {
  generateWebsiteBlueprint,
  improveWebsiteBlueprint,
  refineWebsiteBlueprint,
} from "../../../lib/website-ai";

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "site"
  );
}

function publicError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  const message = error.message.toLowerCase();
  if (
    message.includes("api key") ||
    message.includes("unauthorized") ||
    message.includes("quota") ||
    message.includes("rate")
  ) {
    return "AI generation is temporarily unavailable. Please try again in a moment.";
  }
  return fallback;
}

export async function generateWebsiteAction(input: unknown) {
  const parsed = generateWebsiteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const context = await resolveActiveWorkspace();
  if (!context) return { ok: false as const, error: "Workspace required" };

  try {
    const blueprint = await generateWebsiteBlueprint(parsed.data);
    const name = parsed.data.name?.trim() || blueprint.name;
    const projectType = blueprint.projectType || parsed.data.projectType;
    const project = await createWebsiteProject({
      workspaceId: context.active.workspace.id,
      userId: context.userId,
      name,
      projectType,
      template: parsed.data.template,
      slug: `${slugify(name)}-${Date.now().toString(36)}`,
      theme: blueprint.theme as unknown as Record<string, unknown>,
      settings: {
        blueprint,
        brief: parsed.data.prompt,
        generatedAt: new Date().toISOString(),
      },
    });
    return {
      ok: true as const,
      data: { id: project.id, blueprint, status: project.status },
    };
  } catch (error) {
    return {
      ok: false as const,
      error: publicError(error, "Failed to generate website. Please try again."),
    };
  }
}

export async function refineWebsiteAction(input: unknown) {
  const parsed = refineWebsiteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const context = await resolveActiveWorkspace();
  if (!context) return { ok: false as const, error: "Workspace required" };

  try {
    const blueprint = await refineWebsiteBlueprint({
      blueprint: parsed.data.blueprint,
      instruction: parsed.data.instruction,
    });
    await updateWebsiteProject({
      workspaceId: context.active.workspace.id,
      projectId: parsed.data.projectId,
      name: blueprint.name,
      theme: blueprint.theme as unknown as Record<string, unknown>,
      settings: {
        blueprint,
        lastInstruction: parsed.data.instruction,
        updatedAt: new Date().toISOString(),
      },
    });
    return { ok: true as const, data: { blueprint } };
  } catch (error) {
    return {
      ok: false as const,
      error: publicError(error, "Couldn't apply that edit. Please try again."),
    };
  }
}

export async function improveWebsiteAction(input: unknown) {
  const parsed = improveWebsiteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const context = await resolveActiveWorkspace();
  if (!context) return { ok: false as const, error: "Workspace required" };

  try {
    const blueprint = await improveWebsiteBlueprint({
      blueprint: parsed.data.blueprint,
    });
    await updateWebsiteProject({
      workspaceId: context.active.workspace.id,
      projectId: parsed.data.projectId,
      name: blueprint.name,
      theme: blueprint.theme as unknown as Record<string, unknown>,
      settings: {
        blueprint,
        improvedAt: new Date().toISOString(),
      },
    });
    return { ok: true as const, data: { blueprint } };
  } catch (error) {
    return {
      ok: false as const,
      error: publicError(error, "Couldn't improve the website. Please try again."),
    };
  }
}

export async function publishWebsiteAction(input: unknown) {
  const parsed = publishWebsiteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const context = await resolveActiveWorkspace();
  if (!context) return { ok: false as const, error: "Workspace required" };

  try {
    const project = await updateWebsiteProject({
      workspaceId: context.active.workspace.id,
      projectId: parsed.data.projectId,
      status: "published",
    });
    return {
      ok: true as const,
      data: { id: project.id, status: project.status, slug: project.slug },
    };
  } catch (error) {
    return {
      ok: false as const,
      error: publicError(error, "Couldn't publish the website. Please try again."),
    };
  }
}

export type { WebsiteBlueprint };
