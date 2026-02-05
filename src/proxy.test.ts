import { describe, it, expect } from "vitest";
import { getClientIp } from "./proxy";

function makeRequest({
  ip,
  xForwardedFor,
  xRealIp,
}: {
  ip?: string | null;
  xForwardedFor?: string;
  xRealIp?: string;
}) {
  const headers = new Headers();
  if (xForwardedFor) headers.set("x-forwarded-for", xForwardedFor);
  if (xRealIp) headers.set("x-real-ip", xRealIp);
  return { ip, headers } as unknown as Parameters<typeof getClientIp>[0];
}

describe("getClientIp", () => {
  it("prefers direct request ip when available", () => {
    const request = makeRequest({
      ip: "203.0.113.10",
      xForwardedFor: "198.51.100.2",
    });
    expect(getClientIp(request)).toBe("203.0.113.10");
  });

  it("uses the first x-forwarded-for entry", () => {
    const request = makeRequest({
      xForwardedFor: "198.51.100.2, 10.0.0.1",
    });
    expect(getClientIp(request)).toBe("198.51.100.2");
  });

  it("falls back to x-real-ip when x-forwarded-for is missing", () => {
    const request = makeRequest({
      xRealIp: "203.0.113.22",
    });
    expect(getClientIp(request)).toBe("203.0.113.22");
  });

  it("returns null for invalid values", () => {
    const request = makeRequest({
      xForwardedFor: "not-an-ip",
    });
    expect(getClientIp(request)).toBeNull();
  });
});
