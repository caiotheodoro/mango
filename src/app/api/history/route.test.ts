import { describe, it, expect, vi } from "vitest";
import { DELETE } from "./route";
import type { ChatSession } from "@/lib/types";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/chat-history/visitor", () => ({
  getOrCreateVisitorId: vi.fn(),
}));

vi.mock("@/lib/chat-history/store", () => ({
  getSession: vi.fn(),
  deleteSession: vi.fn(),
}));

import { cookies } from "next/headers";
import { getOrCreateVisitorId } from "@/lib/chat-history/visitor";
import { getSession, deleteSession } from "@/lib/chat-history/store";

describe("DELETE /api/history", () => {
  it("returns 404 when session is missing", async () => {
    vi.mocked(cookies).mockResolvedValueOnce({ get: vi.fn() } as never);
    vi.mocked(getOrCreateVisitorId).mockResolvedValueOnce("visitor-1");
    vi.mocked(getSession).mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/history", {
      method: "DELETE",
      body: JSON.stringify({ sessionId: "session-1" }),
    });

    const response = await DELETE(request);
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      code: "NOT_FOUND",
    });
  });

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

    const request = new Request("http://localhost/api/history", {
      method: "DELETE",
      body: JSON.stringify({ sessionId: "session-1" }),
    });

    const response = await DELETE(request);
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      code: "UNAUTHORIZED",
    });
  });

  it("deletes when visitor owns session", async () => {
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
    vi.mocked(deleteSession).mockResolvedValueOnce(true);

    const request = new Request("http://localhost/api/history", {
      method: "DELETE",
      body: JSON.stringify({ sessionId: "session-1" }),
    });

    const response = await DELETE(request);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      deleted: true,
    });
  });
});
