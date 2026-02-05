import { Index } from "@upstash/vector";
import { API_LIMITS } from "@/lib/constants";
import { getRequiredEnv } from "@/lib/env";
import type { KnowledgeMetadata, SearchResult, KnowledgeCategory } from "@/lib/types";

// Re-export types for convenience
export type { KnowledgeMetadata, SearchResult, KnowledgeCategory };

// Initialize Upstash Vector client
const vectorIndex = new Index({
  url: getRequiredEnv("UPSTASH_VECTOR_REST_URL"),
  token: getRequiredEnv("UPSTASH_VECTOR_REST_TOKEN"),
});

export interface SearchOptions {
  category?: KnowledgeCategory;
  limit?: number;
  minScore?: number;
}

const CATEGORY_ALLOWLIST: KnowledgeCategory[] = [
  "varieties",
  "nutrition",
  "seasons",
  "exports",
  "cultivation",
  "general",
];

/**
 * Search the knowledge base for relevant information
 */
export async function searchKnowledge(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    category,
    limit = API_LIMITS.MAX_SEARCH_RESULTS,
    minScore = API_LIMITS.MIN_SEARCH_SCORE,
  } = options;

  try {
    // Build filter if category specified
    const normalizedCategory =
      category && CATEGORY_ALLOWLIST.includes(category) ? category : undefined;
    const filter = normalizedCategory ? `category = "${normalizedCategory}"` : undefined;

    // Query the vector database
    const results = await vectorIndex.query({
      data: query,
      topK: limit,
      filter,
      includeMetadata: true,
      includeData: true,
    });

    // Filter by minimum score and format results
    return results
      .filter((r) => (r.score ?? 0) >= minScore)
      .map((r) => {
        const meta = r.metadata as unknown as KnowledgeMetadata | undefined;
        return {
          content: meta?.content || (r.data as string) || "",
          score: r.score ?? 0,
          metadata: {
            source: meta?.source || "unknown",
            sourceUrl: meta?.sourceUrl,
            category: (meta?.category as KnowledgeCategory) || "general",
            content: meta?.content || "",
            dataDate: meta?.dataDate,
          },
        };
      });
  } catch (error) {
    console.error("Knowledge search error:", error);
    return [];
  }
}

/**
 * Get all unique categories in the knowledge base
 */
export async function getCategories(): Promise<KnowledgeCategory[]> {
  return ["varieties", "nutrition", "seasons", "exports", "cultivation", "general"];
}
