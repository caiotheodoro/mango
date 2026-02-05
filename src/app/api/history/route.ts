import { cookies } from "next/headers";
import { z } from "zod";
import {
  getSessionHistory,
  createSession,
  deleteSession,
} from "@/lib/chat-history/store";
import { getOrCreateVisitorId } from "@/lib/chat-history/visitor";
import {
  successResponse,
  validationError,
  handleApiError,
  errorResponse,
} from "@/lib/api/errors";
import { getSession } from "@/lib/chat-history/store";

export const runtime = "edge";

const deleteSessionSchema = z.object({
  sessionId: z.string().min(1),
});

// GET: Fetch chat history for visitor
export async function GET() {
  try {
    const cookieStore = await cookies();
    const visitorId = await getOrCreateVisitorId(cookieStore);

    const sessions = await getSessionHistory(visitorId);

    return successResponse({ sessions });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST: Create new session
export async function POST() {
  try {
    const cookieStore = await cookies();
    const visitorId = await getOrCreateVisitorId(cookieStore);

    const session = await createSession(visitorId);

    return successResponse({ session });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE: Delete a session
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const visitorId = await getOrCreateVisitorId(cookieStore);
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return validationError("Invalid JSON body");
    }

    const parsed = deleteSessionSchema.safeParse(requestBody);
    if (!parsed.success) {
      return validationError("Session ID is required");
    }

    const { sessionId } = parsed.data;

    const session = await getSession(sessionId);
    if (!session) {
      return errorResponse("Session not found", { status: 404, code: "NOT_FOUND" });
    }

    if (session.visitorId !== visitorId) {
      return errorResponse("Not authorized to delete this session", {
        status: 403,
        code: "UNAUTHORIZED",
      });
    }

    const deleted = await deleteSession(sessionId);

    return successResponse({ deleted });
  } catch (error) {
    return handleApiError(error);
  }
}
