import { getSession, getMessages } from "@/lib/chat-history/store";
import {
  successResponse,
  notFoundError,
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

    const messages = await getMessages(sessionId);

    return successResponse({ session, messages });
  } catch (error) {
    return handleApiError(error);
  }
}
