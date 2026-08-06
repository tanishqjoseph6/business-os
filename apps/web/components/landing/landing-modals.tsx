"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Calculator,
  Calendar,
  Check,
  Mail,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@repo/ui/button";
import {
  CREDIT_ACTIONS,
  INTEGRATION_DETAILS,
  MODULE_DETAILS,
} from "../../lib/landing-interactions";
import { PRICING_PLANS } from "../../lib/pricing";
import { useLandingInteractions } from "./landing-interactions";
import { IntegrationLogo } from "./integration-logos";
import { ProductMockup } from "./product-mockup";

function ModalShell({
  label,
  onClose,
  children,
  size = "lg",
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const maxWidth =
    size === "xl" ? "max-w-6xl" : size === "lg" ? "max-w-3xl" : "max-w-xl";

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#050507]/88 p-4 backdrop-blur-xl sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className={`landing-glass-strong w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-[28px] p-6 sm:p-8`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{label}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-secondary transition hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

export function LandingModals() {
  const { overlay, closeOverlay, openOverlay } = useLandingInteractions();

  return (
    <AnimatePresence mode="wait">
      {overlay.id === "module-preview" ? (
        <ModalShell key="module" label="Module preview" onClose={closeOverlay} size="xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{overlay.payload.title}</h2>
          <p className="mt-2 text-sm leading-6 text-secondary">{overlay.payload.body}</p>
          {MODULE_DETAILS[overlay.payload.id] ? (
            <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-sm font-medium">{MODULE_DETAILS[overlay.payload.id]!.headline}</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {MODULE_DETAILS[overlay.payload.id]!.bullets.map((item) => (
                  <li key={item} className="text-xs text-secondary">
                    · {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-6">
            <ProductMockup module={overlay.payload.id} />
          </div>
        </ModalShell>
      ) : null}

      {overlay.id === "integration-detail" ? (
        <ModalShell key="integration" label="Integration" onClose={closeOverlay}>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
              <IntegrationLogo id={overlay.payload.id} className="h-8 w-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold">{overlay.payload.name}</h2>
                {overlay.payload.available ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#22C55E] bg-[rgba(34,197,94,0.15)] px-2.5 py-1 text-[10px] font-semibold text-[#22C55E]">
                    <span
                      className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                      aria-hidden
                    />
                    <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                    Available
                  </span>
                ) : (
                  <span className="rounded-full border border-primary bg-primary/15 px-2.5 py-1 text-[10px] font-semibold text-primary">
                    Coming Soon
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-secondary">{overlay.payload.description}</p>
            </div>
          </div>
          <p className="mt-5 text-sm text-secondary">
            {overlay.payload.available
              ? (INTEGRATION_DETAILS[overlay.payload.id] ?? INTEGRATION_DETAILS.default)!.sync
              : "This integration is on our roadmap. We're building connectors across sales, marketing, collaboration, finance, and development."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {overlay.payload.categories.map((category) => (
              <span key={category} className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] text-primary">
                {category}
              </span>
            ))}
          </div>
          {overlay.payload.available ? (
            <>
              <ul className="mt-5 space-y-2">
                {(INTEGRATION_DETAILS[overlay.payload.id] ?? INTEGRATION_DETAILS.default)!.features.map((feature) => (
                  <li key={feature} className="rounded-xl border border-white/5 px-3 py-2 text-sm text-secondary">
                    {feature}
                  </li>
                ))}
              </ul>
                <Button
                className="mt-6 gap-2"
                onClick={() => {
                  closeOverlay();
                  openOverlay("waitlist");
                }}
              >
                  Connect
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </>
          ) : (
            <p className="mt-6 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-secondary">
              Integration coming soon. Join the waitlist when you create your workspace.
            </p>
          )}
        </ModalShell>
      ) : null}

      {overlay.id === "book-demo" ? (
        <BookDemoModal key="book-demo" onClose={closeOverlay} />
      ) : null}

      {overlay.id === "credits-explainer" ? (
        <ModalShell key="credits" label="AI credits" onClose={closeOverlay} size="lg">
          <h2 className="text-2xl font-semibold tracking-tight">How AI credits work</h2>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Credits are shared across your workspace for chat, inbox, content, agents, and automations.
            Heavier actions consume more credits; lightweight replies consume fewer.
          </p>
          <div className="mt-6 space-y-2">
            {CREDIT_ACTIONS.map((item) => (
              <div
                key={item.action}
                className="flex items-center justify-between rounded-xl border border-white/5 px-4 py-3 text-sm"
              >
                <span>{item.action}</span>
                <span className="font-semibold text-primary">{item.credits} cr</span>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {PRICING_PLANS.filter((plan) => plan.credits !== null).map((plan) => (
              <div key={plan.id} className="rounded-2xl border border-white/5 p-3 text-center">
                <p className="text-xs text-muted">{plan.name}</p>
                <p className="mt-1 text-lg font-semibold">{plan.credits?.toLocaleString()}</p>
                <p className="text-[11px] text-secondary">credits included</p>
              </div>
            ))}
          </div>
          <Link href="/credits" className="mt-6 inline-block" onClick={closeOverlay}>
            <Button variant="secondary">Buy credit packs</Button>
          </Link>
        </ModalShell>
      ) : null}

      {overlay.id === "roi-calculator" ? (
        <RoiCalculatorModal key="roi" onClose={closeOverlay} />
      ) : null}

      {overlay.id === "exit-intent" ? (
        <ModalShell key="exit" label="Before you go" onClose={closeOverlay} size="md">
          <h2 className="text-2xl font-semibold tracking-tight">See the OS in action first?</h2>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Take a 60-second guided demo or start free with 100 AI credits—no card required.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              className="gap-2"
              onClick={() => {
                closeOverlay();
                openOverlay("demo");
              }}
            >
              Watch live demo
            </Button>
            <Button
              className="gap-2"
              onClick={() => {
                closeOverlay();
                openOverlay("waitlist");
              }}
            >
              Join the Waitlist
            </Button>
          </div>
          <button
            type="button"
            onClick={closeOverlay}
            className="mt-4 text-xs text-muted transition hover:text-secondary"
          >
            No thanks, keep exploring
          </button>
        </ModalShell>
      ) : null}
    </AnimatePresence>
  );
}

function BookDemoModal({ onClose }: { onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <ModalShell label="Book demo" onClose={onClose}>
      {submitted ? (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Calendar className="h-5 w-5" aria-hidden />
          </div>
          <h2 className="mt-4 text-2xl font-semibold">Request received</h2>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Demo scheduling is simulated on the marketing site. In production this routes to your calendar or CRM.
          </p>
          <Button className="mt-6" onClick={onClose}>
            Back to site
          </Button>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-semibold tracking-tight">Book a personalized demo</h2>
          <p className="mt-2 text-sm text-secondary">
            20 minutes with a product walkthrough tailored to your stack and team size.
          </p>
          <form
            className="mt-6 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
            }}
          >
            <input
              required
              placeholder="Work email"
              type="email"
              className="landing-glass w-full rounded-2xl px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-primary/40"
            />
            <input
              required
              placeholder="Company"
              className="landing-glass w-full rounded-2xl px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-primary/40"
            />
            <textarea
              placeholder="What are you hoping to consolidate?"
              rows={3}
              className="landing-glass w-full rounded-2xl px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-primary/40"
            />
            <Button type="submit" className="w-full gap-2">
              <Mail className="h-4 w-4" aria-hidden />
              Request demo
            </Button>
          </form>
        </>
      )}
    </ModalShell>
  );
}

function RoiCalculatorModal({ onClose }: { onClose: () => void }) {
  const { openOverlay } = useLandingInteractions();
  const [teamSize, setTeamSize] = useState(5);
  const [tools, setTools] = useState(8);
  const toolCost = tools * 29;
  const timeSavedHours = teamSize * 4;
  const proPlan = PRICING_PLANS.find((plan) => plan.id === "pro")!;
  const proOnce = proPlan.price ?? 99;
  /** Rough monthly equivalent of replaced SaaS vs one-time Pro amortized over 12 months. */
  const proMonthlyEquivalent = Math.round(proOnce / 12);
  const savings = Math.max(0, toolCost - proMonthlyEquivalent);

  return (
    <ModalShell label="ROI calculator" onClose={onClose} size="lg">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-primary/15 p-2.5 text-primary">
          <Calculator className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Estimate your stack savings</h2>
          <p className="text-sm text-secondary">
            Demo calculator — Pro is a ${proOnce} one-time purchase (shown as ~${proMonthlyEquivalent}/mo over year one).
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-5">
        <label className="block">
          <span className="text-sm text-secondary">Team size: {teamSize}</span>
          <input
            type="range"
            min={1}
            max={25}
            value={teamSize}
            onChange={(event) => setTeamSize(Number(event.target.value))}
            className="mt-2 w-full accent-primary"
          />
        </label>
        <label className="block">
          <span className="text-sm text-secondary">SaaS tools replaced: {tools}</span>
          <input
            type="range"
            min={3}
            max={15}
            value={tools}
            onChange={(event) => setTools(Number(event.target.value))}
            className="mt-2 w-full accent-primary"
          />
        </label>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/5 p-4 text-center">
          <p className="text-xs text-muted">Est. tool spend</p>
          <p className="mt-1 text-2xl font-semibold">${toolCost}</p>
          <p className="text-[11px] text-secondary">/mo</p>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-center">
          <p className="text-xs text-primary">VanderBase {proPlan.name}</p>
          <p className="mt-1 text-2xl font-semibold">${proOnce}</p>
          <p className="text-[11px] text-secondary">one-time</p>
        </div>
        <div className="rounded-2xl border border-white/5 p-4 text-center">
          <p className="text-xs text-muted">Potential savings</p>
          <p className="mt-1 text-2xl font-semibold text-primary">${savings}</p>
          <p className="text-[11px] text-secondary">/mo vs stack</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-secondary">
        Plus ~{timeSavedHours} operator hours/month from unified inbox, CRM, and AI workflows (demo estimate).
        Buy AI credits only when you need them.
      </p>
      <div className="mt-6 flex gap-2">
        <Button
          className="gap-2"
          onClick={() => {
            onClose();
            openOverlay("waitlist");
          }}
        >
          Join the Waitlist
          <Sparkles className="h-4 w-4" aria-hidden />
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </ModalShell>
  );
}
