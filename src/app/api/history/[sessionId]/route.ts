import { cookies } from "next/headers";
import { getSession, getMessages } from "@/lib/chat-history/store";
import { getOrCreateVisitorId } from "@/lib/chat-history/visitor";
import {
  successResponse,
  notFoundError,
  errorResponse,
  handleApiError,
} from "@/lib/api/errors";

export const runtime = "edge";

// GET: Fetch messages for a specific session
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = await getSession(sessionId);

    if (!session) {
      return notFoundError("Session");
    }

    const cookieStore = await cookies();
    const visitorId = await getOrCreateVisitorId(cookieStore);
    if (session.visitorId !== visitorId) {
      return errorResponse("Not authorized to access this session", {
        status: 403,
        code: "UNAUTHORIZED",
      });
    }

    const messages = await getMessages(sessionId);

    return successResponse({ session, messages });
  } catch (error) {
    return handleApiError(error);
  }
}
