"use client";

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check, Plug, Search, Zap } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import {
  AVAILABLE_INTEGRATION_COUNT,
  filterIntegrations,
  INTEGRATION_FILTERS,
  IMPLEMENTED_INTEGRATIONS,
  type Integration,
  type IntegrationCategory,
} from "../../lib/integrations";
import { Reveal } from "./atmosphere";
import { IntegrationLogo } from "./integration-logos";
import { useLandingInteractions } from "./landing-interactions";

const STATUS_STATS = [
  {
    label: "Integrations Available",
    value: IMPLEMENTED_INTEGRATIONS.length,
    suffix: "",
  },
  { label: "Available now", value: AVAILABLE_INTEGRATION_COUNT, suffix: "" },
  { label: "Avg sync", value: 2, suffix: "s", prefix: "<" },
  { label: "Uptime", value: 99.9, suffix: "%" },
];

function IntegrationStatusBadge({ available }: { available: boolean }) {
  if (available) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#22C55E] bg-[rgba(34,197,94,0.15)] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#22C55E]">
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.8)]"
          aria-hidden
        />
        <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
        Available
      </span>
    );
  }

  return (
    <span className="relative rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary ring-1 ring-white/10">
      Coming Soon
      <span
        role="tooltip"
        className="integration-tooltip pointer-events-none absolute bottom-[calc(100%+8px)] right-0 z-20 w-max max-w-[180px] rounded-lg border border-white/10 bg-[#121218]/95 px-2.5 py-1.5 text-[10px] font-normal normal-case tracking-normal text-secondary opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
      >
        Integration coming soon.
      </span>
    </span>
  );
}

function IntegrationCard({
  integration,
  index,
  onSelect,
}: {
  integration: Integration;
  index: number;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 260, damping: 22 });
  const springY = useSpring(rotateY, { stiffness: 260, damping: 22 });
  const glowX = useTransform(springY, [-12, 12], ["20%", "80%"]);
  const glowY = useTransform(springX, [-12, 12], ["80%", "20%"]);

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(x * 14);
    rotateX.set(-y * 14);
  }

  function onPointerLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <Reveal delay={Math.min(index * 0.015, 0.45)}>
      <motion.button
        type="button"
        ref={ref}
        onClick={onSelect}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{ rotateX: springX, rotateY: springY, transformPerspective: 900 }}
        whileHover={{ y: -6 }}
        className={`integration-card group relative w-full text-left ${
          integration.available ? "" : "integration-card--soon"
        }`}
        aria-label={`${integration.name} — ${integration.available ? "Available" : "Coming Soon"}`}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[20px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at ${glowX} ${glowY}, rgba(249,115,22,0.18), transparent 55%)`,
          }}
        />
        <div className="relative flex h-full flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/10 transition group-hover:ring-primary/35 ${
                integration.available ? "" : "opacity-80"
              }`}
            >
              <IntegrationLogo id={integration.id} className="h-7 w-7" />
            </div>
            <IntegrationStatusBadge available={integration.available} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{integration.name}</h3>
            <p className="mt-1 text-xs leading-5 text-secondary">{integration.description}</p>
          </div>
        </div>
      </motion.button>
    </Reveal>
  );
}

function StatusBar() {
  return (
    <Reveal delay={0.06}>
      <div className="integration-status-bar landing-glass-strong mx-auto mt-10 max-w-4xl rounded-3xl px-6 py-5">
        <div className="mb-4 flex items-center justify-center gap-2 text-xs font-medium text-secondary">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          {AVAILABLE_INTEGRATION_COUNT} Integrations Available
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STATUS_STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {stat.prefix}
                {stat.value}
                {stat.suffix}
              </p>
              <p className="mt-1 text-xs text-secondary">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

export function IntegrationsShowcase() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<IntegrationCategory | "all">("all");
  const { openOverlay } = useLandingInteractions();

  const filtered = useMemo(
    () => filterIntegrations({ query, category }),
    [query, category],
  );

  return (
    <section id="integrations" className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            <Plug className="h-3.5 w-3.5" aria-hidden />
            Integrations
          </p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
            Works with your favorite tools
          </h2>
          <p className="mt-4 text-base leading-7 text-secondary sm:text-lg">
            Connect the tools you already use. We&apos;re continuously adding new integrations
            across sales, marketing, collaboration, finance, and development.
          </p>
          <p className="mt-3 text-sm font-medium text-primary">
            Actora CRM — Now Available
          </p>
          <p className="mt-1 text-sm text-secondary">
            Connect your Actora workspace and bring task data into VanderBase.
          </p>
        </Reveal>

        <StatusBar />

        <Reveal delay={0.1} className="mt-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search integrations…"
                aria-label="Search integrations"
                className="landing-glass w-full rounded-2xl border-0 py-3 pl-11 pr-4 text-sm text-foreground outline-none ring-1 ring-white/10 transition placeholder:text-secondary/70 focus:ring-primary/40"
              />
            </div>
            <p className="flex items-center gap-2 text-xs text-secondary">
              <Zap className="h-3.5 w-3.5 text-primary" aria-hidden />
              {filtered.length} of {IMPLEMENTED_INTEGRATIONS.length} shown
            </p>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {INTEGRATION_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setCategory(filter.id)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  category === filter.id
                    ? "bg-primary text-white shadow-[0_0_24px_rgba(249,115,22,0.35)]"
                    : "landing-glass text-secondary hover:text-foreground"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </Reveal>

        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${category}-${query}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filtered.map((integration, index) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                index={index}
                onSelect={() =>
                  openOverlay("integration-detail", {
                    id: integration.id,
                    name: integration.name,
                    description: integration.description,
                    categories: integration.categories,
                    available: integration.available,
                  })
                }
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 ? (
          <Reveal className="mt-12 text-center">
            <p className="text-secondary">No integrations match your search. Try another keyword or category.</p>
          </Reveal>
        ) : (
          <Reveal delay={0.08} className="mt-10 text-center">
            <p className="text-sm text-secondary">More integrations coming soon</p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
