"use client";

import type { WebsiteBlueprint, WebsiteBlueprintBlock } from "@repo/types";

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readProp(
  props: Record<string, unknown>,
  keys: string[],
  fallback = "",
) {
  for (const key of keys) {
    const value = props[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
}

function readArrayProp(props: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = props[key];
    if (Array.isArray(value)) return asItems(value);
  }
  return [] as Array<Record<string, unknown>>;
}

function asItems(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null && !Array.isArray(item),
  );
}

function BlockView({
  block,
  palette,
}: {
  block: WebsiteBlueprintBlock;
  palette: WebsiteBlueprint["theme"]["colorPalette"];
}) {
  const props = block.props ?? {};
  const headline = readProp(props, ["headline", "title"]);
  const subheadline = readProp(props, ["subheadline", "subtitle"]);
  const body = readProp(props, ["body", "description", "text"]);
  const ctaLabel = readProp(props, ["ctaLabel", "buttonLabel"]);
  const items = readArrayProp(props, [
    "items",
    "features",
    "testimonials",
    "plans",
    "questions",
    "members",
    "images",
  ]);

  if (block.type === "hero") {
    return (
      <section
        className="relative overflow-hidden px-8 py-16 md:px-12 md:py-24"
        style={{
          background: `linear-gradient(145deg, ${palette.background} 0%, ${palette.surface} 55%, ${palette.primary}22 100%)`,
          color: palette.text,
        }}
      >
        <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 80% 20%, ${palette.accent}55, transparent 45%)` }} />
        <div className="relative mx-auto max-w-3xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: palette.accent }}>
            {readProp(props, ["eyebrow"], "VanderBase")}
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">{headline || "Your headline"}</h1>
          {subheadline ? <p className="mt-4 max-w-2xl text-lg opacity-85">{subheadline}</p> : null}
          {body ? <p className="mt-3 max-w-2xl text-sm leading-7 opacity-75">{body}</p> : null}
          {ctaLabel ? (
            <button
              type="button"
              className="mt-8 rounded-full px-6 py-3 text-sm font-semibold"
              style={{ background: palette.primary, color: palette.background }}
            >
              {ctaLabel}
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  if (block.type === "features" || block.type === "gallery" || block.type === "team" || block.type === "pricing") {
    return (
      <section className="px-8 py-14 md:px-12" style={{ background: palette.surface, color: palette.text }}>
        {(headline || subheadline) && (
          <div className="mx-auto mb-8 max-w-3xl text-center">
            {headline ? <h2 className="text-3xl font-semibold tracking-tight">{headline}</h2> : null}
            {subheadline ? <p className="mt-3 text-sm opacity-75">{subheadline}</p> : null}
          </div>
        )}
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(items.length ? items : [{ title: "Feature", description: body || "Coming soon" }]).map((item, index) => (
            <div
              key={index}
              className="rounded-2xl border p-5"
              style={{ borderColor: `${palette.muted}44`, background: palette.background }}
            >
              <p className="font-semibold">{asString(item.title || item.name || item.plan, `Item ${index + 1}`)}</p>
              <p className="mt-2 text-sm leading-6 opacity-75">
                {asString(item.description || item.body || item.quote || item.price, "Premium detail")}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === "testimonials") {
    return (
      <section className="px-8 py-14 md:px-12" style={{ background: palette.background, color: palette.text }}>
        {headline ? <h2 className="mb-8 text-center text-3xl font-semibold">{headline}</h2> : null}
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
          {(items.length ? items : [{ quote: body || "Outstanding experience.", author: "Happy client" }]).map((item, index) => (
            <blockquote
              key={index}
              className="rounded-2xl border p-6"
              style={{ borderColor: `${palette.muted}33`, background: palette.surface }}
            >
              <p className="text-base leading-7">“{asString(item.quote || item.description, "Great work.")}”</p>
              <footer className="mt-4 text-sm font-medium" style={{ color: palette.accent }}>
                {asString(item.author || item.name, "Client")}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === "faq") {
    return (
      <section className="px-8 py-14 md:px-12" style={{ background: palette.surface, color: palette.text }}>
        {headline ? <h2 className="mb-8 text-center text-3xl font-semibold">{headline}</h2> : null}
        <div className="mx-auto max-w-3xl space-y-3">
          {(items.length ? items : [{ title: "Question", description: body || "Answer" }]).map((item, index) => (
            <div key={index} className="rounded-xl border px-4 py-3" style={{ borderColor: `${palette.muted}44` }}>
              <p className="font-medium">{asString(item.title || item.question, `Question ${index + 1}`)}</p>
              <p className="mt-1 text-sm opacity-75">{asString(item.description || item.answer, "Details coming soon.")}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === "cta") {
    return (
      <section className="px-8 py-16 md:px-12" style={{ background: palette.primary, color: palette.background }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">{headline || "Ready to begin?"}</h2>
          {body ? <p className="mt-3 text-sm opacity-90">{body}</p> : null}
          {ctaLabel ? (
            <button type="button" className="mt-8 rounded-full px-6 py-3 text-sm font-semibold" style={{ background: palette.background, color: palette.primary }}>
              {ctaLabel}
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  if (block.type === "contact") {
    return (
      <section className="px-8 py-14 md:px-12" style={{ background: palette.background, color: palette.text }}>
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold">{headline || "Contact"}</h2>
            {body ? <p className="mt-3 text-sm leading-7 opacity-75">{body}</p> : null}
            <p className="mt-6 text-sm opacity-70">{readProp(props, ["email"], "hello@example.com")}</p>
            <p className="text-sm opacity-70">{readProp(props, ["location"], "Mumbai, India")}</p>
          </div>
          <form className="space-y-3 rounded-2xl border p-5" style={{ borderColor: `${palette.muted}44`, background: palette.surface }} onSubmit={(e) => e.preventDefault()}>
            <input className="h-10 w-full rounded-xl border bg-transparent px-3 text-sm" style={{ borderColor: `${palette.muted}55` }} placeholder="Name" />
            <input className="h-10 w-full rounded-xl border bg-transparent px-3 text-sm" style={{ borderColor: `${palette.muted}55` }} placeholder="Email" />
            <textarea className="min-h-28 w-full rounded-xl border bg-transparent px-3 py-2 text-sm" style={{ borderColor: `${palette.muted}55` }} placeholder="Message" />
            <button type="button" className="rounded-full px-5 py-2.5 text-sm font-semibold" style={{ background: palette.primary, color: palette.background }}>
              {ctaLabel || "Send message"}
            </button>
          </form>
        </div>
      </section>
    );
  }

  if (block.type === "footer") {
    return (
      <footer className="px-8 py-8 md:px-12" style={{ background: palette.surface, color: palette.muted }}>
        <div className="mx-auto flex max-w-5xl flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
          <p>{headline || readProp(props, ["brand"], "Site")}</p>
          <p>{body || "Crafted with VanderBase"}</p>
        </div>
      </footer>
    );
  }

  return (
    <section className="px-8 py-12 md:px-12" style={{ background: palette.background, color: palette.text }}>
      <div className="mx-auto max-w-3xl">
        {headline ? <h2 className="text-2xl font-semibold">{headline}</h2> : null}
        {body ? <p className="mt-3 text-sm leading-7 opacity-80">{body}</p> : null}
      </div>
    </section>
  );
}

export function WebsitePreview({
  blueprint,
  activePageSlug,
  viewport = "desktop",
}: {
  blueprint: WebsiteBlueprint;
  activePageSlug?: string;
  viewport?: "desktop" | "tablet" | "mobile";
}) {
  const page =
    blueprint.pages.find((item) => item.slug === activePageSlug) ??
    blueprint.pages[0];
  const palette = blueprint.theme.colorPalette;
  const width =
    viewport === "mobile" ? "max-w-[390px]" : viewport === "tablet" ? "max-w-[820px]" : "max-w-full";

  return (
    <div className={`mx-auto ${width} transition-all duration-300`}>
      <div
        className="overflow-hidden rounded-[28px] border shadow-2xl shadow-black/30"
        style={{
          borderColor: `${palette.muted}33`,
          background: palette.background,
          fontFamily:
            blueprint.theme.typography.body.includes("serif")
              ? "Georgia, 'Times New Roman', serif"
              : "var(--font-geist-sans), system-ui, sans-serif",
        }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-3 text-xs"
          style={{ borderColor: `${palette.muted}33`, color: palette.muted, background: palette.surface }}
        >
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="truncate">{page?.title ?? "Preview"}</span>
          <span className="opacity-60">{viewport}</span>
        </div>

        <nav
          className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4"
          style={{ borderColor: `${palette.muted}22`, color: palette.text, background: palette.background }}
        >
          <p className="text-sm font-semibold tracking-tight">{blueprint.name}</p>
          <div className="flex flex-wrap gap-3 text-xs opacity-80">
            {(blueprint.navigation.length ? blueprint.navigation : blueprint.pages.map((p) => p.title)).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <span
            className="rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ background: palette.primary, color: palette.background }}
          >
            {blueprint.cta.label}
          </span>
        </nav>

        <div className="max-h-[70vh] overflow-y-auto">
          {page?.blocks.map((block, index) => (
            <BlockView
              key={block.id || `${page.slug}-${block.type}-${index}`}
              block={block}
              palette={palette}
            />
          ))}
          {!page?.blocks.length ? (
            <div className="flex min-h-64 items-center justify-center text-sm opacity-60" style={{ color: palette.muted }}>
              No sections on this page yet.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
