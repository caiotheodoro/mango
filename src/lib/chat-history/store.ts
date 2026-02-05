import { v4 as uuidv4 } from "uuid";
import { redis } from "@/lib/db/redis";
import { REDIS_KEYS, REDIS_TTL } from "@/lib/constants";
import type { ChatMessage, ChatSession, ToolCall } from "@/lib/types";

// Re-export types for convenience
export type { ChatMessage, ChatSession, ToolCall };

function parseMaybeJson<T>(value: T | string | null): T | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value as T;
}

function logRedisError(action: string, error: unknown) {
  console.error(`Redis error (${action}):`, error);
}

/**
 * Create a new chat session
 */
export async function createSession(visitorId: string): Promise<ChatSession> {
  const session: ChatSession = {
    id: uuidv4(),
    visitorId,
    title: "New Chat",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messageCount: 0,
  };

  try {
    // Store session
    await redis.set(REDIS_KEYS.session(session.id), session, {
      ex: REDIS_TTL.SESSION,
    });

    // Add to visitor's session list (sorted by creation time)
    await redis.zadd(REDIS_KEYS.visitorSessions(visitorId), {
      score: session.createdAt,
      member: session.id,
    });
  } catch (error) {
    logRedisError("createSession", error);
  }

  return session;
}

/**
 * Get a session by ID
 */
export async function getSession(
  sessionId: string
): Promise<ChatSession | null> {
  try {
    // Upstash auto-parses JSON, so we get the object directly
    const data = await redis.get<ChatSession | string>(REDIS_KEYS.session(sessionId));
    return parseMaybeJson<ChatSession>(data);
  } catch (error) {
    logRedisError("getSession", error);
    return null;
  }
}

/**
 * Add a message to a session
 */
export async function addMessage(
  sessionId: string,
  message: Omit<ChatMessage, "id" | "createdAt">
): Promise<ChatMessage> {
  const fullMessage: ChatMessage = {
    ...message,
    id: uuidv4(),
    createdAt: Date.now(),
  };

  try {
    // Add message to list
    await redis.rpush(
      REDIS_KEYS.sessionMessages(sessionId),
      fullMessage
    );

    // Update session
    const session = await getSession(sessionId);
    if (session) {
      // Generate title from first user message (with defensive check)
      if (session.messageCount === 0 && message.role === "user" && message.content) {
        const content = message.content.trim();
        session.title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      }

      session.updatedAt = Date.now();
      session.messageCount += 1;

      await redis.set(REDIS_KEYS.session(sessionId), session, {
        ex: REDIS_TTL.SESSION,
      });
    }
  } catch (error) {
    logRedisError("addMessage", error);
  }

  return fullMessage;
}

/**
 * Get all messages for a session
 */
export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
  try {
    // Upstash auto-parses JSON in lists too
    const messages = await redis.lrange<ChatMessage | string>(
      REDIS_KEYS.sessionMessages(sessionId),
      0,
      -1
    );
    return messages
      .map((m) => parseMaybeJson<ChatMessage>(m))
      .filter((m): m is ChatMessage => m !== null);
  } catch (error) {
    logRedisError("getMessages", error);
    return [];
  }
}

/**
 * Get all sessions for a visitor (newest by creation first)
 */
export async function getSessionHistory(
  visitorId: string,
  limit: number = 20
): Promise<ChatSession[]> {
  try {
    const sessionIds = await redis.zrange<string[]>(
      REDIS_KEYS.visitorSessions(visitorId),
      0,
      limit - 1,
      { rev: true }
    );

    if (sessionIds.length === 0) {
      return [];
    }

    const sessions = await Promise.all(sessionIds.map((id) => getSession(id)));
    const valid = sessions.filter((s): s is ChatSession => s !== null);
    // Return sorted by updatedAt desc so "current" conversation is first
    return valid.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    logRedisError("getSessionHistory", error);
    return [];
  }
}

/** Reuse a session if it was updated recently (same conversation) */
const RECENT_SESSION_MS = 90_000; // 90 seconds

export async function getOrCreateSessionForConversation(
  visitorId: string
): Promise<ChatSession> {
  const sessions = await getSessionHistory(visitorId, 10);
  const mostRecent = sessions[0]; // already sorted by updatedAt desc
  if (
    mostRecent &&
    Date.now() - mostRecent.updatedAt < RECENT_SESSION_MS
  ) {
    return mostRecent;
  }
  return createSession(visitorId);
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const session = await getSession(sessionId);
    if (!session) return false;

    // Delete session data
    await redis.del(REDIS_KEYS.session(sessionId));
    await redis.del(REDIS_KEYS.sessionMessages(sessionId));

    // Remove from visitor's list
    await redis.zrem(REDIS_KEYS.visitorSessions(session.visitorId), sessionId);

    return true;
  } catch (error) {
    logRedisError("deleteSession", error);
    return false;
  }
}
