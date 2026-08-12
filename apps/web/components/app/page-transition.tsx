"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFullBleedChat =
    pathname === "/chat" || pathname.startsWith("/chat/");

  if (isFullBleedChat) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col">{children}</div>
    );
  }

  return (
    <motion.div
      key={pathname}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
