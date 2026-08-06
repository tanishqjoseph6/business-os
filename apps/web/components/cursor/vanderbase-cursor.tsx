"use client";

import { useEffect, useRef } from "react";
import "./vanderbase-cursor.css";

type CursorMode = "default" | "hover" | "magnetic" | "link" | "text" | "ai";

const INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "[role='button']",
  "summary",
  "label[for]",
  "[data-cursor='hover']",
  "[data-cursor='magnetic']",
].join(",");

const TEXT_SELECTOR = [
  "input:not([type='button']):not([type='submit']):not([type='reset']):not([type='checkbox']):not([type='radio']):not([type='range']):not([type='color']):not([type='file'])",
  "textarea",
  "[contenteditable='true']",
  "[data-cursor='text']",
].join(",");

const MAGNETIC_SELECTOR = [
  "button",
  "[role='button']",
  "input[type='button']",
  "input[type='submit']",
  "[data-magnetic]",
  "[data-cursor='magnetic']",
].join(",");

const AI_SELECTOR = [
  ".kairos-root",
  "[data-kairos]",
  "[data-cursor='ai']",
  "[aria-label*='Kairos' i]",
  "[class*='kairos']",
].join(",");

const IGNORE_SELECTOR = "iframe, [data-cursor='native']";

function canUseCustomCursor(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function closestInteractive(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null;
  if (target.closest(IGNORE_SELECTOR)) return null;
  return (
    target.closest(AI_SELECTOR) ||
    target.closest(TEXT_SELECTOR) ||
    target.closest(MAGNETIC_SELECTOR) ||
    target.closest(INTERACTIVE_SELECTOR)
  );
}

function resolveMode(el: Element | null): CursorMode {
  if (!el) return "default";
  if (el.closest(AI_SELECTOR)) return "ai";
  if (el.closest(TEXT_SELECTOR)) return "text";
  if (el.closest(MAGNETIC_SELECTOR)) return "magnetic";
  if (el.closest("a, [data-cursor='link']")) return "link";
  if (el.closest(INTERACTIVE_SELECTOR)) return "hover";
  return "default";
}

export function VanderBaseCursor() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canUseCustomCursor()) return;

    const root = rootRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.classList.add("vb-custom-cursor");
    root.hidden = false;

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { x: mouse.x, y: mouse.y };
    let mode: CursorMode = "default";
    let visible = false;
    let clicking = false;
    let clickTimer: number | null = null;
    let raf = 0;
    let magneticTarget: Element | null = null;

    const lerpFactor = reducedMotion ? 1 : 0.22;
    const magneticStrength = reducedMotion ? 0 : 0.28;

    const applyModeClass = (next: CursorMode, isClicking: boolean) => {
      root.className = [
        "vb-cursor",
        visible ? "is-visible" : "",
        next === "hover" ? "is-hover" : "",
        next === "magnetic" ? "is-magnetic is-hover" : "",
        next === "link" ? "is-link" : "",
        next === "text" ? "is-text" : "",
        next === "ai" ? "is-ai" : "",
        isClicking ? "is-click" : "",
      ]
        .filter(Boolean)
        .join(" ");
    };

    const tick = () => {
      let targetX = mouse.x;
      let targetY = mouse.y;

      if (magneticTarget instanceof HTMLElement && mode === "magnetic") {
        const rect = magneticTarget.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        targetX = mouse.x + (cx - mouse.x) * magneticStrength;
        targetY = mouse.y + (cy - mouse.y) * magneticStrength;
      }

      pos.x += (targetX - pos.x) * lerpFactor;
      pos.y += (targetY - pos.y) * lerpFactor;
      root.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      raf = window.requestAnimationFrame(tick);
    };

    const onMove = (event: MouseEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      if (!visible) {
        visible = true;
        pos.x = mouse.x;
        pos.y = mouse.y;
        applyModeClass(mode, clicking);
      }

      const el = closestInteractive(event.target);
      const nextMode = resolveMode(el);
      magneticTarget = nextMode === "magnetic" ? el : null;
      if (nextMode !== mode) {
        mode = nextMode;
        applyModeClass(mode, clicking);
      }
    };

    const onOver = (event: MouseEvent) => {
      const el = closestInteractive(event.target);
      const nextMode = resolveMode(el);
      magneticTarget = nextMode === "magnetic" ? el : null;
      if (nextMode !== mode) {
        mode = nextMode;
        applyModeClass(mode, clicking);
      }
    };

    const onLeave = () => {
      visible = false;
      magneticTarget = null;
      mode = "default";
      applyModeClass(mode, false);
    };

    const onDown = () => {
      clicking = true;
      applyModeClass(mode, true);
      if (clickTimer) window.clearTimeout(clickTimer);
      clickTimer = window.setTimeout(() => {
        clicking = false;
        applyModeClass(mode, false);
      }, 420);
    };

    const onTouchStart = () => {
      // Hybrid devices: if touch is used, fall back to the native cursor.
      visible = false;
      document.documentElement.classList.remove("vb-custom-cursor");
      root.hidden = true;
      window.cancelAnimationFrame(raf);
    };

    const onVisibility = () => {
      if (document.hidden) {
        visible = false;
        applyModeClass(mode, false);
      }
    };

    applyModeClass(mode, false);
    raf = window.requestAnimationFrame(tick);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true, once: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.cancelAnimationFrame(raf);
      if (clickTimer) window.clearTimeout(clickTimer);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("touchstart", onTouchStart);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      document.documentElement.classList.remove("vb-custom-cursor");
    };
  }, []);

  return (
    <div ref={rootRef} className="vb-cursor" aria-hidden hidden>
      <div className="vb-cursor__arrow">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4.2 2.4 19.6 11.1c.55.31.5 1.12-.08 1.35L12.3 15.2c-.2.08-.36.24-.43.45l-2.45 7.2c-.2.57-1 .6-1.25.05L4.05 3.35c-.22-.5.3-.97.8-.7.05.03.1.07.15.1Z"
            fill="#0B0B0B"
            stroke="#FF6A00"
            strokeWidth="1.35"
            strokeLinejoin="round"
          />
          <path
            d="M11.55 14.75 16.2 19.2"
            stroke="#FF6A00"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>
      </div>
      <div className="vb-cursor__ring" />
      <div className="vb-cursor__ibeam" />
      <div className="vb-cursor__orb" />
      <div className="vb-cursor__ripple" />
    </div>
  );
}
