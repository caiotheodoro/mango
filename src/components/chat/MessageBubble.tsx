"use client";

import { useState, useCallback } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, ThumbsUp, ThumbsDown, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolIndicator } from "./ToolIndicator";
import { ImageGrid } from "./ImageGrid";
import { StreamingContent } from "./StreamingContent";
import { MarkdownContent } from "./MarkdownContent";
import type { DisplayMessage, ToolInvocation } from "./types";

interface MessageBubbleProps {
  message: DisplayMessage;
  isStreaming?: boolean;
  sessionId?: string | null;
}

export function MessageBubble({ message, isStreaming = false, sessionId }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(
    null
  );

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const handleFeedback = useCallback(
    async (rating: "positive" | "negative") => {
      if (!sessionId) return;
      setFeedback(rating);
      try {
        await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId: message.id,
            sessionId,
            rating,
          }),
        });
      } catch (err) {
        console.error("Failed to submit feedback:", err);
      }
    },
    [message.id, sessionId]
  );

  const toolInvocations = (message.toolInvocations || []) as ToolInvocation[];
  // Resolve tool name: SDK may put it in .toolName or in .type (e.g. "tool-getMangoImages")
  const getToolName = (t: ToolInvocation) =>
    t.toolName ?? (typeof t.type === "string" && t.type.startsWith("tool-") ? t.type.slice(5) : "");
  
  // Deduplicate tool indicators by name - show only ONE indicator per tool type
  const uniqueTools = toolInvocations.reduce((acc, tool) => {
    const name = getToolName(tool);
    // Prefer completed state over loading state
    const existing = acc.get(name);
    const isComplete = tool.state === "result" || tool.state === "output-available";
    if (!existing || isComplete) {
      acc.set(name, tool);
    }
    return acc;
  }, new Map<string, ToolInvocation>());
  const uniqueToolList = Array.from(uniqueTools.values());
  
  // AI SDK uses state 'output-available' and stores result in .output, not .result
  // Handle both direct images array and nested {success, images} structure
  const imageResults = toolInvocations
    .filter(
      (t) =>
        getToolName(t) === "getMangoImages" &&
        (t.state === "result" || t.state === "output-available")
    )
    .flatMap((t) => {
      const data = t.output ?? t.result;
      if (!data) return [];
      // Handle both { images: [...] } and direct array
      if (Array.isArray(data)) return data;
      if (typeof data === "object" && "images" in data && Array.isArray(data.images)) {
        return data.images;
      }
      return [];
    });

  return (
    <div
      className={cn(
        "flex gap-3 group",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar
        className={cn(
          "h-10 w-10 shrink-0",
          isUser && "bg-[var(--color-user-ink)]",
          isAssistant && "bg-[var(--color-accent-terracotta)]"
        )}
      >
        <AvatarFallback className="bg-transparent text-base">
          {isUser ? (
            <User className="h-5 w-5 text-white" />
          ) : (
            <span role="img" aria-label="Mango">
              🥭
            </span>
          )}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "flex flex-col max-w-[85%] gap-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        {!isUser && uniqueToolList.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {uniqueToolList.map((tool, index) => (
              <ToolIndicator key={index} tool={tool} />
            ))}
          </div>
        )}

        {/* Show images as soon as they're available (before or during text) */}
        {!isUser && imageResults.length > 0 && (
          <ImageGrid images={imageResults} />
        )}

        <div
          className={cn(
            "rounded-2xl px-5 py-4",
            isUser
              ? "rounded-br-md bg-[var(--color-user-bg)] text-[var(--color-user-ink)]"
              : "bg-[var(--color-card)] border border-[var(--color-input-border)] rounded-bl-md shadow-editorial text-[var(--color-ink)]"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap m-0 leading-relaxed text-base">
              {message.content}
            </p>
          ) : isStreaming ? (
            <StreamingContent content={message.content} isStreaming={true} />
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>

        {isAssistant && message.content && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              onClick={handleCopy}
              aria-label={copied ? "Copied" : "Copy message"}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-[var(--color-success)]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7",
                feedback === "positive"
                  ? "text-[var(--color-success)]"
                  : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              )}
              onClick={() => handleFeedback("positive")}
              aria-label="Good response"
              aria-pressed={feedback === "positive"}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7",
                feedback === "negative"
                  ? "text-[var(--color-destructive)]"
                  : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              )}
              onClick={() => handleFeedback("negative")}
              aria-label="Bad response"
              aria-pressed={feedback === "negative"}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
