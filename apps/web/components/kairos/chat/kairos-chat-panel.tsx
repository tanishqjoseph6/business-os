"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import type { ChatConversation, ChatMessage } from "@repo/types";
import type { AiProviderId } from "@repo/ai";
import { KAIROS_DEFAULT_MODEL, parseKairosPlanId, type KairosPlanId } from "@repo/ai/chat/kairos-models";
import { X } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Spinner } from "@repo/ui/spinner";
import {
  getChatBootstrapAction,
  listChatConversationsAction,
} from "../../../app/(protected)/actions/chat";
import { ChatLayout } from "../../chat/chat-layout";
import { useKairosChat } from "./kairos-chat-provider";

type PanelBootstrap = {
  conversations: ChatConversation[];
  initialModel: string;
  initialProvider: AiProviderId;
  creditBalance: number;
  plan: KairosPlanId;
};

export function KairosChatPanel() {
  const { isOpen, initialPrompt, closeChat } = useKairosChat();
  const [bootstrap, setBootstrap] = useState<PanelBootstrap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      const [settings, conversations] = await Promise.all([
        getChatBootstrapAction(),
        listChatConversationsAction({}),
      ]);

      if (cancelled) return;

      if (!settings.ok) {
        setError(settings.error);
        setBootstrap(null);
        setLoading(false);
        return;
      }

      if (!conversations.ok) {
        setError(conversations.error);
        setBootstrap(null);
        setLoading(false);
        return;
      }

      setBootstrap({
        conversations: conversations.data.conversations,
        initialModel: KAIROS_DEFAULT_MODEL,
        initialProvider: "openai",
        creditBalance: settings.data.credits.balance,
        plan: parseKairosPlanId(settings.data.plan),
      });
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [isOpen, retryNonce]);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeChat();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, closeChat]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Close Kairos chat"
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeChat}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Kairos AI chat"
            className="fixed inset-0 z-[75] flex flex-col bg-background"
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.99 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Kairos
                </p>
                <p className="text-sm text-secondary">Your AI workspace assistant</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/chat">
                  <Button type="button" variant="secondary" size="sm" onClick={closeChat}>
                    Open full chat
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Close"
                  onClick={closeChat}
                >
                  <X className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1">
              {loading ? (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <div className="w-full max-w-xl space-y-3 px-6" aria-hidden>
                    <div className="h-4 w-32 animate-pulse rounded bg-elevated" />
                    <div className="h-4 w-full animate-pulse rounded bg-elevated" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-elevated" />
                  </div>
                  <Spinner label="Loading Kairos" />
                  <p className="text-sm text-secondary">Preparing your assistant…</p>
                </div>
              ) : error ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                  <p className="text-sm text-error">{error}</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => setRetryNonce((value) => value + 1)}>
                      Retry
                    </Button>
                    <Button type="button" variant="ghost" onClick={closeChat}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : bootstrap ? (
                <ChatLayout
                  variant="panel"
                  streamEndpoint="/api/kairos/chat"
                  initialConversations={bootstrap.conversations}
                  initialMessages={[] as ChatMessage[]}
                  initialModel={bootstrap.initialModel}
                  initialProvider={bootstrap.initialProvider}
                  initialCreditBalance={bootstrap.creditBalance}
                  plan={bootstrap.plan}
                  initialPrompt={initialPrompt}
                />
              ) : null}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
