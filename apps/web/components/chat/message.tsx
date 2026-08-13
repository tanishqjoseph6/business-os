"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/utils";
import type { ChatMessage } from "@repo/types";
import type { KairosState } from "../../lib/kairos";
import { KairosAvatar } from "../kairos/kairos-avatar";
import {
  extractMetricsFromContent,
  inferSmartActions,
  MetricsCard,
  SmartActionBar,
  ToolActivityList,
  type ToolActivity,
} from "./structured-response";
import { ClientTime } from "./client-time";
import { kairosModelDisplayName } from "@repo/ai/chat/kairos-models";

type MessageProps = {
  message: ChatMessage;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  canRegenerate?: boolean;
  kairosState?: KairosState;
  toolActivity?: ToolActivity[];
  onSmartAction?: (prompt: string) => void;
  smartActionsDisabled?: boolean;
};

function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = React.useState(false);
  const code = String(children).replace(/\n$/, "");

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const language = className?.replace("language-", "") ?? "code";

  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-border bg-[#0d0f14]">
      <div className="flex items-center justify-between border-b border-border/80 px-3 py-2 text-[11px] uppercase tracking-wide text-muted">
        <span>{language}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs opacity-0 transition group-hover:opacity-100"
          onClick={copy}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language === "code" ? "text" : language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "1rem",
          background: "transparent",
          fontSize: "13px",
          lineHeight: 1.6,
        }}
        codeTagProps={{ style: { fontFamily: "inherit" } }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export function Message({
  message,
  isStreaming,
  onRegenerate,
  canRegenerate,
  kairosState = "idle",
  toolActivity = [],
  onSmartAction,
  smartActionsDisabled,
}: MessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = React.useState(false);
  const metrics = !isUser ? extractMetricsFromContent(message.content) : null;
  const smartActions =
    !isUser && !isStreaming && message.content.trim()
      ? inferSmartActions(message.content)
      : [];

  async function copyMessage() {
    if (!message.content.trim()) return;
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className={cn(
        "group flex w-full gap-3 px-4 py-5 sm:gap-4 sm:px-6",
        isUser ? "justify-end bg-transparent" : "bg-transparent",
      )}
    >
      {!isUser ? (
        <div className="shrink-0 pt-0.5">
          <KairosAvatar
            size="xs"
            state={isStreaming ? "speaking" : kairosState}
            aria-label="Kairos"
          />
        </div>
      ) : null}

      <div
        className={cn(
          "min-w-0 space-y-2",
          isUser ? "max-w-[85%] sm:max-w-[70%]" : "flex-1",
        )}
      >
        {!isUser ? (
          <p className="flex items-baseline gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/90">
            <span>Kairos</span>
            {kairosModelDisplayName(message.model) ? (
              <span className="font-medium normal-case tracking-normal text-muted">
                {kairosModelDisplayName(message.model)}
              </span>
            ) : null}
          </p>
        ) : null}

        <div
          className={cn(
            isUser
              ? "rounded-2xl rounded-br-md border border-primary/20 bg-primary/15 px-4 py-3 text-sm leading-6 text-foreground"
              : "rounded-2xl border border-border/70 bg-[#12121a]/80 px-4 py-3 shadow-soft",
          )}
        >
          <div className="prose prose-invert max-w-none text-sm leading-relaxed text-foreground/95 prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-accent prose-code:rounded prose-code:bg-elevated prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[13px] prose-pre:p-0 prose-pre:bg-transparent">
            {isUser ? (
              <p className="m-0 whitespace-pre-wrap">{message.content}</p>
            ) : metrics ? (
              <p className="m-0 text-secondary">
                Here&apos;s a structured snapshot based on your workspace request.
              </p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const inline = !className;
                    if (inline) {
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                    return <CodeBlock className={className}>{children}</CodeBlock>;
                  },
                }}
              >
                {message.content || (isStreaming ? " " : "")}
              </ReactMarkdown>
            )}
          </div>

          {!isUser && metrics ? (
            <MetricsCard title={metrics.title} metrics={metrics.metrics} />
          ) : null}
          {!isUser && toolActivity.length > 0 ? (
            <ToolActivityList items={toolActivity} />
          ) : null}
          {!isUser && onSmartAction ? (
            <SmartActionBar
              actions={smartActions}
              onAction={onSmartAction}
              disabled={smartActionsDisabled}
            />
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <ClientTime
            iso={message.createdAt}
            className="text-[10px] text-muted/70"
          />
          <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
            {!isUser && message.content.trim() ? (
              <Button type="button" variant="ghost" size="sm" onClick={copyMessage}>
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                    Copy
                  </>
                )}
              </Button>
            ) : null}
            {!isUser && canRegenerate && onRegenerate ? (
              <Button type="button" variant="ghost" size="sm" onClick={onRegenerate}>
                Regenerate
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
