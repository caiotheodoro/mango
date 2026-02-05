"use client";

import { useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatSession } from "./types";

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onLoad?: () => void;
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onLoad,
}: ChatSidebarProps) {
  // Load history on mount
  useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  // Group sessions by date
  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <div className="h-full flex flex-col bg-[var(--color-sidebar-bg)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-sidebar-border)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl" role="img" aria-label="Mango">
            🥭
          </div>
          <div>
            <h2 className="font-semibold text-sm text-[var(--color-ink)]">
              Mango Expert
            </h2>
            <p className="text-xs text-[var(--color-ink-muted)]">Chat History</p>
          </div>
        </div>
        <Button
          onClick={onNewChat}
          className="w-full gap-2 rounded-xl bg-[var(--color-send-btn)] text-white hover:bg-[var(--color-accent-terracotta-soft)]"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-auto p-2">
        {Object.entries(groupedSessions).map(([date, dateSessions]) => (
          <div key={date} className="mb-4">
            <p className="text-xs text-[var(--color-ink-muted)] px-2 mb-2 font-medium uppercase tracking-wide">
              {date}
            </p>
            <div className="space-y-1">
              {dateSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={session.id === currentSessionId}
                  onClick={() => onSelectSession(session.id)}
                  onDelete={() => onDeleteSession(session.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="text-center py-8 px-4">
            <MessageSquare className="h-8 w-8 mx-auto text-[var(--color-ink-soft)] mb-2" />
            <p className="text-sm text-[var(--color-ink-muted)]">
              No conversations yet
            </p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">
              Start a new chat to begin
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--color-sidebar-border)]">
        <a
          href="https://adopt.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-accent-terracotta)] transition-colors text-center block cursor-pointer underline-offset-2 hover:underline"
        >
          Built with Adopt AI
        </a>
      </div>
    </div>
  );
}

// Session item component
interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

function SessionItem({ session, isActive, onClick, onDelete }: SessionItemProps) {
  const handleDelete = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const res = await fetch("/api/history", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: session.id }),
        });
        if (res.ok) {
          onDelete();
        }
      } catch (err) {
        console.error("Failed to delete session:", err);
      }
    },
    [session.id, onDelete]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-xl cursor-pointer",
        "flex items-center gap-3 group",
        "transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-terracotta)] focus-visible:ring-offset-1",
        isActive
          ? "bg-[var(--color-card)] text-[var(--color-ink)] shadow-editorial border border-[var(--color-input-border)]"
          : "hover:bg-[var(--color-card)]/70 border border-transparent text-[var(--color-ink-muted)]"
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <MessageSquare
        className={cn(
          "h-4 w-4 shrink-0",
          isActive
            ? "text-[var(--color-accent-terracotta)]"
            : "text-[var(--color-ink-soft)]"
        )}
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm truncate font-medium",
            isActive
              ? "text-[var(--color-ink)]"
              : "text-[var(--color-ink-muted)]"
          )}
        >
          {session.title}
        </p>
        <p className="text-xs text-[var(--color-ink-soft)]">
          {session.messageCount} message{session.messageCount !== 1 ? "s" : ""}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-ink-soft)] hover:text-[var(--color-destructive)]"
        onClick={handleDelete}
        aria-label="Delete conversation"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </motion.div>
  );
}

// Helper function to group sessions by date
function groupSessionsByDate(
  sessions: ChatSession[]
): Record<string, ChatSession[]> {
  const groups: Record<string, ChatSession[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  sessions.forEach((session) => {
    const date = new Date(session.createdAt);
    let label: string;

    if (date >= today) {
      label = "Today";
    } else if (date >= yesterday) {
      label = "Yesterday";
    } else if (date >= lastWeek) {
      label = "Previous 7 Days";
    } else {
      label = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(session);
  });

  return groups;
}
