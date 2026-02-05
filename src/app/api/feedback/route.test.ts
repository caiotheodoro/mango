import { describe, it, expect, vi } from "vitest";
import { POST } from "./route";
import type { ChatMessage, ChatSession } from "@/lib/types";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/chat-history/visitor", () => ({
  getOrCreateVisitorId: vi.fn(),
}));

vi.mock("@/lib/chat-history/store", () => ({
  getSession: vi.fn(),
  getMessages: vi.fn(),
}));

vi.mock("@/lib/db/redis", () => ({
  redis: {
    set: vi.fn(),
    incr: vi.fn(),
  },
}));

import { cookies } from "next/headers";
import { getOrCreateVisitorId } from "@/lib/chat-history/visitor";
import { getSession, getMessages } from "@/lib/chat-history/store";
import { redis } from "@/lib/db/redis";

describe("POST /api/feedback", () => {
  it("returns 403 when visitor does not own session", async () => {
    const session: ChatSession = {
      id: "session-1",
      visitorId: "visitor-2",
      title: "Chat",
      createdAt: 1,
      updatedAt: 2,
      messageCount: 1,
    };
    vi.mocked(cookies).mockResolvedValueOnce({ get: vi.fn() } as never);
    vi.mocked(getOrCreateVisitorId).mockResolvedValueOnce("visitor-1");
    vi.mocked(getSession).mockResolvedValueOnce(session);

    const request = new Request("http://localhost/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        messageId: "message-1",
        sessionId: "session-1",
        rating: "positive",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      code: "UNAUTHORIZED",
    });
    expect(getMessages).not.toHaveBeenCalled();
  });

  it("returns 404 when message is not in session", async () => {
    const session: ChatSession = {
      id: "session-1",
      visitorId: "visitor-1",
      title: "Chat",
      createdAt: 1,
      updatedAt: 2,
      messageCount: 1,
    };
    vi.mocked(cookies).mockResolvedValueOnce({ get: vi.fn() } as never);
    vi.mocked(getOrCreateVisitorId).mockResolvedValueOnce("visitor-1");
    vi.mocked(getSession).mockResolvedValueOnce(session);
    vi.mocked(getMessages).mockResolvedValueOnce([]);

    const request = new Request("http://localhost/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        messageId: "message-1",
        sessionId: "session-1",
        rating: "negative",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      code: "NOT_FOUND",
    });
  });

  it("stores feedback for a valid message", async () => {
    const session: ChatSession = {
      id: "session-1",
      visitorId: "visitor-1",
      title: "Chat",
      createdAt: 1,
      updatedAt: 2,
      messageCount: 1,
    };
    const messages: ChatMessage[] = [
      {
        id: "message-1",
        role: "assistant",
        content: "Hello",
        createdAt: 1,
      },
    ];
    vi.mocked(cookies).mockResolvedValueOnce({ get: vi.fn() } as never);
    vi.mocked(getOrCreateVisitorId).mockResolvedValueOnce("visitor-1");
    vi.mocked(getSession).mockResolvedValueOnce(session);
    vi.mocked(getMessages).mockResolvedValueOnce(messages);

    const request = new Request("http://localhost/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        messageId: "message-1",
        sessionId: "session-1",
        rating: "positive",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
    });
    expect(redis.set).toHaveBeenCalled();
    expect(redis.incr).toHaveBeenCalled();
  });
});
