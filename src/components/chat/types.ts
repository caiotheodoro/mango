// Re-export types from centralized location
// This maintains backwards compatibility with existing imports

export type {
  DisplayMessage,
  ToolInvocation,
  ImageData,
  ChatSessionDisplay as ChatSession, // UI uses display version
} from "@/lib/types";
