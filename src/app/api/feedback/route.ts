import { cookies } from "next/headers";
import { z } from "zod";
import { redis } from "@/lib/db/redis";
import { REDIS_KEYS, REDIS_TTL } from "@/lib/constants";
import { getOrCreateVisitorId } from "@/lib/chat-history/visitor";
import { getSession, getMessages } from "@/lib/chat-history/store";
import {
  successResponse,
  validationError,
  handleApiError,
  errorResponse,
} from "@/lib/api/errors";
import type { Feedback } from "@/lib/types";

export const runtime = "edge";

const feedbackSchema = z.object({
  messageId: z.string().min(1),
  sessionId: z.string().min(1),
  rating: z.enum(["positive", "negative"]),
  comment: z.string().optional(),
});

// POST: Submit feedback for a message
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const visitorId = await getOrCreateVisitorId(cookieStore);

    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return validationError("Invalid JSON body");
    }

    const parsed = feedbackSchema.safeParse(requestBody);
    if (!parsed.success) {
      return validationError("Missing required fields: messageId, sessionId, rating");
    }

    const { messageId, sessionId, rating, comment } = parsed.data;

    const session = await getSession(sessionId);
    if (!session) {
      return errorResponse("Session not found", { status: 404, code: "NOT_FOUND" });
    }

    if (session.visitorId !== visitorId) {
      return errorResponse("Not authorized to submit feedback for this session", {
        status: 403,
        code: "UNAUTHORIZED",
      });
    }

    const messages = await getMessages(sessionId);
    const messageExists = messages.some((message) => message.id === messageId);
    if (!messageExists) {
      return errorResponse("Message not found", { status: 404, code: "NOT_FOUND" });
    }

    // Store feedback
    const feedback: Feedback = {
      visitorId,
      messageId,
      sessionId,
      rating,
      comment: comment || null,
      createdAt: Date.now(),
    };

    await redis.set(
      REDIS_KEYS.feedback(sessionId, messageId),
      JSON.stringify(feedback),
      { ex: REDIS_TTL.FEEDBACK }
    );

    // Update aggregate stats
    await redis.incr(REDIS_KEYS.feedbackStats(rating));

    return successResponse({ message: "Feedback submitted" });
  } catch (error) {
    return handleApiError(error);
  }
}
