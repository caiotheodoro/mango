// ============================================
// CENTRALIZED CONSTANTS
// All magic numbers and strings in one place
// ============================================

// ---------- Session & Auth ----------

export const VISITOR_COOKIE_NAME = "mango_visitor_id";
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

// ---------- Redis TTLs ----------

export const REDIS_TTL = {
  SESSION: 60 * 60 * 24 * 30, // 30 days
  FEEDBACK: 60 * 60 * 24 * 90, // 90 days
  IMAGE_CACHE: 60 * 60, // 1 hour
} as const;

// ---------- Redis Key Patterns ----------

export const REDIS_KEYS = {
  session: (id: string) => `session:${id}`,
  sessionMessages: (id: string) => `session:${id}:messages`,
  visitorSessions: (visitorId: string) => `visitor:${visitorId}:sessions`,
  feedback: (sessionId: string, messageId: string) =>
    `feedback:${sessionId}:${messageId}`,
  feedbackStats: (rating: string) => `feedback:stats:${rating}`,
} as const;

// ---------- API Limits ----------

export const API_LIMITS = {
  MAX_MESSAGES_PER_REQUEST: 100,
  MAX_SESSIONS_HISTORY: 20,
  MAX_IMAGES_PER_REQUEST: 5,
  MAX_SEARCH_RESULTS: 5,
  // BGE embeddings return scores in 0.01-0.05 range for good matches
  MIN_SEARCH_SCORE: 0.01,
} as const;

// ---------- AI Configuration ----------

export const AI_CONFIG = {
  MODEL: "claude-sonnet-4-20250514",
  MAX_DURATION: 60,
} as const;

// ---------- External APIs ----------

export const EXTERNAL_APIS = {
  UNSPLASH_BASE_URL: "https://api.unsplash.com",
} as const;
