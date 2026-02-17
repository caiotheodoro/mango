import Firecrawl from "@mendable/firecrawl-js";
import { API_LIMITS } from "@/lib/constants";

export interface WebSearchResult {
  title: string;
  url: string;
  content?: string;
}

/** SDK returns SearchData: { web?: Array<SearchResultWeb | Document> } */
function normalizeWebItem(
  item: { url?: string; title?: string; description?: string; markdown?: string; metadata?: { url?: string; title?: string } }
): WebSearchResult {
  const url = item.url ?? item.metadata?.url ?? "";
  const title = item.title ?? item.metadata?.title ?? "Web result";
  const content = item.markdown ?? item.description ?? undefined;
  return { title, url, content };
}

/**
 * Search the web via Firecrawl. Returns normalized results for citation.
 * When FIRECRAWL_API_KEY is not set, returns an empty array (no throw).
 */
export async function searchWeb(
  query: string,
  options?: { limit?: number }
): Promise<WebSearchResult[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey?.trim()) {
    return [];
  }

  const limit = Math.min(
    options?.limit ?? API_LIMITS.MAX_WEB_SEARCH_RESULTS,
    10
  );

  try {
    const app = new Firecrawl({ apiKey });
    const data = await app.search(query, {
      limit,
      scrapeOptions: {
        formats: ["markdown"],
        onlyMainContent: true,
      },
    });

    const web = data?.web;
    if (!Array.isArray(web)) {
      return [];
    }

    const normalized = web.map((item) => normalizeWebItem(item as Parameters<typeof normalizeWebItem>[0]));
    // No fallback: only return results that have a usable URL from scraping
    return normalized.filter((r) => r.url.trim().length > 0);
  } catch (error) {
    console.error("Web search (Firecrawl) error:", error);
    return [];
  }
}
