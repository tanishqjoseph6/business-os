"use client";

import { useEffect, useState, useTransition } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import {
  createGoogleCalendarEventAction,
  deleteGoogleCalendarEventAction,
  listGoogleCalendarDataAction,
  syncGoogleCalendarsAction,
  updateGoogleCalendarEventAction,
} from "../../app/(protected)/actions/google-calendar";

type Calendar = { id: string; summary: string; primary?: boolean };
type CalendarEvent = {
  id: string;
  calendarId: string;
  summary: string;
  description: string | null;
  location: string | null;
  htmlLink: string | null;
  status: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
};

function eventDate(event: CalendarEvent) {
  return event.start.dateTime ?? event.start.date ?? "";
}

export function GoogleCalendarPanel() {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function load(search = query) {
    setError(null);
    startTransition(async () => {
      const result = await listGoogleCalendarDataAction({ query: search || undefined });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCalendars(result.data.calendars);
      setEvents(result.data.events);
    });
  }

  useEffect(() => {
    load("");
    // Initial load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function sync() {
    setError(null);
    startTransition(async () => {
      const result = await syncGoogleCalendarsAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCalendars(result.data.calendars);
      setEvents(result.data.events);
    });
  }

  function createEvent() {
    const summary = window.prompt("Event title");
    if (!summary) return;
    const start = window.prompt(
      "Start (ISO date/time, e.g. 2026-08-07T10:00:00+05:30)",
    );
    const end = window.prompt(
      "End (ISO date/time, e.g. 2026-08-07T11:00:00+05:30)",
    );
    if (!start || !end) return;
    const calendarId = calendars.find((calendar) => calendar.primary)?.id ?? calendars[0]?.id;
    if (!calendarId) {
      setError("No writable Google Calendar was found");
      return;
    }
    startTransition(async () => {
      const result = await createGoogleCalendarEventAction({
        calendarId,
        summary,
        start: { dateTime: start },
        end: { dateTime: end },
      });
      if (!result.ok) setError(result.error);
      else load();
    });
  }

  function updateEvent(event: CalendarEvent) {
    const summary = window.prompt("Update event title", event.summary);
    if (!summary || summary === event.summary) return;
    startTransition(async () => {
      const result = await updateGoogleCalendarEventAction({
        calendarId: event.calendarId,
        eventId: event.id,
        summary,
        description: event.description,
        location: event.location,
        start: event.start,
        end: event.end,
      });
      if (!result.ok) setError(result.error);
      else load();
    });
  }

  function deleteEvent(event: CalendarEvent) {
    if (!window.confirm(`Delete “${event.summary}”?`)) return;
    startTransition(async () => {
      const result = await deleteGoogleCalendarEventAction({
        calendarId: event.calendarId,
        eventId: event.id,
      });
      if (!result.ok) setError(result.error);
      else setEvents((current) => current.filter((item) => item.id !== event.id));
    });
  }

  return (
    <Card elevated className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-4">
        <div>
          <CardTitle className="text-base">Upcoming events</CardTitle>
          <CardDescription className="mt-1">
            {calendars.length} calendars · {events.length} events in the next 90 days
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") load();
            }}
            placeholder="Search events…"
            className="h-9 w-44"
          />
          <Button size="sm" variant="secondary" loading={pending} onClick={() => load()}>
            Search
          </Button>
          <Button size="sm" variant="secondary" loading={pending} onClick={sync}>
            Sync all
          </Button>
          <Button size="sm" loading={pending} onClick={createEvent}>
            Create event
          </Button>
        </div>
      </div>

      {error ? (
        <p className="border-b border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-border/70 px-4 py-3">
        {calendars.map((calendar) => (
          <Badge key={calendar.id} variant={calendar.primary ? "accent" : "default"}>
            {calendar.summary}
            {calendar.primary ? " · Primary" : ""}
          </Badge>
        ))}
      </div>

      <ul className="divide-y divide-border/70">
        {events.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-muted">
            No upcoming events match your search.
          </li>
        ) : (
          events.map((event) => (
            <li key={`${event.calendarId}:${event.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{event.summary}</p>
                <p className="text-xs text-secondary">
                  {new Date(eventDate(event)).toLocaleString()}
                  {event.location ? ` · ${event.location}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="secondary" onClick={() => updateEvent(event)}>
                  Update
                </Button>
                <Button size="sm" variant="danger" onClick={() => deleteEvent(event)}>
                  Delete
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
