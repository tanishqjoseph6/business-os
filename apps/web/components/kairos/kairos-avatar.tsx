"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { KAIROS_THINKING_MESSAGES, type KairosState } from "../../lib/kairos";
import { useMounted } from "../../lib/use-mounted";
import "./kairos.css";

const SIZE_MAP = {
  xs: 36,
  sm: 52,
  md: 76,
  lg: 104,
  xl: 128,
} as const;

export type KairosAvatarProps = {
  state?: KairosState;
  size?: keyof typeof SIZE_MAP;
  interactive?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function KairosAvatar({
  state = "idle",
  size = "md",
  interactive = false,
  className = "",
  "aria-label": ariaLabel = "Kairos AI copilot",
}: KairosAvatarProps) {
  const mounted = useMounted();
  const reduced = useReducedMotion();
  const animationsEnabled = mounted && !reduced;
  const px = SIZE_MAP[size];
  const [blink, setBlink] = useState(false);
  const [thinkIndex, setThinkIndex] = useState(0);
  const [ripple, setRipple] = useState(false);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const tiltX = useSpring(useTransform(pointerY, [-0.5, 0.5], [6, -6]), {
    stiffness: 180,
    damping: 20,
  });
  const tiltY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-6, 6]), {
    stiffness: 180,
    damping: 20,
  });

  useEffect(() => {
    if (reduced || state !== "idle") return;
    const blinkTimer = window.setInterval(() => {
      if (Math.random() > 0.62) {
        setBlink(true);
        window.setTimeout(() => setBlink(false), 140);
      }
    }, 2800);
    return () => window.clearInterval(blinkTimer);
  }, [reduced, state]);

  useEffect(() => {
    if (state !== "thinking") {
      setThinkIndex(0);
      return;
    }
    const timer = window.setInterval(() => {
      setThinkIndex((value) => (value + 1) % KAIROS_THINKING_MESSAGES.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [state]);

  const palette = useMemo(() => {
    switch (state) {
      case "thinking":
        return { core: "#fdba74", ring: "#fb923c", halo: 0.55, ambient: 0.28 };
      case "speaking":
        return { core: "#f97316", ring: "#fb923c", halo: 0.48, ambient: 0.24 };
      case "success":
      case "completed":
        return { core: "#fcd34d", ring: "#f97316", halo: 0.62, ambient: 0.3 };
      case "error":
        return { core: "#fbbf24", ring: "#d97706", halo: 0.38, ambient: 0.18 };
      case "listening":
        return { core: "#ffffff", ring: "#f97316", halo: 0.42, ambient: 0.2 };
      default:
        return { core: "#ffffff", ring: "#f97316", halo: 0.34, ambient: 0.16 };
    }
  }, [state]);

  const isThinking = state === "thinking";
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";
  const isSuccess = state === "success" || state === "completed";
  const isError = state === "error";
  const showMouth = !isThinking;
  const eyeYOffset = isThinking ? -5 : isSpeaking ? 0 : isError ? 1 : 0;
  const eyeXFocus = isSpeaking ? 0 : isListening ? 0.5 : 0;

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!interactive || reduced) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function onPointerLeave() {
    pointerX.set(0);
    pointerY.set(0);
  }

  function onClick() {
    if (!interactive) return;
    setRipple(true);
    window.setTimeout(() => setRipple(false), 520);
  }

  return (
    <div
      className={`kairos-root ${className}`}
      data-reduced={reduced ? "true" : "false"}
      style={{ width: px, height: px }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
      role="img"
      aria-label={ariaLabel}
    >
      {ripple ? <span className="kairos-ripple kairos-gpu animate-ping" aria-hidden /> : null}

      <motion.div
        className="kairos-gpu relative h-full w-full"
        initial={false}
        style={{
          rotateX: interactive && animationsEnabled ? tiltX : 0,
          rotateY: interactive && animationsEnabled ? tiltY : 0,
          transformPerspective: 600,
        }}
        animate={
          animationsEnabled
            ? {
                y: state === "idle" ? [0, -3, 0] : isSpeaking ? [0, -1, 0] : 0,
                scale: state === "idle" ? [1, 1.03, 1] : isSuccess ? [1, 1.04, 1] : 1,
              }
            : false
        }
        transition={
          animationsEnabled
            ? {
                duration: state === "idle" ? 4.8 : 2.4,
                repeat: state === "idle" || isSpeaking ? Infinity : 0,
                ease: "easeInOut",
              }
            : undefined
        }
      >
        {animationsEnabled ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-[-18%] rounded-full"
            initial={false}
            style={{
              background: `radial-gradient(circle, rgba(249,115,22,${palette.ambient + 0.08}), transparent 68%)`,
            }}
            animate={{ opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : null}

        <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
          <defs>
            <radialGradient id="kairos-head" cx="38%" cy="32%" r="68%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
              <stop offset="45%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="rgba(11,11,15,0.55)" />
            </radialGradient>
            <radialGradient id="kairos-eye" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor={palette.core} />
              <stop offset="100%" stopColor={palette.ring} />
            </radialGradient>
            <filter id="kairos-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Halo */}
          <motion.ellipse
            className="kairos-halo-spin"
            cx="60"
            cy="58"
            rx="52"
            ry="18"
            fill="none"
            stroke={palette.ring}
            strokeOpacity={palette.halo}
            strokeWidth="1"
            strokeDasharray="4 7"
            initial={false}
            animate={animationsEnabled ? { rotate: 360 } : false}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "60px 58px" }}
          />

          {/* Energy ring — thinking */}
          {isThinking ? (
            <motion.circle
              cx="60"
              cy="60"
              r="46"
              fill="none"
              stroke="url(#kairos-eye)"
              strokeWidth="1.5"
              strokeDasharray="18 12"
              strokeLinecap="round"
              initial={false}
              animate={animationsEnabled ? { rotate: 360 } : false}
              transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "60px 60px", opacity: 0.85 }}
            />
          ) : null}

          {/* Particles */}
          {animationsEnabled
            ? [0, 60, 120, 180, 240, 300].map((angle, index) => {
                const rad = (angle * Math.PI) / 180;
                const radius = isThinking ? 44 : 38;
                return (
                  <motion.circle
                    key={angle}
                    className="kairos-particle"
                    initial={false}
                    r={index % 2 === 0 ? 1.6 : 1.1}
                    fill={palette.core}
                    fillOpacity={0.75}
                    cx={60 + Math.cos(rad) * radius}
                    cy={60 + Math.sin(rad) * radius}
                    animate={
                      isThinking || state === "idle"
                        ? { opacity: [0.35, 0.9, 0.35] }
                        : { opacity: 0.35 }
                    }
                    transition={{
                      duration: isThinking ? 2.2 : 5.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.12,
                    }}
                  />
                );
              })
            : null}

          {/* Neural lines — thinking */}
          {isThinking && animationsEnabled ? (
            <g opacity="0.35">
              <motion.line x1="34" y1="42" x2="60" y2="28" stroke={palette.ring} strokeWidth="0.8" initial={false} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
              <motion.line x1="86" y1="42" x2="60" y2="28" stroke={palette.ring} strokeWidth="0.8" initial={false} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.1 }} />
              <motion.line x1="42" y1="78" x2="78" y2="78" stroke={palette.ring} strokeWidth="0.8" initial={false} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.15 }} />
            </g>
          ) : null}

          {/* Glass head */}
          <circle cx="60" cy="60" r="34" fill="url(#kairos-head)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
          <circle cx="60" cy="60" r="34" fill="none" stroke={palette.ring} strokeOpacity={0.22 + palette.ambient} strokeWidth="0.8" filter="url(#kairos-glow)" />

          {/* Eyebrows */}
          <motion.path
            d={isError ? "M41 47 Q47 44 53 47" : "M41 48 Q47 45 53 48"}
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <motion.path
            d={isError ? "M67 47 Q73 44 79 47" : "M67 48 Q73 45 79 48"}
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Eyes */}
          {(["left", "right"] as const).map((side) => {
            const cx = side === "left" ? 47 : 73;
            return (
              <motion.g
                key={side}
                initial={false}
                animate={{
                  y: eyeYOffset,
                  x: eyeXFocus * (side === "left" ? -1 : 1),
                  scaleY: blink ? 0.12 : 1,
                }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
              >
                <ellipse cx={cx} cy="56" rx="6.5" ry="7.5" fill="url(#kairos-eye)" filter="url(#kairos-glow)" />
                <circle cx={cx + (isListening ? 1 : 0)} cy="57" r="2.1" fill="#0b0b0f" fillOpacity="0.65" />
                <circle cx={cx + (isListening ? 1.5 : 0.5)} cy="56" r="0.9" fill="#ffffff" fillOpacity="0.95" />
              </motion.g>
            );
          })}

          {/* Mouth */}
          {showMouth ? (
            <motion.path
              fill="none"
              stroke="rgba(255,255,255,0.72)"
              strokeWidth="1.4"
              strokeLinecap="round"
              initial={false}
              animate={
                isSuccess
                  ? { d: "M48 72 Q60 79 72 72" }
                  : isError
                    ? { d: "M49 74 Q60 71 71 74" }
                    : isSpeaking && animationsEnabled
                      ? { d: ["M50 72 Q60 74 70 72", "M50 73 Q60 71 70 73", "M50 72 Q60 74 70 72"] }
                      : { d: "M50 72 Q60 74 70 72" }
              }
              transition={
                isSpeaking && animationsEnabled
                  ? { duration: 0.55, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.35 }
              }
            />
          ) : null}

          {/* Success sparkles */}
          {isSuccess && animationsEnabled
            ? [
                [44, 34],
                [76, 36],
                [60, 26],
              ].map(([x, y], index) => (
                <motion.circle
                  key={`${x}-${y}`}
                  cx={x}
                  cy={y}
                  r="1.4"
                  fill="#fcd34d"
                  initial={false}
                  animate={{ opacity: [0, 1, 0], scale: [0.6, 1.2, 0.6] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: index * 0.22 }}
                />
              ))
            : null}
        </svg>
      </motion.div>

      {isThinking ? (
        <p className="sr-only" aria-live="polite">
          {KAIROS_THINKING_MESSAGES[thinkIndex]}
        </p>
      ) : null}
    </div>
  );
}

export function KairosThinkingMessage({ state }: { state: KairosState }) {
  const [index, setIndex] = useState(0);
  const mounted = useMounted();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!mounted || state !== "thinking" || reduced) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % KAIROS_THINKING_MESSAGES.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [mounted, reduced, state]);

  if (state !== "thinking") return null;

  return (
    <motion.p
      key={index}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className="text-xs text-secondary"
      aria-live="polite"
    >
      {KAIROS_THINKING_MESSAGES[index]}
    </motion.p>
  );
}
