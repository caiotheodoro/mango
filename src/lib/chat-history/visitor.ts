import { v4 as uuidv4 } from "uuid";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { VISITOR_COOKIE_NAME, VISITOR_COOKIE_MAX_AGE } from "@/lib/constants";

// Re-export constants for convenience
export { VISITOR_COOKIE_NAME, VISITOR_COOKIE_MAX_AGE };

/**
 * Get or create a visitor ID from cookies
 * This enables anonymous session persistence
 */
export async function getOrCreateVisitorId(
  cookieStore: ReadonlyRequestCookies
): Promise<string> {
  // Try to get existing visitor ID
  const existingId = cookieStore.get(VISITOR_COOKIE_NAME)?.value;

  if (existingId) {
    return existingId;
  }

  // Create new visitor ID
  const newId = uuidv4();

  // Note: Cookie will be set by the client or middleware
  // This function just returns the ID
  return newId;
}

/**
 * Get visitor ID for client-side use
 */
export function getVisitorIdFromCookie(
  cookieValue: string | undefined
): string {
  if (cookieValue) {
    return cookieValue;
  }
  return uuidv4();
}
