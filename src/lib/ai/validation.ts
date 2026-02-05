/**
 * Citation validation utilities for anti-hallucination checks
 */

// Regex to extract URLs from markdown links and plain URLs
const URL_REGEX = /https?:\/\/[^\s\)>\]"']+/gi;

interface ValidationResult {
  valid: boolean;
  citedUrls: string[];
  knownUrls: string[];
  unknownUrls: string[];
}

/**
 * Extract all URLs from a text string
 */
export function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX);
  if (!matches) return [];
  // Deduplicate and normalize (remove trailing punctuation)
  const urls = matches.map((url) => url.replace(/[.,;:!?)]+$/, ""));
  return [...new Set(urls)];
}

/**
 * Validate that all citations in the response come from tool results
 *
 * @param responseText - The AI's response text
 * @param toolResults - Array of tool results that may contain sourceUrl
 * @returns Validation result with lists of known and unknown URLs
 */
export function validateCitations(
  responseText: string,
  toolResults: Array<{ sourceUrl?: string; output?: { results?: Array<{ sourceUrl?: string }> } }>
): ValidationResult {
  // Extract URLs from response
  const citedUrls = extractUrls(responseText);

  // Collect all known URLs from tool results
  const knownUrls = new Set<string>();

  for (const result of toolResults) {
    // Direct sourceUrl
    if (result.sourceUrl) {
      knownUrls.add(result.sourceUrl);
    }
    // Nested in output.results (searchKnowledge format)
    if (result.output?.results) {
      for (const r of result.output.results) {
        if (r.sourceUrl) {
          knownUrls.add(r.sourceUrl);
        }
      }
    }
  }

  // Find URLs in response that weren't in tool results
  const unknownUrls = citedUrls.filter((url) => !knownUrls.has(url));

  return {
    valid: unknownUrls.length === 0,
    citedUrls,
    knownUrls: [...knownUrls],
    unknownUrls,
  };
}

/**
 * Log citation validation warnings (dev mode only)
 */
export function logCitationWarnings(
  result: ValidationResult,
  context?: string
): void {
  if (result.valid) return;

  console.warn(
    `[Citation Warning]${context ? ` ${context}:` : ""} Found ${result.unknownUrls.length} unverified URL(s):`
  );
  for (const url of result.unknownUrls) {
    console.warn(`  - ${url}`);
  }
  console.warn(`  Known URLs from tools: ${result.knownUrls.join(", ") || "(none)"}`);
}
