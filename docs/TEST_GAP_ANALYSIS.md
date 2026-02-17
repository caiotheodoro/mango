# Test gap analysis: search fallback + validation

Comparison of implementation vs existing tests.

---

## 1. `src/lib/search/firecrawl.ts` vs `src/lib/search/__tests__/firecrawl.test.ts`

| Branch / edge case | Covered? | Notes |
|--------------------|----------|--------|
| `FIRECRAWL_API_KEY` empty string | Yes | Test: "returns empty array when FIRECRAWL_API_KEY is not set" |
| `FIRECRAWL_API_KEY` undefined | Yes | Test: "returns empty array when FIRECRAWL_API_KEY is undefined" |
| **`FIRECRAWL_API_KEY` whitespace-only** (e.g. `"   "`) | **Yes** | Added: "returns empty array when FIRECRAWL_API_KEY is whitespace-only" |
| **Limit option** (`options?.limit`) and **cap at 10** | **Yes** | Added: "caps limit at 10 when options.limit exceeds 10" |
| Client returns `{ web: [...] }` with 2 items | Yes | Normalized shape asserted |
| **Item with only `metadata.url` / `metadata.title`** (no top-level url/title) | **Yes** | Added: "normalizes items with only metadata.url and metadata.title" |
| **Item with no url, no title** → `url: ""`, `title: "Web result"` | **Yes** | Added: "uses fallbacks for item with no url or title" |
| Client returns `{}` (no web array) | Yes | "returns empty array when client returns no web array" |
| Client throws | Yes | "returns empty array on client error" |
| **`data` undefined** (e.g. client returns `undefined`) | **No** | `data?.web` → undefined; same as "no web array" path, but not explicit |

---

## 2. `src/lib/ai/tools.ts` (searchWeb execute)

| Branch / edge case | Covered? | Notes |
|--------------------|----------|--------|
| **searchWeb returns [] and no API key** → `success: false`, message "Web search is not configured" | **No** | No unit tests for chat tools execute paths |
| searchWeb returns [] but API key set → `success: true`, `results: []`, `totalResults: 0` | No | |
| searchWeb returns items → `content: r.content ?? r.title`, `sourceUrl: r.url \|\| null` | No | Tool layer not unit tested; only via firecrawl tests indirectly |
| **Result with empty `url`** → `sourceUrl: null` | **No** | |

---

## 3. `src/lib/ai/validation.ts`

| Branch / edge case | Covered? | Notes |
|--------------------|----------|--------|
| **`extractUrls`** (no matches, with matches, dedupe, trailing punctuation strip) | **Yes** | Added in `validation.test.ts` |
| **`validateCitations`** with `result.results` (searchWeb shape) | **Yes** | Added in `validation.test.ts` |
| **`validateCitations`** with `result.output?.results` (nested shape) | **Yes** | Added in `validation.test.ts` |
| **`validateCitations`** with direct `result.sourceUrl` | **Yes** | Added in `validation.test.ts` |
| **`validateCitations`** when all cited URLs are in tool results → valid | **Yes** | Added in `validation.test.ts` |
| **`validateCitations`** when some cited URLs not in tool results → invalid, unknownUrls | **Yes** | Added in `validation.test.ts` |
| **`validateCitations`** with `r?.sourceUrl` null/undefined (skip) | **Yes** | Added in `validation.test.ts` |
| **`logCitationWarnings`** when valid (no-op) | **Yes** | Added in `validation.test.ts` |
| **`logCitationWarnings`** when invalid (warns with context) | **Yes** | Added in `validation.test.ts` |

---

## Summary

- **firecrawl.ts**: Gaps covered by new tests (whitespace-only key, limit cap, metadata-only item, missing url/title fallbacks).
- **tools.ts searchWeb**: Still no unit tests for execute (would require mocking searchWeb or full tool harness); acceptable to leave to integration/e2e.
- **validation.ts**: Covered by new `src/lib/ai/__tests__/validation.test.ts` (extractUrls, validateCitations for both shapes, logCitationWarnings).
