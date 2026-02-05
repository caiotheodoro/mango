// ============================================
// CENTRALIZED TYPE DEFINITIONS
// All shared types for the application
// ============================================

// ---------- Chat & Messages ----------

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
}

export interface ChatSession {
  id: string;
  visitorId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

// Display-friendly version for UI (dates as strings, no visitorId)
export interface ChatSessionDisplay {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

// ---------- Display Types (Frontend) ----------

export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolInvocations?: any[];
}

export interface ToolInvocation {
  /** SDK may omit this and use type "tool-{name}" instead */
  toolName?: string;
  /** Static tool parts have type "tool-getMangoImages" etc. */
  type?: string;
  /** AI SDK: output-available, input-streaming, input-available; we also support result */
  state:
    | "call"
    | "partial-call"
    | "result"
    | "output-available"
    | "input-streaming"
    | "input-available";
  /** SDK stores tool result here - can be any tool result structure */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output?: any;
  /** Legacy / alternate */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any;
}

export interface ImageData {
  url: string;
  thumbnail?: string;
  alt: string;
  credit: {
    name: string;
    link: string;
  };
}

// ---------- API Types ----------

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: ErrorCode;
}

export type ErrorCode =
  | "RATE_LIMIT"
  | "CONFIG_ERROR"
  | "INTERNAL_ERROR"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "UNAUTHORIZED";

// ---------- Knowledge Base ----------

export interface KnowledgeMetadata {
  source: string;
  sourceUrl?: string;
  category: KnowledgeCategory;
  content: string;
  dataDate?: string;
}

export interface SearchResult {
  content: string;
  score: number;
  metadata: KnowledgeMetadata;
}

export type KnowledgeCategory =
  | "varieties"
  | "nutrition"
  | "seasons"
  | "exports"
  | "cultivation"
  | "general";

// ---------- Images ----------

export interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
}

// ---------- Feedback ----------

export interface Feedback {
  visitorId: string;
  messageId: string;
  sessionId: string;
  rating: "positive" | "negative";
  comment?: string | null;
  createdAt: number;
}
