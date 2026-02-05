"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PLACEHOLDER_MOBILE = "Ask about Brazilian mangos...";
const PLACEHOLDER_DESKTOP = "Ask something about Brazilian mangos...";

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
  const [placeholder, setPlaceholder] = useState(PLACEHOLDER_DESKTOP);

  useEffect(() => {
    const m = window.matchMedia("(max-width: 768px)");
    const update = () => setPlaceholder(m.matches ? PLACEHOLDER_MOBILE : PLACEHOLDER_DESKTOP);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);

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
    <div className="border-t border-[var(--color-sidebar-border)] bg-[var(--color-card)]/80 p-3 md:p-8">
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
              placeholder={isLoading ? "Waiting for response..." : placeholder}
              className={cn(
                "flex-1 resize-none bg-transparent px-4 py-2.5 md:px-5 md:py-5 pr-12 md:pr-16",
                "min-h-[44px] md:min-h-[72px] max-h-[240px] text-base md:text-lg rounded-2xl",
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
            <div className="absolute right-2 bottom-1 md:right-3 md:bottom-3">
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "h-9 w-9 md:h-12 md:w-12 rounded-lg md:rounded-xl text-white transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "bg-[var(--color-send-btn)] hover:bg-[var(--color-accent-terracotta-soft)]"
                )}
                aria-label={isLoading ? "Waiting for response" : "Send message"}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" />
                ) : (
                  <ArrowUp className="h-5 w-5 md:h-6 md:w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
