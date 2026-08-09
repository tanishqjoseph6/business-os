"use client";

import { useEffect, useState, useTransition } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import {
  createLinearIssueAction,
  getLinearIssueAction,
  listLinearDataAction,
  updateLinearIssueAction,
} from "../../app/(protected)/actions/linear";
import type { LinearIssue, LinearProject, LinearTeam } from "../../lib/linear-actions.server";

export function LinearPanel() {
  const [teams, setTeams] = useState<LinearTeam[]>([]);
  const [projects, setProjects] = useState<LinearProject[]>([]);
  const [issues, setIssues] = useState<LinearIssue[]>([]);
  const [selected, setSelected] = useState<LinearIssue | null>(null);
  const [teamId, setTeamId] = useState("");
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function loadData() {
    setError(null);
    startTransition(async () => {
      const result = await listLinearDataAction({ teamId: teamId || undefined, search });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTeams(result.data.teams);
      setProjects(result.data.projects);
      setIssues(result.data.issues);
    });
  }

  useEffect(() => {
    loadData();
    // Load once when the connected panel mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openIssue(issueId: string) {
    setError(null);
    startTransition(async () => {
      const result = await getLinearIssueAction(issueId);
      if (!result.ok) setError(result.error);
      else setSelected(result.data);
    });
  }

  function createIssue() {
    if (!title.trim() || !teamId) {
      setError("Choose a team and enter an issue title.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createLinearIssueAction({ teamId, title: title.trim() });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTitle("");
      setNotice(`Created ${result.data.identifier}`);
      setIssues((current) => [result.data, ...current]);
    });
  }

  function updateIssue() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const result = await updateLinearIssueAction({
        issueId: selected.id,
        title: selected.title,
        description: selected.description,
        priority: selected.priority,
      });
      if (!result.ok) setError(result.error);
      else {
        setSelected(result.data);
        setIssues((current) =>
          current.map((issue) => (issue.id === result.data.id ? result.data : issue)),
        );
        setNotice(`Updated ${result.data.identifier}`);
      }
    });
  }

  return (
    <Card elevated className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-4">
        <div>
          <CardTitle className="text-base">Linear workspace</CardTitle>
          <CardDescription className="mt-1">
            Browse teams, projects, and issues, then create or update issues.
          </CardDescription>
        </div>
        <Button size="sm" variant="secondary" loading={pending} onClick={loadData}>
          Refresh
        </Button>
      </div>

      {error ? <p className="border-b border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{error}</p> : null}
      {notice ? <p className="border-b border-success/20 bg-success/5 px-4 py-3 text-sm text-success">{notice}</p> : null}

      <div className="grid gap-4 border-b border-border/70 p-4 md:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Create issue</p>
          <select
            value={teamId}
            onChange={(event) => setTeamId(event.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm"
          >
            <option value="">Select a team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} ({team.key})
              </option>
            ))}
          </select>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Issue title" />
          <Button size="sm" loading={pending} onClick={createIssue}>Create issue</Button>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Projects</p>
          <div className="flex flex-wrap gap-2">
            {projects.slice(0, 12).map((project) => (
              <Badge key={project.id} variant="default">{project.name}</Badge>
            ))}
            {!projects.length ? <p className="text-sm text-secondary">No projects found.</p> : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 p-4">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search issues…" className="h-9 max-w-xs" />
        <select
          value={teamId}
          onChange={(event) => setTeamId(event.target.value)}
          className="h-9 rounded-xl border border-border bg-elevated px-3 text-sm"
          aria-label="Filter issues by team"
        >
          <option value="">All teams</option>
          {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
        </select>
        <Button size="sm" variant="secondary" loading={pending} onClick={loadData}>Search</Button>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_0.85fr]">
        <div className="space-y-2">
          {pending && !issues.length ? <p className="py-8 text-center text-sm text-secondary">Loading Linear issues…</p> : null}
          {issues.map((issue) => (
            <button
              key={issue.id}
              type="button"
              onClick={() => openIssue(issue.id)}
              className="w-full rounded-xl border border-border/70 bg-elevated/40 p-3 text-left transition hover:border-primary/50"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-primary">{issue.identifier}</span>
                <span className="text-xs text-muted">{issue.state?.name ?? "No state"}</span>
              </div>
              <p className="mt-1 text-sm font-medium">{issue.title}</p>
              <p className="mt-1 text-xs text-secondary">{issue.team?.name ?? "Unassigned team"}</p>
            </button>
          ))}
          {!pending && !issues.length ? <p className="py-8 text-center text-sm text-secondary">No Linear issues found.</p> : null}
        </div>

        {selected ? (
          <div className="rounded-xl border border-border/70 bg-elevated/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="accent">{selected.identifier}</Badge>
              {selected.url ? <a href={selected.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Open in Linear</a> : null}
            </div>
            <Input className="mt-3" value={selected.title} onChange={(event) => setSelected({ ...selected, title: event.target.value })} />
            <textarea
              value={selected.description ?? ""}
              onChange={(event) => setSelected({ ...selected, description: event.target.value })}
              placeholder="Description"
              className="mt-3 min-h-28 w-full rounded-xl border border-border bg-elevated px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
            <Button size="sm" className="mt-3" loading={pending} onClick={updateIssue}>Save changes</Button>
          </div>
        ) : (
          <p className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border p-4 text-center text-sm text-secondary">
            Select an issue to view details.
          </p>
        )}
      </div>
    </Card>
  );
}
