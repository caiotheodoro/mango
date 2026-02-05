"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorMessageProps {
  error: Error;
  onRetry?: () => void;
}

// Parse error message for user-friendly display
function getErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes("rate limit")) {
      return "You're sending messages too quickly. Please wait a moment before trying again.";
    }

    if (message.includes("network") || message.includes("fetch")) {
      return "Network error. Please check your connection and try again.";
    }

    if (message.includes("timeout")) {
      return "The request took too long. Please try again.";
    }

  return "Something went wrong. Please try again or start a new conversation.";
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <Card className="max-w-md p-4 border-[var(--color-destructive)]/20 bg-red-50/80 shadow-editorial">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-[var(--color-destructive)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 mb-1">
              Unable to get response
            </p>
            <p className="text-sm text-red-700 mb-3">
              {getErrorMessage(error)}
            </p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-2 border-red-200 text-red-700 hover:bg-red-100 rounded-xl"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
