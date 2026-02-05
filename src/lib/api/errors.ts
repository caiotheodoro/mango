import { NextResponse } from "next/server";
import type { ErrorCode, ApiResponse } from "@/lib/types";

// ============================================
// API ERROR HANDLING UTILITIES
// Consistent error responses across all routes
// ============================================

interface ErrorResponseOptions {
  status?: number;
  code?: ErrorCode;
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  message: string,
  options: ErrorResponseOptions = {}
): NextResponse<ApiResponse> {
  const { status = 500, code = "INTERNAL_ERROR" } = options;

  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
    },
    { status }
  );
}

/**
 * Create a standardized success response
 * Spreads the data object at root level for backwards compatibility
 */
export function successResponse<T extends object>(data: T): NextResponse {
  return NextResponse.json({
    success: true,
    ...data,
  });
}

/**
 * Handle common API errors and return appropriate responses
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error("API Error:", error);

  if (error instanceof Error) {
    // Rate limit errors
    if (error.message.includes("rate limit")) {
      return errorResponse("Rate limit exceeded. Please wait a moment.", {
        status: 429,
        code: "RATE_LIMIT",
      });
    }

    // API key / config errors
    if (error.message.includes("API key") || error.message.includes("config")) {
      return errorResponse("Service configuration error.", {
        status: 500,
        code: "CONFIG_ERROR",
      });
    }

    // Not found errors
    if (error.message.includes("not found")) {
      return errorResponse(error.message, {
        status: 404,
        code: "NOT_FOUND",
      });
    }
  }

  // Generic error
  return errorResponse("Something went wrong. Please try again.", {
    status: 500,
    code: "INTERNAL_ERROR",
  });
}

/**
 * Validation error helper
 */
export function validationError(message: string): NextResponse<ApiResponse> {
  return errorResponse(message, {
    status: 400,
    code: "BAD_REQUEST",
  });
}

/**
 * Not found error helper
 */
export function notFoundError(resource: string): NextResponse<ApiResponse> {
  return errorResponse(`${resource} not found`, {
    status: 404,
    code: "NOT_FOUND",
  });
}
