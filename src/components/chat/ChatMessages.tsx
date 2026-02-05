"use client";

import { useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { ErrorMessage } from "./ErrorMessage";
import type { DisplayMessage } from "./types";
import type { ChatStatus } from "./hooks";

interface ChatMessagesProps {
  messages: DisplayMessage[];
  status: ChatStatus;
  error?: Error;
  onRetry?: () => void;
  sessionId?: string | null;
}

export function ChatMessages({
  messages,
  status,
  error,
  onRetry,
  sessionId,
}: ChatMessagesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  // Check if user is near the bottom of the scroll container
  const isNearBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    
    const threshold = 150; // pixels from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // Handle scroll events to track user scroll position
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const currentScrollTop = container.scrollTop;
    const isScrollingUp = currentScrollTop < lastScrollTopRef.current;
    
    // If user scrolls up while not near bottom, mark as scrolled up
    if (isScrollingUp && !isNearBottom()) {
      userScrolledUpRef.current = true;
    }
    
    // If user scrolls to bottom, reset the flag
    if (isNearBottom()) {
      userScrolledUpRef.current = false;
    }
    
    lastScrollTopRef.current = currentScrollTop;
  }, [isNearBottom]);

  // Smart auto-scroll: only scroll if user hasn't scrolled up
  useEffect(() => {
    // Don't auto-scroll if user has scrolled up to read
    if (userScrolledUpRef.current) return;
    
    // Smooth scroll to bottom
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, status]);

  // Scroll to bottom on initial load or when user sends a message
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "user") {
      // User just sent a message, always scroll to bottom
      userScrolledUpRef.current = false;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Determine streaming state
  const lastMessage = messages[messages.length - 1];
  const hasAssistantMessage = lastMessage?.role === "assistant";
  const isStreaming = (status === "streaming" || status === "submitted") && hasAssistantMessage;
  
  // Only show ThinkingIndicator when waiting for first response (no assistant message yet)
  const showThinking = status === "submitted" && !hasAssistantMessage;

  return (
    <ScrollArea className="h-full">
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
      >
        <div className="max-w-4xl mx-auto px-5 md:px-8 py-8 space-y-8">
          {messages.map((message, index) => {
            const isLastAssistant = index === messages.length - 1 && message.role === "assistant";
            const isMessageStreaming = isLastAssistant && isStreaming;
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <MessageBubble 
                  message={message} 
                  isStreaming={isMessageStreaming}
                  sessionId={sessionId}
                />
              </motion.div>
            );
          })}

          <AnimatePresence mode="wait">
            {showThinking && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                transition={{ duration: 0.2 }}
              >
                <ThinkingIndicator />
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ErrorMessage error={error} onRetry={onRetry} />
            </motion.div>
          )}

          <div ref={bottomRef} className="h-1" />
        </div>
      </div>
    </ScrollArea>
  );
}

// Re-export type for backwards compatibility
export type { DisplayMessage };
