"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ChatSidebar } from "./ChatSidebar";
import { WelcomeScreen } from "./WelcomeScreen";
import { AdoptLogo } from "./AdoptLogo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Plus } from "lucide-react";
import { useChatMessages, useChatInput, useChatSessions } from "./hooks";

export function ChatContainer() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Initialize sessionId from localStorage so it's correct from first render
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mango-current-session");
    }
    return null;
  });
  // Track when user explicitly wants a new chat (New Chat or Delete current)
  const [forceNewSession, setForceNewSession] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Adopt session ID from API when we had none (keeps one chat per conversation)
  // Also clear forceNewSession once we have a session
  const adoptSessionId = useCallback((id: string) => {
    setSessionId((prev) => {
      if (prev === null) {
        // New session created - remember it for page reloads
        localStorage.setItem("mango-current-session", id);
        return id;
      }
      return prev;
    });
    setForceNewSession(false);
  }, []);

  // Chat messages
  const { messages, isLoading, status, error, sendMessage, setMessages, regenerate } =
    useChatMessages({ sessionId, forceNewSession, onSessionIdFromResponse: adoptSessionId });

  // Input handling
  const {
    value: inputValue,
    setValue: setInputValue,
    handleSubmit,
    handleSuggestionClick,
    clear: clearInput,
  } = useChatInput({
    onSubmit: sendMessage,
    isLoading,
  });

  // Session management
  const {
    sessions,
    isInitialized,
    loadHistory,
    loadSession: rawLoadSession,
    deleteSession: rawDeleteSession,
    startNewChat: rawStartNewChat,
  } = useChatSessions({
    sessionId,
    onSessionIdChange: setSessionId,
    onMessagesChange: setMessages,
    onClearInput: clearInput,
    onCloseSidebar: closeSidebar,
  });

  // Wrap loadSession to clear forceNewSession when switching to existing chat
  const loadSession = useCallback(
    async (id: string, closeSidebar?: boolean) => {
      setForceNewSession(false); // Clear flag when loading existing session
      await rawLoadSession(id, closeSidebar);
    },
    [rawLoadSession]
  );

  // Wrap startNewChat to set forceNewSession flag
  const startNewChat = useCallback(() => {
    rawStartNewChat();
    setForceNewSession(true);
  }, [rawStartNewChat]);

  // Wrap deleteSession to set forceNewSession flag if deleting current session
  const deleteSession = useCallback(
    (id: string) => {
      const isDeletingCurrent = id === sessionId;
      rawDeleteSession(id);
      if (isDeletingCurrent) {
        setForceNewSession(true);
      }
    },
    [rawDeleteSession, sessionId]
  );

  const handleRetry = useCallback(() => {
    regenerate();
  }, [regenerate]);

  const showWelcome = messages.length === 0 && !isLoading && isInitialized;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--color-page-bg)]">
      {/* Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          title="Chat History"
          description="View and manage your previous conversations"
          className="w-80 p-0 border-r border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-bg)]"
        >
          <ChatSidebar
            sessions={sessions}
            currentSessionId={sessionId}
            onSelectSession={loadSession}
            onNewChat={startNewChat}
            onDeleteSession={deleteSession}
          />
        </SheetContent>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Header */}
          <Header
            onMenuClick={loadHistory}
            onNewChat={startNewChat}
          />

          {/* Messages or Welcome */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {!isInitialized ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex items-center justify-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[var(--color-accent-terracotta)] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-[var(--color-ink-muted)]">Loading...</span>
                  </div>
                </motion.div>
              ) : showWelcome ? (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
                </motion.div>
              ) : (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <ChatMessages
                    messages={messages}
                    status={status}
                    error={error}
                    onRetry={handleRetry}
                    sessionId={sessionId}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input */}
          <ChatInput
            input={inputValue}
            setInput={setInputValue}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </Sheet>
    </div>
  );
}

// Extracted Header component for cleaner JSX
interface HeaderProps {
  onMenuClick: () => void;
  onNewChat: () => void;
}

function Header({ onMenuClick, onNewChat }: HeaderProps) {
  return (
    <header className="flex items-center gap-3 px-4 md:px-6 py-4 border-b border-[var(--color-sidebar-border)] bg-[var(--color-card)]/90 shadow-editorial">
      {/* Menu Button */}
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-[var(--color-ink)] hover:bg-[var(--color-paper)]"
          onClick={onMenuClick}
          aria-label="Open chat history"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      {/* Logo & Title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <AdoptLogo />
        <div
          className="hidden sm:block h-6 w-px bg-[var(--color-input-border)] opacity-50"
          aria-hidden
        />
        <h1
          className="hidden sm:block text-base md:text-lg font-semibold text-[var(--color-ink)] truncate"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Brazilian Mango Expert
        </h1>
      </div>

      {/* New Chat Button */}
      <Button
        variant="outline"
        size="default"
        onClick={onNewChat}
        className="shrink-0 gap-2 rounded-xl text-sm md:text-base border-[var(--color-input-border)] text-[var(--color-ink)] hover:bg-[var(--color-paper)] hover:border-[var(--color-accent-terracotta)]/30"
      >
        <Plus className="h-4 w-4 md:h-5 md:w-5" />
        <span className="hidden sm:inline">New Chat</span>
      </Button>
    </header>
  );
}
