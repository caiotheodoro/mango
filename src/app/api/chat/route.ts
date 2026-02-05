import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { userWantsMangoImages } from "@/lib/ai/intent";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { chatTools } from "@/lib/ai/tools";
import { validateCitations, logCitationWarnings } from "@/lib/ai/validation";
import { addMessage, getOrCreateSessionForConversation, createSession } from "@/lib/chat-history/store";
import { getOrCreateVisitorId } from "@/lib/chat-history/visitor";
import { AI_CONFIG } from "@/lib/constants";
import { cookies } from "next/headers";

// Segment configs must be static values (not references)
export const runtime = "edge";
export const maxDuration = 60;

/**
 * Extract text content from UIMessage parts
 */
function extractTextFromParts(parts: UIMessage["parts"]): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export async function POST(request: Request) {
  try {
    // Parse request - AI SDK sends UIMessage format with parts
    const { messages, sessionId: providedSessionId, forceNewSession } = (await request.json()) as {
      messages: UIMessage[];
      sessionId?: string;
      forceNewSession?: boolean;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ success: false, error: "Messages array is required", code: "BAD_REQUEST" }),
        { status: 400 }
      );
    }

    // Get or create visitor/session
    const cookieStore = await cookies();
    const visitorId = await getOrCreateVisitorId(cookieStore);

    // Use provided sessionId, or create new/reuse based on forceNewSession flag
    let sessionId = providedSessionId;
    if (!sessionId) {
      // If user explicitly requested a new chat, always create fresh session
      if (forceNewSession) {
        const session = await createSession(visitorId);
        sessionId = session.id;
      } else {
        // Otherwise reuse recent conversation if within time window
        const session = await getOrCreateSessionForConversation(visitorId);
        sessionId = session.id;
      }
    }

    // Get the latest user message and extract text content
    const latestMessage = messages[messages.length - 1];
    const lastUserText =
      latestMessage?.role === "user" && latestMessage.parts
        ? extractTextFromParts(latestMessage.parts)
        : "";
    if (lastUserText) {
      await addMessage(sessionId, {
        role: "user",
        content: lastUserText,
      });
    }

    // Convert UIMessages to ModelMessages using AI SDK utility
    const modelMessages = await convertToModelMessages(messages);

    // Create streaming response with multi-step tool execution
    const result = streamText({
      model: anthropic(AI_CONFIG.MODEL),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      tools: chatTools,
      stopWhen: stepCountIs(5),
      prepareStep: ({ stepNumber }) => {
        if (stepNumber === 0 && userWantsMangoImages(lastUserText)) {
          return {
            toolChoice: { type: "tool" as const, toolName: "getMangoImages" },
            activeTools: ["getMangoImages"],
          };
        }
        return {};
      },
      onFinish: async ({ text, steps }) => {
        // Collect all tool calls from all steps (multi-step tool execution)
        const allToolCalls: Array<{ name: string; args: Record<string, unknown>; result: unknown }> = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allToolResults: any[] = [];
        
        for (const step of steps || []) {
          if (step.toolCalls && step.toolResults) {
            for (let i = 0; i < step.toolCalls.length; i++) {
              const tc = step.toolCalls[i] as { toolName: string; args?: Record<string, unknown> };
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const tr = step.toolResults[i] as any;
              // AI SDK toolResults can have result directly or nested - try both
              const resultValue = tr?.result ?? tr;
              allToolCalls.push({
                name: tc.toolName,
                args: tc.args ?? {},
                result: resultValue,
              });
              // Collect for citation validation
              allToolResults.push(resultValue);
            }
          }
        }

        // Dev mode: validate citations against tool results
        if (process.env.NODE_ENV === "development" && text) {
          const validationResult = validateCitations(text, allToolResults);
          if (!validationResult.valid) {
            logCitationWarnings(validationResult, `Session ${sessionId}`);
          }
        }

        // Store assistant response with tool results
        if (text || allToolCalls.length > 0) {
          await addMessage(sessionId, {
            role: "assistant",
            content: text || "",
            toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
          });
        }
      },
    });

    // Return UIMessage stream response (correct format for useChat)
    return result.toUIMessageStreamResponse({
      headers: {
        "X-Session-Id": sessionId,
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Rate limit exceeded. Please wait a moment.",
            code: "RATE_LIMIT",
          }),
          { status: 429 }
        );
      }

      if (error.message.includes("API key")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Service configuration error.",
            code: "CONFIG_ERROR",
          }),
          { status: 500 }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Something went wrong. Please try again.",
        code: "INTERNAL_ERROR",
      }),
      { status: 500 }
    );
  }
}
