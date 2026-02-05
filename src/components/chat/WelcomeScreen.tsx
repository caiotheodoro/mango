"use client";

import { motion } from "framer-motion";

interface WelcomeScreenProps {
  onSuggestionClick: (question: string) => void;
}

const suggestedQuestions = [
  "What are the main mango varieties grown in Brazil?",
  "When is mango season in Brazil?",
  "How much mango does Brazil export?",
  "What are the nutritional benefits of Brazilian mangos?",
  "Where are mangos grown in Brazil?",
  "Show me images of typical brazilian mangos",
];

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-12 overflow-auto relative">
      {/* Subtle diagonal accent — editorial stripe */}
      <div
        className="absolute top-0 right-0 w-[min(80vw,420px)] h-[min(60vh,400px)] opacity-[0.06] pointer-events-none"
        style={{
          background: "linear-gradient(135deg, var(--color-accent-terracotta) 0%, transparent 60%)",
          clipPath: "polygon(100% 0, 100% 100%, 0 0)",
        }}
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-3xl w-full flex flex-col gap-10 text-center relative z-10"
      >
        <h1
          className="font-display text-3xl md:text-4xl font-normal text-[var(--color-ink)] tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Ask anything about Brazilian mangos
        </h1>
        <p className="text-[var(--color-ink-muted)] text-base md:text-lg max-w-xl mx-auto">
          Varieties, seasons, exports, nutrition — with sources and images when you need them.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {suggestedQuestions.map((question, index) => (
            <motion.button
              key={question}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: 0.12 + index * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={() => onSuggestionClick(question)}
              className="rounded-2xl px-5 py-3.5 text-left text-base font-medium cursor-pointer transition-all border border-[var(--color-input-border)] bg-[var(--color-page-bg)] text-[var(--color-ink)] hover:border-[var(--color-accent-terracotta)]/40 hover:bg-[var(--color-user-bg)] hover:text-[var(--color-user-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-terracotta)] focus:ring-offset-2 focus:ring-offset-[var(--color-page-bg)] active:scale-[0.98]"
            >
              {question}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
