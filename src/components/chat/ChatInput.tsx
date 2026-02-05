"use client";

import { useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  isLoading,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`;
    }
  }, [input]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (input.trim() && !isLoading) {
          onSubmit(e as unknown as React.FormEvent);
        }
      }
    },
    [input, isLoading, onSubmit]
  );

  return (
    <div className="border-t border-[var(--color-sidebar-border)] bg-[var(--color-card)]/80 p-5 md:p-8">
      <form onSubmit={onSubmit} className="max-w-4xl mx-auto">
        <div className="relative flex items-end">
          <div
            className={cn(
              "flex-1 relative flex items-end bg-[var(--color-card)] rounded-2xl border-2 transition-all duration-200",
              isLoading
                ? "border-[var(--color-input-border)] opacity-60 cursor-not-allowed"
                : "hover:border-[var(--color-accent-terracotta)]/30 border-[var(--color-input-border)]"
            )}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => !isLoading && setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? "Waiting for response..." : "Ask something about Brazilian mangos..."}
              className={cn(
                "flex-1 resize-none bg-transparent px-5 py-5 pr-16",
                "min-h-[72px] max-h-[240px] text-lg rounded-2xl",
                "focus:outline-none placeholder:text-[var(--color-placeholder)]",
                isLoading && "cursor-not-allowed select-none"
              )}
              style={{ color: "var(--color-ink)" }}
              rows={1}
              disabled={isLoading}
              readOnly={isLoading}
              aria-label="Chat message input"
              aria-describedby="input-hint"
              aria-busy={isLoading}
            />
            <span id="input-hint" className="sr-only">
              {isLoading ? "Please wait for the AI response" : "Press Enter to send, Shift+Enter for new line"}
            </span>
            <div className="absolute right-3 bottom-3">
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "h-12 w-12 rounded-xl text-white transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "bg-[var(--color-send-btn)] hover:bg-[var(--color-accent-terracotta-soft)]"
                )}
                aria-label={isLoading ? "Waiting for response" : "Send message"}
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <ArrowUp className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
