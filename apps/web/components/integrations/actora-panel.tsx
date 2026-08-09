"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import {
  createActoraContactAction,
  createActoraTaskAction,
  deleteActoraTaskAction,
  listActoraCompaniesAction,
  listActoraContactsAction,
  listActoraDealsAction,
  listActoraTasksAction,
  updateActoraContactAction,
} from "../../app/(protected)/actions/actora";
import type { ActoraCompany, ActoraContact, ActoraDeal } from "../../lib/actora-client.server";

export function ActoraPanel() {
  const [tasks, setTasks] = useState<unknown[]>([]);
  const [contacts, setContacts] = useState<ActoraContact[]>([]);
  const [companies, setCompanies] = useState<ActoraCompany[]>([]);
  const [deals, setDeals] = useState<ActoraDeal[]>([]);
  const [title, setTitle] = useState("");
  const [taskId, setTaskId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactId, setContactId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function loadTasks() {
    setError(null);
    startTransition(async () => {
      const [tasksResult, contactsResult, companiesResult, dealsResult] = await Promise.all([
        listActoraTasksAction({ limit: 100 }),
        listActoraContactsAction({ limit: 100 }),
        listActoraCompaniesAction({ limit: 100 }),
        listActoraDealsAction({ limit: 100 }),
      ]);
      const failed = [tasksResult, contactsResult, companiesResult, dealsResult].find((result) => !result.ok);
      if (failed && !failed.ok) {
        setError(failed.error);
        return;
      }
      if (tasksResult.ok) setTasks(Array.isArray(tasksResult.data) ? tasksResult.data : [tasksResult.data]);
      if (contactsResult.ok) setContacts(contactsResult.data.data);
      if (companiesResult.ok) setCompanies(companiesResult.data.data);
      if (dealsResult.ok) setDeals(dealsResult.data.data);
    });
  }

  useEffect(() => {
    loadTasks();
  }, []);

  function createTask() {
    if (!title.trim()) {
      setError("Enter a task title.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createActoraTaskAction({ title: title.trim() });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTitle("");
      setNotice("Actora task created.");
      setTasks((current) => [result.data, ...current]);
    });
  }

  function createContact() {
    if (!contactName.trim()) {
      setError("Enter a contact name.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createActoraContactAction({
        name: contactName.trim(),
        email: contactEmail.trim() || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setContactName("");
      setContactEmail("");
      setNotice("Actora contact created.");
      setContacts((current) => [result.data, ...current]);
    });
  }

  function updateContact() {
    if (!contactId.trim() || !contactName.trim()) {
      setError("Enter a contact UUID and a new name.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateActoraContactAction(contactId.trim(), {
        name: contactName.trim(),
        email: contactEmail.trim() || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotice("Actora contact updated.");
      setContacts((current) => current.map((contact) => contact.id === result.data.id ? result.data : contact));
    });
  }

  function removeTask() {
    if (!taskId.trim()) {
      setError("Enter the UUID of the task to delete.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteActoraTaskAction(taskId.trim());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTaskId("");
      setNotice("Actora task deleted.");
      loadTasks();
    });
  }

  return (
    <Card elevated className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-4">
        <div>
          <CardTitle className="text-base">Actora workspace</CardTitle>
          <CardDescription>Tasks supported by the connected Actora workspace.</CardDescription>
        </div>
        <Button size="sm" variant="secondary" loading={pending} onClick={loadTasks}>
          Refresh
        </Button>
      </div>

      <div className="space-y-4 p-4">
        {error ? <p className="rounded-xl border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">{error}</p> : null}
        {notice ? <p className="rounded-xl border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">{notice}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") createTask();
            }}
            placeholder="New Actora task title"
            aria-label="New Actora task title"
            className="min-w-[220px] flex-1"
          />
          <Button loading={pending} onClick={createTask}>Create task</Button>
        </div>
        <div className="rounded-xl border border-border/70 p-3">
          <p className="mb-2 text-sm font-medium">Contacts</p>
          <div className="flex flex-wrap gap-2">
            <Input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Contact name" aria-label="Contact name" className="min-w-[180px] flex-1" />
            <Input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="Email (optional)" aria-label="Contact email" className="min-w-[180px] flex-1" />
            <Button loading={pending} onClick={createContact}>Create contact</Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Input value={contactId} onChange={(event) => setContactId(event.target.value)} placeholder="Contact UUID to update" aria-label="Contact UUID to update" className="min-w-[220px] flex-1" />
            <Button variant="secondary" loading={pending} onClick={updateContact}>Update contact</Button>
          </div>
          <div className="mt-3 space-y-2">
            {!pending && !contacts.length ? <p className="text-sm text-secondary">No contacts found.</p> : null}
            {contacts.map((contact) => (
              <div key={contact.id} className="rounded-lg border border-border/60 px-3 py-2 text-sm">
                <p className="font-medium">{contact.name}</p>
                <p className="text-xs text-secondary">{contact.email || "No email"} · {contact.companyName || "No company"} · {contact.status}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border/70 p-3">
            <p className="mb-2 text-sm font-medium">Companies ({companies.length})</p>
            {companies.length ? companies.map((company) => <p key={company.id} className="text-sm text-secondary">{company.name} · {company.status}</p>) : <p className="text-sm text-secondary">No companies found.</p>}
          </div>
          <div className="rounded-xl border border-border/70 p-3">
            <p className="mb-2 text-sm font-medium">Deals ({deals.length})</p>
            {deals.length ? deals.map((deal) => <p key={deal.id} className="text-sm text-secondary">{deal.title} · {deal.stage}</p>) : <p className="text-sm text-secondary">No deals found.</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            value={taskId}
            onChange={(event) => setTaskId(event.target.value)}
            placeholder="Task UUID to delete"
            aria-label="Task UUID to delete"
            className="min-w-[220px] flex-1"
          />
          <Button variant="danger" loading={pending} onClick={removeTask}>Delete task</Button>
        </div>

        {pending && !tasks.length ? <p className="py-8 text-center text-sm text-secondary">Loading Actora tasks…</p> : null}
        {!pending && !tasks.length ? <p className="py-8 text-center text-sm text-secondary">No Actora tasks found.</p> : null}
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <pre key={index} className="overflow-x-auto rounded-xl border border-border/70 bg-elevated/40 px-3 py-3 text-xs text-secondary">
              {JSON.stringify(task, null, 2)}
            </pre>
          ))}
        </div>

        <p className="border-t border-border/60 pt-3 text-xs text-muted">
          Task response schemas are not defined in Actora&apos;s OpenAPI specification, so task
          responses are shown as returned. Contacts, companies, and deals use documented schemas.
        </p>
      </div>
    </Card>
  );
}
