"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export function AnimatedMetric({ value }: { value: string }) {
  const numeric = Number(value.replace(/[^0-9.-]/g, ""));
  const prefix = value.match(/^[^\d-]*/)?.[0] ?? "";
  const suffix = value.match(/[^\d.,]*$/)?.[0] ?? "";
  const isNumeric = Number.isFinite(numeric) && value.trim() !== "";

  const spring = useSpring(0, { stiffness: 90, damping: 18 });
  const display = useTransform(spring, (current) => {
    if (!isNumeric) return value;
    const rounded = Number.isInteger(numeric) ? Math.round(current) : current.toFixed(1);
    return `${prefix}${Number(rounded).toLocaleString()}${suffix}`;
  });

  const [text, setText] = useState(value);

  useEffect(() => {
    if (!isNumeric) return;
    spring.set(numeric);
    return display.on("change", (latest) => setText(latest));
  }, [display, isNumeric, numeric, spring, value]);

  if (!isNumeric) return <span>{value}</span>;

  return (
    <motion.span
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {text}
    </motion.span>
  );
}
