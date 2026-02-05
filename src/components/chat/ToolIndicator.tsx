"use client";

import { motion } from "framer-motion";
import { Search, Image, GitCompare, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolInvocation } from "./types";

interface ToolIndicatorProps {
  tool: Pick<ToolInvocation, "toolName" | "type" | "state">;
}

const TOOL_CONFIG: Record<string, { icon: React.ElementType; label: string }> = {
  searchKnowledge: {
    icon: Search,
    label: "Searching knowledge base",
  },
  getMangoImages: {
    icon: Image,
    label: "Fetching images",
  },
  compareVarieties: {
    icon: GitCompare,
    label: "Comparing varieties",
  },
};

function getToolName(t: Pick<ToolInvocation, "toolName" | "type">): string {
  return (
    t.toolName ??
    (typeof t.type === "string" && t.type.startsWith("tool-") ? t.type.slice(5) : "")
  );
}

export function ToolIndicator({ tool }: ToolIndicatorProps) {
  const name = getToolName(tool);
  const config = TOOL_CONFIG[name] || {
    icon: Search,
    label: name,
  };

  const Icon = config.icon;
  const isLoading =
    tool.state === "call" ||
    tool.state === "partial-call" ||
    tool.state === "input-streaming" ||
    tool.state === "input-available";
  const isComplete =
    tool.state === "result" || tool.state === "output-available";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
        "text-xs font-medium border",
        "bg-[var(--color-user-bg)] border-[var(--color-input-border)] text-[var(--color-user-ink)]"
      )}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-ink-muted)]" />
      ) : isComplete ? (
        <Check className="h-3.5 w-3.5 text-[var(--color-success)]" />
      ) : (
        <Icon className="h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
      )}
      <span>{config.label}</span>
      {isLoading && (
        <motion.div className="flex gap-0.5" initial="hidden" animate="visible">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-1 w-1 rounded-full bg-[var(--color-ink-soft)]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
