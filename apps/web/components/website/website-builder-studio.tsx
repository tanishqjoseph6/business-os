"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Monitor,
  Smartphone,
  Tablet,
  Sparkles,
  Undo2,
  Redo2,
  Eye,
  Rocket,
  ChevronDown,
  Loader2,
  MessageSquare,
  Layers3,
} from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import type { WebsiteBlueprint, WebsiteProjectType } from "@repo/types";
import {
  generateWebsiteAction,
  improveWebsiteAction,
  publishWebsiteAction,
  refineWebsiteAction,
} from "../../app/(protected)/actions/website";
import { WebsitePreview } from "./website-preview";

const PROMPT_CHIPS = [
  {
    id: "saas",
    label: "SaaS",
    prompt:
      "Create a premium SaaS marketing website for an AI productivity tool with Home, Features, Pricing, Customers and Contact pages.",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    prompt:
      "Create a premium portfolio website for a Mumbai-based photographer with Home, About, Services, Portfolio and Contact pages.",
  },
  {
    id: "agency",
    label: "Agency",
    prompt:
      "Build a modern creative agency website with bold typography, case studies, services, team and a strong lead-gen CTA.",
  },
  {
    id: "restaurant",
    label: "Restaurant",
    prompt:
      "Design an elegant restaurant website with Menu, Story, Reservations, Gallery and Contact sections in a warm luxury palette.",
  },
  {
    id: "creator",
    label: "Creator",
    prompt:
      "Create a creator personal brand site with hero, offers, testimonials, newsletter signup and media kit vibes.",
  },
  {
    id: "landing",
    label: "Landing Page",
    prompt:
      "Generate a high-converting landing page for a founder coaching offer with hero, benefits, proof, pricing and FAQ.",
  },
  {
    id: "ecommerce",
    label: "E-commerce",
    prompt:
      "Create a stylish e-commerce fashion brand site with Home, Shop highlights, Lookbook, Story and Contact pages.",
  },
] as const;

const GENERATION_STAGES = [
  "Understanding your brief",
  "Planning pages",
  "Designing layout",
  "Writing content",
  "Building website",
  "Preparing preview",
] as const;

type Viewport = "desktop" | "tablet" | "mobile";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function inferDefaultsFromPrompt(prompt: string): {
  projectType: WebsiteProjectType;
  template: string;
} {
  const lower = prompt.toLowerCase();
  if (lower.includes("portfolio") || lower.includes("photographer")) {
    return { projectType: "portfolio", template: "freelancer" };
  }
  if (lower.includes("landing")) {
    return { projectType: "landing_page", template: "startup" };
  }
  if (lower.includes("link in bio") || lower.includes("link-in-bio")) {
    return { projectType: "link_in_bio", template: "creator" };
  }
  if (lower.includes("media kit")) {
    return { projectType: "media_kit", template: "creator" };
  }
  if (lower.includes("saas") || lower.includes("agency") || lower.includes("restaurant")) {
    return { projectType: "website", template: lower.includes("saas") ? "saas" : "agency" };
  }
  return { projectType: "website", template: "creator" };
}

export function WebsiteBuilderStudio({
  initialBlueprint,
  initialProjectId,
  initialStatus,
}: {
  initialBlueprint?: WebsiteBlueprint | null;
  initialProjectId?: string | null;
  initialStatus?: "draft" | "published" | "archived" | null;
}) {
  const [prompt, setPrompt] = useState("");
  const [name, setName] = useState("");
  const [projectType, setProjectType] = useState<WebsiteProjectType>("website");
  const [template, setTemplate] = useState("creator");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [blueprint, setBlueprint] = useState<WebsiteBlueprint | null>(initialBlueprint ?? null);
  const [projectId, setProjectId] = useState<string | null>(initialProjectId ?? null);
  const [status, setStatus] = useState(initialStatus ?? "draft");
  const [history, setHistory] = useState<WebsiteBlueprint[]>(
    initialBlueprint ? [initialBlueprint] : [],
  );
  const [historyIndex, setHistoryIndex] = useState(initialBlueprint ? 0 : -1);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [activePageSlug, setActivePageSlug] = useState<string | undefined>(
    initialBlueprint?.pages[0]?.slug,
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [mode, setMode] = useState<"create" | "preview">(
    initialBlueprint ? "preview" : "create",
  );
  const [pending, startTransition] = useTransition();
  const [improving, startImprove] = useTransition();
  const [publishing, startPublish] = useTransition();

  useEffect(() => {
    if (!pending) {
      setStageIndex(0);
      return;
    }
    setStageIndex(0);
    const timer = window.setInterval(() => {
      setStageIndex((current) =>
        current < GENERATION_STAGES.length - 1 ? current + 1 : current,
      );
    }, 900);
    return () => window.clearInterval(timer);
  }, [pending]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex >= 0 && historyIndex < history.length - 1;

  const activePage = useMemo(
    () =>
      blueprint?.pages.find((page) => page.slug === activePageSlug) ??
      blueprint?.pages[0],
    [blueprint, activePageSlug],
  );

  function pushBlueprint(next: WebsiteBlueprint) {
    const clipped = history.slice(0, historyIndex + 1);
    const updated = [...clipped, next].slice(-30);
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
    setBlueprint(next);
    setActivePageSlug((current) =>
      next.pages.some((page) => page.slug === current)
        ? current
        : next.pages[0]?.slug,
    );
  }

  function undo() {
    if (!canUndo) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    setBlueprint(history[nextIndex] ?? null);
  }

  function redo() {
    if (!canRedo) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    setBlueprint(history[nextIndex] ?? null);
  }

  function generate(retryPrompt?: string) {
    const brief = (retryPrompt ?? prompt).trim();
    if (brief.length < 8) {
      setError("Describe the website you want in a bit more detail.");
      return;
    }
    const inferred = inferDefaultsFromPrompt(brief);
    startTransition(async () => {
      setError(null);
      setMode("create");
      const result = await generateWebsiteAction({
        prompt: brief,
        name: name.trim() || undefined,
        projectType: projectType || inferred.projectType,
        template: template || inferred.template,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setProjectId(result.data.id);
      setStatus(result.data.status);
      setHistory([result.data.blueprint]);
      setHistoryIndex(0);
      setBlueprint(result.data.blueprint);
      setActivePageSlug(result.data.blueprint.pages[0]?.slug);
      setMode("preview");
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Your website is ready. Ask me to refine sections, change the theme, or improve the copy.",
        },
      ]);
    });
  }

  function applyInstruction(instruction: string) {
    if (!blueprint || !projectId || !instruction.trim()) return;
    startTransition(async () => {
      setError(null);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: instruction },
      ]);
      const result = await refineWebsiteAction({
        projectId,
        instruction,
        blueprint,
      });
      if (!result.ok) {
        setError(result.error);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "I couldn't apply that change. Try rephrasing or retry.",
          },
        ]);
        return;
      }
      pushBlueprint(result.data.blueprint);
      setChatInput("");
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Done — I updated the website based on your request.",
        },
      ]);
    });
  }

  function improve() {
    if (!blueprint || !projectId) return;
    startImprove(async () => {
      setError(null);
      const result = await improveWebsiteAction({ projectId, blueprint });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      pushBlueprint(result.data.blueprint);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Polished layout, hierarchy, copy and CTAs while keeping your content intact.",
        },
      ]);
    });
  }

  function publish() {
    if (!projectId) return;
    startPublish(async () => {
      setError(null);
      const result = await publishWebsiteAction({ projectId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStatus(result.data.status);
    });
  }

  if (!blueprint || mode === "create") {
    return (
      <div className="relative overflow-hidden rounded-[28px] border border-border/80 bg-[radial-gradient(circle_at_top,_rgba(255,122,0,0.12),_transparent_38%),linear-gradient(180deg,#111118_0%,#0b0b10_100%)] p-6 md:p-10">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <Badge variant="accent" className="gap-1.5">
            <Sparkles className="h-3 w-3" aria-hidden /> AI Website Builder
          </Badge>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            Build your website with AI
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-secondary md:text-base">
            Describe what you want. We&apos;ll turn your idea into a complete website.
          </p>
        </div>

        <div className="relative mx-auto mt-8 max-w-3xl space-y-4">
          <div className="rounded-[24px] border border-border/80 bg-[#12121a]/90 p-3 shadow-2xl shadow-black/30 backdrop-blur">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={7}
              placeholder='Describe the website you want to build...\n\nExample: "Create a premium portfolio website for a Mumbai-based photographer with Home, About, Services, Portfolio and Contact pages."'
              className="w-full resize-none rounded-2xl bg-transparent px-3 py-3 text-base leading-7 text-foreground outline-none placeholder:text-muted"
            />
            <div className="flex flex-col gap-3 border-t border-border/70 px-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted">
                AI infers pages, sections, style, and CTAs automatically.
              </p>
              <Button
                onClick={() => generate()}
                loading={pending}
                disabled={prompt.trim().length < 8}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" aria-hidden /> Generate website
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {PROMPT_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setPrompt(chip.prompt);
                  const inferred = inferDefaultsFromPrompt(chip.prompt);
                  setProjectType(inferred.projectType);
                  setTemplate(inferred.template);
                }}
                className="rounded-full border border-border bg-[#16161f] px-3 py-1.5 text-xs text-secondary transition hover:border-primary/50 hover:text-foreground"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-border/70 bg-[#12121a]/70">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-secondary"
              onClick={() => setShowAdvanced((value) => !value)}
            >
              Advanced options
              <ChevronDown className={`h-4 w-4 transition ${showAdvanced ? "rotate-180" : ""}`} />
            </button>
            {showAdvanced ? (
              <div className="grid gap-3 border-t border-border/70 px-4 py-4 md:grid-cols-3">
                <label className="space-y-1.5 text-left">
                  <span className="text-xs uppercase tracking-wide text-muted">Name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Auto from prompt"
                    className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </label>
                <label className="space-y-1.5 text-left">
                  <span className="text-xs uppercase tracking-wide text-muted">Type</span>
                  <select
                    value={projectType}
                    onChange={(event) => setProjectType(event.target.value as WebsiteProjectType)}
                    className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  >
                    {["website", "landing_page", "link_in_bio", "media_kit", "portfolio"].map((item) => (
                      <option key={item} value={item}>
                        {item.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5 text-left">
                  <span className="text-xs uppercase tracking-wide text-muted">Template</span>
                  <select
                    value={template}
                    onChange={(event) => setTemplate(event.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  >
                    {["creator", "agency", "saas", "freelancer", "coach", "startup"].map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}
          </div>

          {pending ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-5 text-left">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
                {GENERATION_STAGES[stageIndex]}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{
                    width: `${((stageIndex + 1) / GENERATION_STAGES.length) * 100}%`,
                  }}
                />
              </div>
              <ul className="mt-4 grid gap-1.5 text-xs text-secondary sm:grid-cols-2">
                {GENERATION_STAGES.map((stage, index) => (
                  <li key={stage} className={index <= stageIndex ? "text-foreground" : "text-muted"}>
                    {index <= stageIndex ? "●" : "○"} {stage}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
              <p>{error}</p>
              <Button className="mt-3" size="sm" variant="secondary" onClick={() => generate(prompt)}>
                Retry
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[24px] border border-border bg-[#12121a] p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold">{blueprint.name}</h2>
            <Badge variant={status === "published" ? "success" : "default"}>{status}</Badge>
          </div>
          <p className="truncate text-xs text-muted">{blueprint.purpose}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={undo} disabled={!canUndo || pending}>
            <Undo2 className="h-3.5 w-3.5" aria-hidden /> Undo
          </Button>
          <Button size="sm" variant="secondary" onClick={redo} disabled={!canRedo || pending}>
            <Redo2 className="h-3.5 w-3.5" aria-hidden /> Redo
          </Button>
          <div className="flex overflow-hidden rounded-xl border border-border">
            {(
              [
                ["desktop", Monitor],
                ["tablet", Tablet],
                ["mobile", Smartphone],
              ] as const
            ).map(([id, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setViewport(id)}
                className={`px-2.5 py-2 ${viewport === id ? "bg-primary text-background" : "bg-elevated text-secondary"}`}
                aria-label={id}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
          <Button size="sm" variant="secondary" onClick={() => setMode("preview")}>
            <Eye className="h-3.5 w-3.5" aria-hidden /> Preview
          </Button>
          <Button size="sm" variant="secondary" loading={improving} onClick={improve} className="gap-1.5">
            ✨ Improve
          </Button>
          <Button size="sm" loading={publishing} onClick={publish} className="gap-1.5">
            <Rocket className="h-3.5 w-3.5" aria-hidden /> Publish
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMode("create")}>
            New brief
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className="rounded-[24px] border border-border bg-[#12121a] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Layers3 className="h-4 w-4 text-primary" aria-hidden /> Structure
          </div>
          <div className="space-y-3">
            {blueprint.pages.map((page) => (
              <div key={page.slug}>
                <button
                  type="button"
                  onClick={() => setActivePageSlug(page.slug)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                    activePage?.slug === page.slug
                      ? "bg-primary/15 text-foreground"
                      : "text-secondary hover:bg-elevated"
                  }`}
                >
                  {page.title}
                </button>
                <ul className="mt-1 space-y-1 border-l border-border/70 pl-3">
                  {page.blocks.map((block, index) => {
                    const id = block.id || `${page.slug}-${index}`;
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => {
                            setActivePageSlug(page.slug);
                            setSelectedBlockId(id);
                          }}
                          className={`w-full rounded-lg px-2 py-1.5 text-left text-xs capitalize transition ${
                            selectedBlockId === id
                              ? "bg-elevated text-foreground"
                              : "text-muted hover:text-secondary"
                          }`}
                        >
                          {block.type}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-border/70 bg-elevated/50 p-3 text-xs text-muted">
            <p className="font-medium text-secondary">Inferred</p>
            <p className="mt-1">Audience: {blueprint.audience}</p>
            <p className="mt-1">Style: {blueprint.theme.style}</p>
            <p className="mt-1">Type: {blueprint.projectType.replace("_", " ")}</p>
          </div>
        </aside>

        <section className="min-w-0 rounded-[24px] border border-border bg-[#0d0d13] p-4 md:p-6">
          {(pending || improving) && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {improving ? "Improving your website…" : GENERATION_STAGES[stageIndex]}
            </div>
          )}
          <WebsitePreview
            blueprint={blueprint}
            activePageSlug={activePage?.slug}
            viewport={viewport}
          />
        </section>

        <aside className="flex min-h-[560px] flex-col rounded-[24px] border border-border bg-[#12121a]">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-medium">
            <MessageSquare className="h-4 w-4 text-primary" aria-hidden /> Chat to edit
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-2xl px-3 py-2 text-sm leading-6 ${
                  message.role === "user"
                    ? "ml-6 bg-primary/20 text-foreground"
                    : "mr-4 bg-elevated text-secondary"
                }`}
              >
                {message.content}
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {[
                "Make the hero section more premium.",
                "Add a pricing section.",
                "Change the color theme to black and gold.",
                "Add testimonials.",
                "Make the CTA more convincing.",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={pending}
                  onClick={() => applyInstruction(suggestion)}
                  className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted transition hover:border-primary/40 hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
          <form
            className="border-t border-border p-3"
            onSubmit={(event) => {
              event.preventDefault();
              applyInstruction(chatInput);
            }}
          >
            <textarea
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              rows={3}
              placeholder="Describe a change…"
              className="w-full resize-none rounded-xl border border-border bg-elevated px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              type="submit"
              className="mt-2 w-full"
              loading={pending}
              disabled={!chatInput.trim()}
            >
              Apply edit
            </Button>
          </form>
        </aside>
      </div>
    </div>
  );
}
