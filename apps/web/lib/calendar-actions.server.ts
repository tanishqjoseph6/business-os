import "server-only";

import { z } from "zod";
import { getUser } from "@repo/auth/server";
import { getMembershipRole, getIntegrationAccountByProvider } from "@repo/database";
import {
  logIntegrationActivity,
  markIntegrationSynced,
} from "@repo/database/integrations";
import { resolveActiveWorkspace } from "./workspace-context";
import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  listUpcomingGoogleCalendarEvents,
  refreshCalendarAccessToken,
  updateGoogleCalendarEvent,
} from "./google-calendar";

const eventInput = z.object({
  calendarId: z.string().min(1),
  eventId: z.string().optional(),
  summary: z.string().trim().min(1).max(500),
  description: z.string().max(10_000).optional().nullable(),
  location: z.string().max(1_000).optional().nullable(),
  start: z.object({
    dateTime: z.string().optional(),
    date: z.string().optional(),
    timeZone: z.string().optional(),
  }),
  end: z.object({
    dateTime: z.string().optional(),
    date: z.string().optional(),
    timeZone: z.string().optional(),
  }),
  attendees: z.array(z.object({ email: z.string().email() })).optional(),
});

async function requireCalendarContext() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  const context = await resolveActiveWorkspace();
  if (!context) throw new Error("No active workspace");
  const role = await getMembershipRole(context.active.workspace.id, user.id);
  if (!role) throw new Error("Forbidden");
  return { userId: user.id, workspaceId: context.active.workspace.id };
}

async function requireCalendarAccount(workspaceId: string) {
  const account = await getIntegrationAccountByProvider({
    workspaceId,
    provider: "google-calendar",
  });
  if (!account || account.status !== "connected") {
    throw new Error("Connect Google Calendar before using calendar actions");
  }
  const token = await refreshCalendarAccessToken(account);
  return { account, accessToken: token.accessToken };
}

function fail(error: unknown) {
  return {
    ok: false as const,
    error: error instanceof Error ? error.message : "Calendar action failed",
  };
}

export async function listGoogleCalendarData(input?: {
  query?: string;
  timeMin?: string;
  timeMax?: string;
}) {
  try {
    const context = await requireCalendarContext();
    const { accessToken } = await requireCalendarAccount(context.workspaceId);
    return {
      ok: true as const,
      data: await listUpcomingGoogleCalendarEvents({
        accessToken,
        query: input?.query,
        timeMin: input?.timeMin ?? new Date().toISOString(),
        timeMax:
          input?.timeMax ??
          new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(),
      }),
    };
  } catch (error) {
    return fail(error);
  }
}

export async function syncGoogleCalendarsAction() {
  try {
    const context = await requireCalendarContext();
    const { account, accessToken } = await requireCalendarAccount(
      context.workspaceId,
    );
    const data = await listUpcomingGoogleCalendarEvents({
      accessToken,
      timeMin: new Date().toISOString(),
      timeMax: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(),
    });
    await markIntegrationSynced({
      workspaceId: context.workspaceId,
      accountId: account.id,
    });
    await logIntegrationActivity({
      workspaceId: context.workspaceId,
      accountId: account.id,
      provider: "google-calendar",
      eventType: "manual_sync",
      title: "Synced Google Calendars",
      body: `${data.calendars.length} calendars · ${data.events.length} upcoming events`,
      actorId: context.userId,
      metadata: {
        calendarCount: data.calendars.length,
        eventCount: data.events.length,
      },
    });
    return { ok: true as const, data };
  } catch (error) {
    return fail(error);
  }
}

export async function createGoogleCalendarEventAction(input: unknown) {
  try {
    const context = await requireCalendarContext();
    const parsed = eventInput.omit({ eventId: true }).safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message);
    const { account, accessToken } = await requireCalendarAccount(
      context.workspaceId,
    );
    const event = await createGoogleCalendarEvent({
      accessToken,
      calendarId: parsed.data.calendarId,
      event: {
        summary: parsed.data.summary,
        description: parsed.data.description,
        location: parsed.data.location,
        start: parsed.data.start,
        end: parsed.data.end,
        attendees: parsed.data.attendees,
      },
    });
    await logIntegrationActivity({
      workspaceId: context.workspaceId,
      accountId: account.id,
      provider: "google-calendar",
      eventType: "automatic_sync",
      title: "Created Google Calendar event",
      body: event.summary,
      actorId: context.userId,
    });
    return { ok: true as const, data: event };
  } catch (error) {
    return fail(error);
  }
}

export async function updateGoogleCalendarEventAction(input: unknown) {
  try {
    const context = await requireCalendarContext();
    const parsed = eventInput.safeParse(input);
    if (!parsed.success || !parsed.data.eventId) {
      return fail(parsed.success ? "eventId is required" : parsed.error.issues[0]?.message);
    }
    const { accessToken } = await requireCalendarAccount(context.workspaceId);
    const event = await updateGoogleCalendarEvent({
      accessToken,
      calendarId: parsed.data.calendarId,
      eventId: parsed.data.eventId,
      event: {
        summary: parsed.data.summary,
        description: parsed.data.description,
        location: parsed.data.location,
        start: parsed.data.start,
        end: parsed.data.end,
        attendees: parsed.data.attendees,
      },
    });
    return { ok: true as const, data: event };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteGoogleCalendarEventAction(input: unknown) {
  try {
    const context = await requireCalendarContext();
    const parsed = z
      .object({ calendarId: z.string().min(1), eventId: z.string().min(1) })
      .safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message);
    const { accessToken } = await requireCalendarAccount(context.workspaceId);
    await deleteGoogleCalendarEvent({
      accessToken,
      calendarId: parsed.data.calendarId,
      eventId: parsed.data.eventId,
    });
    return { ok: true as const, data: { deleted: true } };
  } catch (error) {
    return fail(error);
  }
}
