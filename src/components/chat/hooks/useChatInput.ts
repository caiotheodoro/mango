"use client";

import { useState, useCallback } from "react";

interface UseChatInputOptions {
  onSubmit: (text: string) => Promise<void>;
  isLoading: boolean;
}

interface UseChatInputReturn {
  value: string;
  setValue: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleSuggestionClick: (suggestion: string) => void;
  clear: () => void;
}

export function useChatInput({
  onSubmit,
  isLoading,
}: UseChatInputOptions): UseChatInputReturn {
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!value.trim() || isLoading) return;

      const message = value.trim();
      setValue("");
      await onSubmit(message);
    },
    [value, isLoading, onSubmit]
  );

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setValue(suggestion);
  }, []);

  const clear = useCallback(() => {
    setValue("");
  }, []);

  return {
    value,
    setValue,
    handleSubmit,
    handleSuggestionClick,
    clear,
  };
}
