import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/db/redis";
import {
  VISITOR_COOKIE_NAME,
  VISITOR_COOKIE_MAX_AGE,
} from "@/lib/chat-history/visitor";
import { v4 as uuidv4 } from "uuid";

const ratelimit = new Ratelimit({
  redis,
  // 20 requests per minute for chat
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: "mango-ratelimit",
});

function normalizeIp(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim() ?? "";
  if (!first) return null;
  const isValid = /^[0-9a-fA-F:.]+$/.test(first);
  return isValid ? first : null;
}

export function getClientIp(request: NextRequest): string | null {
  const directIp = (request as { ip?: string }).ip ?? null;
  if (directIp) {
    return normalizeIp(directIp);
  }
  const headerValue =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    null;
  return normalizeIp(headerValue);
}

// Next.js 16 proxy function (formerly middleware)
export default async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Set visitor cookie if not present
  const visitorId = request.cookies.get(VISITOR_COOKIE_NAME)?.value;
  if (!visitorId) {
    response.cookies.set(VISITOR_COOKIE_NAME, uuidv4(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: VISITOR_COOKIE_MAX_AGE,
      path: "/",
    });
  }

  // Apply rate limiting to chat API
  if (request.nextUrl.pathname.startsWith("/api/chat")) {
    const ip = getClientIp(request);
    const identifier = visitorId || ip || "anonymous";

    try {
      const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

      // Add rate limit headers
      response.headers.set("X-RateLimit-Limit", limit.toString());
      response.headers.set("X-RateLimit-Remaining", remaining.toString());
      response.headers.set("X-RateLimit-Reset", reset.toString());

      if (!success) {
        return NextResponse.json(
          {
            error: "Too many requests. Please wait before sending more messages.",
            code: "RATE_LIMIT",
            retryAfter: Math.ceil((reset - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": reset.toString(),
              "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
            },
          }
        );
      }
    } catch (error) {
      // Don't block requests if rate limiting fails
      console.error("Rate limiting error:", error);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all API routes
    "/api/:path*",
    // Match main pages for visitor cookie
    "/",
  ],
};
