"use client";

import { motion } from "framer-motion";
import { KairosAvatar } from "./kairos-avatar";
import { useKairosChat } from "./chat/kairos-chat-provider";

export function KairosFab() {
  const { toggleChat } = useKairosChat();

  return (
    <motion.div
      className="fixed bottom-5 left-5 z-30 sm:bottom-6 sm:left-6"
      initial={false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
    >
      <button
        type="button"
        onClick={toggleChat}
        className="bos-glass-strong group flex items-center gap-3 rounded-full border border-primary/20 py-2 pl-2 pr-4 shadow-elevated transition hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label="Ask Kairos"
      >
        <KairosAvatar size="sm" interactive state="idle" aria-label="" />
        <span className="text-sm font-semibold text-foreground">Ask Kairos</span>
      </button>
    </motion.div>
  );
}
