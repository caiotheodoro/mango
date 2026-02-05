"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles } from "lucide-react";

/**
 * Displays a "thinking" state before the AI starts streaming its response.
 * Shows an engaging pulsing animation to indicate the AI is processing.
 */
export function ThinkingIndicator() {
  return (
    <div className="flex gap-3 items-start" role="status" aria-label="AI is thinking">
      <Avatar className="h-10 w-10 shrink-0 bg-[var(--color-accent-terracotta)]">
        <AvatarFallback className="bg-transparent">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span role="img" aria-label="Mango" className="text-lg">
              🥭
            </span>
          </motion.div>
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-2">
        <motion.div
          className="rounded-2xl rounded-bl-md px-5 py-4 border border-[var(--color-input-border)] bg-[var(--color-card)] shadow-editorial"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7] 
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-4 w-4 text-[var(--color-accent-terracotta)]" />
            </motion.div>
            
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-[var(--color-accent-terracotta)]"
                  animate={{
                    y: [0, -6, 0],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
        
        <motion.p 
          className="text-sm pl-1 text-[var(--color-ink-muted)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Thinking...
        </motion.p>
      </div>
    </div>
  );
}
