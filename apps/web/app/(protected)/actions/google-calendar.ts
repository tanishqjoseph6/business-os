"use server";

export async function listGoogleCalendarDataAction(input?: {
  query?: string;
  timeMin?: string;
  timeMax?: string;
}) {
  const mod = await import("../../../lib/calendar-actions.server");
  return mod.listGoogleCalendarData(input);
}

export async function syncGoogleCalendarsAction() {
  const mod = await import("../../../lib/calendar-actions.server");
  return mod.syncGoogleCalendarsAction();
}

export async function createGoogleCalendarEventAction(input: unknown) {
  const mod = await import("../../../lib/calendar-actions.server");
  return mod.createGoogleCalendarEventAction(input);
}

export async function updateGoogleCalendarEventAction(input: unknown) {
  const mod = await import("../../../lib/calendar-actions.server");
  return mod.updateGoogleCalendarEventAction(input);
}

export async function deleteGoogleCalendarEventAction(input: unknown) {
  const mod = await import("../../../lib/calendar-actions.server");
  return mod.deleteGoogleCalendarEventAction(input);
}
