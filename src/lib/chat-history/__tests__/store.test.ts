import { describe, it, expect, vi } from "vitest";
import { getMessages, getSession } from "../store";

vi.mock("@/lib/db/redis", () => ({
  redis: {
    get: vi.fn(),
    lrange: vi.fn(),
    set: vi.fn(),
    rpush: vi.fn(),
    zadd: vi.fn(),
    zrange: vi.fn(),
    del: vi.fn(),
    zrem: vi.fn(),
  },
}));

import { redis } from "@/lib/db/redis";
import type { ChatMessage, ChatSession } from "@/lib/types";

describe("chat history store parsing", () => {
  it("parses a JSON string session", async () => {
    const session: ChatSession = {
      id: "session-1",
      visitorId: "visitor-1",
      title: "New Chat",
      createdAt: 1,
      updatedAt: 2,
      messageCount: 0,
    };
    vi.mocked(redis.get).mockResolvedValueOnce(JSON.stringify(session));

    const result = await getSession("session-1");
    expect(result).toEqual(session);
  });

  it("parses JSON string messages and keeps objects", async () => {
    const messageA: ChatMessage = {
      id: "message-a",
      role: "user",
      content: "Hello",
      createdAt: 1,
    };
    const messageB: ChatMessage = {
      id: "message-b",
      role: "assistant",
      content: "Hi!",
      createdAt: 2,
    };
    vi.mocked(redis.lrange).mockResolvedValueOnce([
      JSON.stringify(messageA),
      messageB,
    ]);

    const result = await getMessages("session-1");
    expect(result).toEqual([messageA, messageB]);
  });
});
