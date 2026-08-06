import "server-only";

import {
  exchangeGoogleOAuthCode,
  fetchGoogleOAuthProfile,
  refreshGoogleOAuthToken,
} from "@repo/ai";
import {
  getDecryptedIntegrationTokens,
  upsertIntegrationTokens,
} from "@repo/database/integration-tokens";
import type { IntegrationAccount } from "@repo/types";

export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "email",
  "profile",
] as const;

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export type GoogleCalendar = {
  id: string;
  summary: string;
  description?: string | null;
  timeZone?: string | null;
  primary?: boolean;
  accessRole?: string | null;
};

export type GoogleCalendarEvent = {
  id: string;
  calendarId: string;
  summary: string;
  description: string | null;
  location: string | null;
  htmlLink: string | null;
  status: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  attendees: Array<{
    email?: string;
    displayName?: string;
    responseStatus?: string;
  }>;
};

type GoogleEventPayload = {
  summary?: string;
  description?: string | null;
  location?: string | null;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: Array<{ email: string }>;
};

export async function refreshCalendarAccessToken(
  account: IntegrationAccount,
): Promise<{ accessToken: string; refreshToken: string | null }> {
  const tokens = await getDecryptedIntegrationTokens({ accountId: account.id });
  if (!tokens) throw new Error("Google Calendar tokens were not found");
  if (
    tokens.expiresAt &&
    new Date(tokens.expiresAt).getTime() > Date.now() + 60_000
  ) {
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }
  if (!tokens.refreshToken) {
    throw new Error("Google Calendar has expired. Please reconnect it.");
  }
  const refreshed = await refreshGoogleOAuthToken(tokens.refreshToken);
  await upsertIntegrationTokens({
    workspaceId: account.workspaceId,
    accountId: account.id,
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    expiresAt: refreshed.expiresAt,
    tokenType: refreshed.tokenType,
  });
  return {
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
  };
}

async function calendarFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${CALENDAR_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as T & {
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(
      `Google Calendar request failed: ${data.error?.message ?? response.statusText}`,
    );
  }
  return data;
}

export async function exchangeCalendarCode(input: {
  code: string;
  redirectUri: string;
}) {
  return exchangeGoogleOAuthCode({
    ...input,
    scopes: [...GOOGLE_CALENDAR_SCOPES],
  });
}

export { fetchGoogleOAuthProfile };

export async function listGoogleCalendars(
  accessToken: string,
): Promise<GoogleCalendar[]> {
  const calendars: GoogleCalendar[] = [];
  let pageToken: string | undefined;
  do {
    const query = new URLSearchParams({ maxResults: "250" });
    if (pageToken) query.set("pageToken", pageToken);
    const data = await calendarFetch<{
      items?: GoogleCalendar[];
      nextPageToken?: string;
    }>(accessToken, `/users/me/calendarList?${query}`);
    calendars.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return calendars;
}

export async function listGoogleCalendarEvents(input: {
  accessToken: string;
  calendarId: string;
  query?: string;
  timeMin?: string;
  timeMax?: string;
}): Promise<GoogleCalendarEvent[]> {
  const events: GoogleCalendarEvent[] = [];
  let pageToken: string | undefined;
  do {
    const query = new URLSearchParams({
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "2500",
      ...(input.timeMin ? { timeMin: input.timeMin } : {}),
      ...(input.timeMax ? { timeMax: input.timeMax } : {}),
      ...(input.query ? { q: input.query } : {}),
    });
    if (pageToken) query.set("pageToken", pageToken);
    const data = await calendarFetch<{
      items?: GoogleCalendarEvent[];
      nextPageToken?: string;
    }>(
      input.accessToken,
      `/calendars/${encodeURIComponent(input.calendarId)}/events?${query}`,
    );
    events.push(
      ...(data.items ?? []).map((event) => ({
        ...event,
        calendarId: input.calendarId,
        description: event.description ?? null,
        location: event.location ?? null,
        htmlLink: event.htmlLink ?? null,
        attendees: event.attendees ?? [],
      })),
    );
    pageToken = data.nextPageToken;
  } while (pageToken);
  return events;
}

export async function listUpcomingGoogleCalendarEvents(input: {
  accessToken: string;
  query?: string;
  timeMin?: string;
  timeMax?: string;
}) {
  const calendars = await listGoogleCalendars(input.accessToken);
  const events = (
    await Promise.all(
      calendars
        .filter((calendar) => calendar.accessRole !== "freeBusyReader")
        .map((calendar) =>
          listGoogleCalendarEvents({
            accessToken: input.accessToken,
            calendarId: calendar.id,
            query: input.query,
            timeMin: input.timeMin,
            timeMax: input.timeMax,
          }),
        ),
    )
  ).flat();
  return { calendars, events };
}

export async function createGoogleCalendarEvent(input: {
  accessToken: string;
  calendarId: string;
  event: GoogleEventPayload;
}) {
  return calendarFetch<GoogleCalendarEvent>(
    input.accessToken,
    `/calendars/${encodeURIComponent(input.calendarId)}/events`,
    { method: "POST", body: JSON.stringify(input.event) },
  );
}

export async function updateGoogleCalendarEvent(input: {
  accessToken: string;
  calendarId: string;
  eventId: string;
  event: GoogleEventPayload;
}) {
  return calendarFetch<GoogleCalendarEvent>(
    input.accessToken,
    `/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`,
    { method: "PATCH", body: JSON.stringify(input.event) },
  );
}

export async function deleteGoogleCalendarEvent(input: {
  accessToken: string;
  calendarId: string;
  eventId: string;
}) {
  await calendarFetch<unknown>(
    input.accessToken,
    `/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`,
    { method: "DELETE" },
  );
}
