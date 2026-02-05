"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MarkdownContent } from "./MarkdownContent";
import { Sparkles } from "lucide-react";

interface StreamingContentProps {
  content: string;
  isStreaming: boolean;
}

/**
 * Sanitize content during streaming to remove incomplete markdown patterns.
 * This prevents showing broken syntax like `![alt](url` or `[text](url` mid-stream.
 */
function sanitizeStreamingContent(content: string, isStreaming: boolean): string {
  if (!isStreaming) return content;
  
  let sanitized = content;
  
  // Remove incomplete image markdown: ![...](... without closing )
  // Match from the last ![  that doesn't have a complete ](...)
  const lastImageStart = sanitized.lastIndexOf("![");
  if (lastImageStart !== -1) {
    const afterImageStart = sanitized.slice(lastImageStart);
    // Check if this image markdown is complete: ![alt](url)
    const completeImagePattern = /^!\[[^\]]*\]\([^)]*\)/;
    if (!completeImagePattern.test(afterImageStart)) {
      // Incomplete image, remove it
      sanitized = sanitized.slice(0, lastImageStart);
    }
  }
  
  // Remove incomplete link markdown: [...](... without closing )
  // But not images (which start with !)
  const lastLinkStart = sanitized.lastIndexOf("[");
  if (lastLinkStart !== -1 && (lastLinkStart === 0 || sanitized[lastLinkStart - 1] !== "!")) {
    const afterLinkStart = sanitized.slice(lastLinkStart);
    // Check if this link markdown is complete: [text](url)
    const completeLinkPattern = /^\[[^\]]*\]\([^)]*\)/;
    if (!completeLinkPattern.test(afterLinkStart)) {
      // Check if we're inside the brackets or the parens
      const hasClosingBracket = afterLinkStart.includes("](");
      if (hasClosingBracket) {
        // We're in the URL part, remove the incomplete link
        sanitized = sanitized.slice(0, lastLinkStart);
      } else if (afterLinkStart.includes("]")) {
        // Bracket closed but no paren - might be fine, keep it
      } else {
        // Still typing inside brackets - remove
        sanitized = sanitized.slice(0, lastLinkStart);
      }
    }
  }
  
  // Remove incomplete bold/italic at the end
  // If ends with single * or _ that's not paired
  const endsWithUnpairedMarker = /(\*{1,2}|_{1,2})$/.test(sanitized);
  if (endsWithUnpairedMarker) {
    sanitized = sanitized.replace(/(\*{1,2}|_{1,2})$/, "");
  }
  
  return sanitized.trim();
}

/**
 * Gemini-style streaming content renderer.
 * - Never shows an empty box
 * - Smooth character reveal animation
 * - Filters incomplete markdown during streaming
 * - Stable container size
 */
export function StreamingContent({ content, isStreaming }: StreamingContentProps) {
  const [revealedLength, setRevealedLength] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);
  const animationRef = useRef<number | null>(null);
  const prevContentRef = useRef<string>("");
  
  // Stabilize container height - only grow, never shrink during streaming
  useEffect(() => {
    if (isStreaming && containerRef.current) {
      const currentHeight = containerRef.current.offsetHeight;
      setMinHeight(prev => Math.max(prev || 0, currentHeight));
    } else if (!isStreaming) {
      setMinHeight(undefined);
    }
  }, [isStreaming, revealedLength]);
  
  // Handle content changes and streaming state with animation
  useEffect(() => {
    // Reset when content is cleared - use timeout to make it async
    if (!content && prevContentRef.current) {
      prevContentRef.current = "";
      const timer = setTimeout(() => setRevealedLength(0), 0);
      return () => clearTimeout(timer);
    }
    
    // Reveal all immediately when streaming stops
    if (!isStreaming && content) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      // Use requestAnimationFrame to avoid synchronous setState
      const frame = requestAnimationFrame(() => setRevealedLength(content.length));
      prevContentRef.current = content;
      return () => cancelAnimationFrame(frame);
    }

    // Animate reveal during streaming
    if (content && content.length > revealedLength) {
      const animate = () => {
        setRevealedLength(prev => {
          const targetLength = content.length;
          const remaining = targetLength - prev;
          const increment = Math.max(5, Math.ceil(remaining * 0.2));
          const next = prev + increment;
          
          if (next >= targetLength) {
            animationRef.current = null;
            return targetLength;
          }
          
          animationRef.current = requestAnimationFrame(animate);
          return next;
        });
      };
      
      animationRef.current = requestAnimationFrame(animate);
      prevContentRef.current = content;
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [content, isStreaming, revealedLength]);

  // Show typing indicator when streaming but no content yet
  if (!content && isStreaming) {
    return (
      <div className="flex items-center gap-2 text-[var(--color-ink-muted)] min-h-[24px]">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-4 w-4 text-[var(--color-accent-terracotta)]" />
        </motion.div>
        <span className="text-sm">Generating response</span>
        <span className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1 h-1 rounded-full bg-[var(--color-accent-terracotta)]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </span>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  // Get revealed and sanitized content
  const revealedRaw = content.slice(0, revealedLength);
  const displayContent = sanitizeStreamingContent(revealedRaw, isStreaming);
  const hasMoreToReveal = revealedLength < content.length;

  return (
    <div 
      ref={containerRef}
      className="streaming-content relative"
      style={{ minHeight: minHeight ? `${minHeight}px` : undefined }}
    >
      <MarkdownContent content={displayContent} />
      
      {/* Typing cursor */}
      {(isStreaming || hasMoreToReveal) && (
        <motion.span
          className="inline-block w-0.5 h-4 bg-[var(--color-accent-terracotta)] ml-0.5 align-middle rounded-full"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
