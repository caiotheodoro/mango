/**
 * Detect when the user is asking to see mango images.
 * Used to force getMangoImages tool call on first step.
 * Includes "manga" (Portuguese for mango) and "picture" (singular).
 */
const IMAGE_REQUEST_PATTERNS = [
  /\b(show|get|send|fetch)\s+(me\s+)?(a\s+)?(some\s+)?(mango|mangoes|manga|mangas|brazilian\s+mango)/i,
  /\b(images?|pictures?|photos?)\s+(of|of\s+typical\s+)?(a\s+)?(brazilian\s+)?(mango|mangoes|manga|mangas|espada\s+manga?)/i,
  /\b(mango|mangoes|manga|mangas)\s+(images?|pictures?|photos?)/i,
  /\b(see|want\s+to\s+see)\s+(a\s+)?(some\s+)?(mango|mangoes|manga|mangas|images?|pictures?|photos?)/i,
  /\b(show\s+me\s+)?(a\s+)?(images?|pictures?|photos?)\s+(of\s+)?(a\s+)?(typical\s+)?(brazilian\s+)?(mango|mangoes|manga|mangas|espada\s+manga?)/i,
];

export function userWantsMangoImages(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const normalized = text.trim().toLowerCase();
  if (!normalized) return false;
  return IMAGE_REQUEST_PATTERNS.some((re) => re.test(text));
}
