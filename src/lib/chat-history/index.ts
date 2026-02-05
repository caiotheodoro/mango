export {
  createSession,
  getSession,
  addMessage,
  getMessages,
  getSessionHistory,
  deleteSession,
} from "./store";

export {
  getOrCreateVisitorId,
  getVisitorIdFromCookie,
  VISITOR_COOKIE_NAME,
  VISITOR_COOKIE_MAX_AGE,
} from "./visitor";

// Re-export types
export type { ChatMessage, ChatSession, ToolCall } from "./store";
