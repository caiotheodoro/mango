"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import type { ChatSessionDisplay } from "@/lib/types";

const CURRENT_SESSION_KEY = "mango-current-session";

interface UseChatSessionsOptions {
  /** Current session ID (managed by parent) */
  sessionId: string | null;
  /** Callback to update session ID */
  onSessionIdChange: (id: string | null) => void;
  /** Callback to set messages when loading a session */
  onMessagesChange: (messages: UIMessage[]) => void;
  /** Callback to clear input when starting new chat or deleting current session */
  onClearInput: () => void;
  /** Callback when sidebar should close */
  onCloseSidebar?: () => void;
}

interface UseChatSessionsReturn {
  /** List of all sessions */
  sessions: ChatSessionDisplay[];
  /** Whether initial load is complete */
  isInitialized: boolean;
  /** Refresh the sessions list */
  loadHistory: () => Promise<ChatSessionDisplay[]>;
  /** Load a specific session by ID */
  loadSession: (id: string, closeSidebar?: boolean) => Promise<void>;
  /** Delete a session by ID */
  deleteSession: (id: string) => void;
  /** Start a new chat (clears state, session created on first message) */
  startNewChat: () => void;
}

export function useChatSessions({
  sessionId,
  onSessionIdChange,
  onMessagesChange,
  onClearInput,
  onCloseSidebar,
}: UseChatSessionsOptions): UseChatSessionsReturn {
  const [sessions, setSessions] = useState<ChatSessionDisplay[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const initRef = useRef(false);

  // Load session history from API
  const loadHistory = useCallback(async (): Promise<ChatSessionDisplay[]> => {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
        return data.sessions;
      }
      return [];
    } catch (err) {
      console.error("Failed to load history:", err);
      return [];
    }
  }, []);

  // Load a specific session by ID
  const loadSession = useCallback(
    async (id: string, closeSidebar = true) => {
      try {
        const res = await fetch(`/api/history/${id}`);
        const data = await res.json();
        if (data.success) {
          onSessionIdChange(id);
          // Remember this session for page reloads
          localStorage.setItem(CURRENT_SESSION_KEY, id);
          const chatMessages: UIMessage[] = data.messages.map(
            (m: {
              id: string;
              role: string;
              content: string;
              toolCalls?: Array<{ name: string; args: Record<string, unknown>; result?: unknown }>;
            }) => {
              // Build parts array - start with text if present
              const parts: UIMessage["parts"] = [];
              if (m.content) {
                parts.push({ type: "text" as const, text: m.content });
              }
              // Add tool invocation parts for images and other tools
              if (m.toolCalls && m.toolCalls.length > 0) {
                m.toolCalls.forEach((tc, tcIndex) => {
                  // The stored result can be nested: { type: "tool-result", output: {...} }
                  // Extract the actual output from the wrapper
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const storedResult = tc.result as any;
                  const actualOutput = storedResult?.output ?? storedResult;
                  // Try to get original toolCallId from stored result, or generate unique one
                  const originalId = storedResult?.toolCallId;
                  const toolCallId = originalId || `stored-${m.id}-${tcIndex}-${tc.name}`;
                  
                  // Use the format that MessageBubble expects (cast through unknown for TS)
                  parts.push({
                    type: `tool-${tc.name}`,
                    toolName: tc.name,
                    toolCallId,
                    state: "output-available",
                    output: actualOutput,
                    input: tc.args,
                  } as unknown as UIMessage["parts"][number]);
                });
              }
              return {
                id: m.id,
                role: m.role as "user" | "assistant",
                parts,
              };
            }
          );
          onMessagesChange(chatMessages);
          if (closeSidebar) {
            onCloseSidebar?.();
          }
        }
      } catch (err) {
        console.error("Failed to load session:", err);
      }
    },
    [onSessionIdChange, onMessagesChange, onCloseSidebar]
  );

  // Delete a session - if deleting current session, clear and mark for new chat
  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      // If deleting the current session, clear the chat
      if (id === sessionId) {
        onSessionIdChange(null);
        onMessagesChange([]);
        onClearInput();
        // Clear stored session so reload shows welcome screen
        localStorage.removeItem(CURRENT_SESSION_KEY);
      }
    },
    [sessionId, onSessionIdChange, onMessagesChange, onClearInput]
  );

  // Start a new chat: just clear state, session created on first message
  const startNewChat = useCallback(() => {
    onSessionIdChange(null);
    onMessagesChange([]);
    onClearInput();
    onCloseSidebar?.();
    // Clear stored session so reload shows welcome screen
    localStorage.removeItem(CURRENT_SESSION_KEY);
  }, [onSessionIdChange, onMessagesChange, onClearInput, onCloseSidebar]);

  // Initialize: load history and restore the session the user was viewing
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function init() {
      const loadedSessions = await loadHistory();
      
      // Check localStorage for the session the user was in before reload
      const savedSessionId = localStorage.getItem(CURRENT_SESSION_KEY);
      
      if (savedSessionId) {
        // Verify the session still exists
        const sessionExists = loadedSessions.some((s) => s.id === savedSessionId);
        if (sessionExists) {
          await loadSession(savedSessionId, false);
          setIsInitialized(true);
          return;
        }
        // Session was deleted, clear localStorage
        localStorage.removeItem(CURRENT_SESSION_KEY);
      }
      
      // Fallback: load the most recent session if it exists
      if (loadedSessions.length > 0) {
        const latestSession = loadedSessions[0]; // Sessions are sorted by updatedAt desc
        await loadSession(latestSession.id, false);
      }
      setIsInitialized(true);
    }

    init();
  }, [loadHistory, loadSession]);

  return {
    sessions,
    isInitialized,
    loadHistory,
    loadSession,
    deleteSession,
    startNewChat,
  };
}
