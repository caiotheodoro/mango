"use client";

import { useMemo, useCallback, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ChatTransport, type UIMessage } from "ai";
import type { DisplayMessage } from "../types";

interface UseChatMessagesOptions {
  sessionId: string | null;
  /** When true, API will create a new session instead of reusing recent ones */
  forceNewSession?: boolean;
  /** When the API returns X-Session-Id (e.g. new session), call this so the client can adopt it and stay in one chat */
  onSessionIdFromResponse?: (id: string) => void;
}

export type ChatStatus = "submitted" | "streaming" | "ready" | "error";

interface UseChatMessagesReturn {
  messages: DisplayMessage[];
  rawMessages: ReturnType<typeof useChat>["messages"];
  isLoading: boolean;
  status: ChatStatus;
  error: Error | undefined;
  sendMessage: (text: string) => Promise<void>;
  setMessages: ReturnType<typeof useChat>["setMessages"];
  regenerate: () => void;
}

// Module-level storage for dynamic values (read in async fetch, not during render)
// This pattern avoids linter warnings about ref access during render
const dynamicValues = {
  sessionId: null as string | null,
  forceNewSession: undefined as boolean | undefined,
  onSessionIdFromResponse: undefined as ((id: string) => void) | undefined,
};

// Stable transport instance (module singleton)
let transportInstance: ChatTransport<UIMessage> | null = null;

function getTransport(): ChatTransport<UIMessage> {
  if (!transportInstance) {
    transportInstance = new DefaultChatTransport({
      api: "/api/chat",
      fetch: async (url, init) => {
        let originalBody: Record<string, unknown> = {};
        if (init?.body && typeof init.body === "string") {
          try {
            const parsed = JSON.parse(init.body);
            if (parsed && typeof parsed === "object") {
              originalBody = parsed as Record<string, unknown>;
            }
          } catch {
            originalBody = {};
          }
        }
        const newBody = {
          ...originalBody,
          sessionId: dynamicValues.sessionId,
          forceNewSession: dynamicValues.forceNewSession,
        };
        const newInit = {
          ...init,
          body: JSON.stringify(newBody),
        };
        
        const res = await fetch(url, newInit);
        const sid = res.headers.get("X-Session-Id");
        if (res.ok && sid && dynamicValues.onSessionIdFromResponse) {
          dynamicValues.onSessionIdFromResponse(sid);
        }
        return res;
      },
    });
  }
  return transportInstance;
}

export function useChatMessages({
  sessionId,
  forceNewSession,
  onSessionIdFromResponse,
}: UseChatMessagesOptions): UseChatMessagesReturn {
  // Update module-level values that will be read in async fetch callback
  useEffect(() => {
    dynamicValues.sessionId = sessionId;
    dynamicValues.forceNewSession = forceNewSession;
    dynamicValues.onSessionIdFromResponse = onSessionIdFromResponse;
  });

  // Get stable transport (module singleton)
  const transport = useMemo(() => getTransport(), []);

  const {
    messages: rawMessages,
    sendMessage: sdkSendMessage,
    status,
    error,
    setMessages,
    regenerate,
  } = useChat({ transport });

  const isLoading = status === "streaming" || status === "submitted";

  // Transform SDK messages to display format
  const messages = useMemo<DisplayMessage[]>(() => {
    return rawMessages.map((m) => {
      const textContent =
        m.parts
          ?.filter(
            (p): p is { type: "text"; text: string } => p.type === "text"
          )
          .map((p) => p.text)
          .join("") || "";

      // AI SDK uses part type "tool-{toolName}" (e.g. "tool-getMangoImages"), not "tool-invocation"
      const toolInvocations =
        m.parts?.filter(
          (p) =>
            p.type === "tool-invocation" ||
            (typeof p.type === "string" &&
              (p.type.startsWith("tool-") || p.type === "dynamic-tool"))
        ) || [];

      return {
        id: m.id,
        role: m.role as "user" | "assistant",
        content: textContent,
        toolInvocations,
      };
    });
  }, [rawMessages]);

  // Simplified send message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      await sdkSendMessage({ text: text.trim() });
    },
    [isLoading, sdkSendMessage]
  );

  return {
    messages,
    rawMessages,
    isLoading,
    status: status as ChatStatus,
    error,
    sendMessage,
    setMessages,
    regenerate,
  };
}
